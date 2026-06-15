'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { supabase } from '@/lib/supabase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contractConfig';
import { ethers } from 'ethers';
import { Upload, Save, Loader2, ArrowLeft, Ruler, Calendar, Activity, FileText, Search, Ban, User, Flame, AlertTriangle } from 'lucide-react';
import Navbar from "@/components/Navbar";
import BackButton from '@/components/BackButton';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import WalletLinkGate, { useWalletLinkCheck } from '@/components/WalletLinkGate';

export default function UpdateKoiPage() {
  const { account } = useWallet();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [showWalletGate, setShowWalletGate] = useState(false);
  const [showBurnModal, setShowBurnModal] = useState(false);
  
  const [targetId, setTargetId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentData, setCurrentData] = useState<any>(null);
  const [ownerName, setOwnerName] = useState<string>('Unknown');

  const [formData, setFormData] = useState({
    size: '',
    age: '',
    condition: '',
    updateNote: ''
  });

  const [files, setFiles] = useState<{ photo: File | null, cert: File | null, contest: File | null }>({
    photo: null,
    cert: null,
    contest: null
  });

  const { user: authUser, loading: authLoading } = useRequireAuth();

  // Cek Ban setelah auth siap
  useEffect(() => {
    if (!authUser) return;
    supabase.from('profiles').select('is_banned').eq('id', authUser.id).single()
      .then(({ data: profile }) => {
        if (profile?.is_banned) setIsBanned(true);
        setPageLoading(false);
      });
  }, [authUser]);

  // Cek jika ada URL param ?id=...
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        setTargetId(id);
      }
    }
  }, []);

  const handleSearch = async () => {
    if (!targetId.trim()) return toast.error("Masukkan ID Koi!");
    if (!window.ethereum) return toast.error("MetaMask tidak ditemukan! Install MetaMask terlebih dahulu.");
    setIsSearching(true);
    setCurrentData(null);

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const data = await contract.getKoi(targetId);

        if (!data || !data.id) {
            toast.error("Data tidak ditemukan!");
        } else {
            if (account && data.currentOwner.toLowerCase() !== account.toLowerCase()) {
                toast.error("PERINGATAN: Anda bukan pemilik ikan ini!");
            } else {
                toast.success("Data ditemukan!");
            }
            setCurrentData(data);
            
            // Mengambil nama pemilik dari Supabase
            try {
                const { data: walletData } = await supabase
                    .from('user_wallets')
                    .select('user_id')
                    .eq('wallet_address', data.currentOwner.toLowerCase())
                    .single();
                
                if (walletData?.user_id) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('full_name, store_name')
                        .eq('id', walletData.user_id)
                        .single();
                    if (profileData) {
                        setOwnerName(profileData.store_name || profileData.full_name || 'Unknown');
                    }
                } else {
                    setOwnerName('Unknown');
                }
            } catch (e) {
                console.error("Gagal mengambil nama pemilik");
                setOwnerName('Unknown');
            }

            setFormData({
                size: Number(data.size).toString(),
                age: data.age,
                condition: data.condition,
                updateNote: ''
            });
        }
    } catch (err) {
        console.error(err);
        toast.error("Gagal mengambil data.");
    } finally {
        setIsSearching(false);
    }
  };

  const handleFileChange = (e: any, type: 'photo' | 'cert' | 'contest') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'cert' && !file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error("Format tidak valid! Hanya gambar atau PDF untuk sertifikat.");
        e.target.value = null;
        return;
      }
      if (type !== 'cert' && !file.type.startsWith('image/')) {
        toast.error("Format tidak valid! Hanya file gambar yang diperbolehkan.");
        e.target.value = null;
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Ukuran file terlalu besar! Maksimal 5MB.");
        e.target.value = null;
        return;
      }
      setFiles({ ...files, [type]: file });
    } else {
      setFiles({ ...files, [type]: null });
    }
  };

  const uploadToStorage = async (file: File) => {
    const fileName = `updates/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('koi-assets').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('koi-assets').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const { isLinked, recheckLink } = useWalletLinkCheck(authUser?.id || '', account);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return toast.error("Connect Wallet Admin dulu!");
    if (!formData.updateNote) return toast.error("Wajib isi catatan update!");

    // CEK WALLET TERKAIT
    if (isLinked === false) {
      setShowWalletGate(true);
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Memproses update...");

    try {
        let newPhotoUrl = "";
        let newCertUrl = "";
        let newContestUrl = "";

        if (files.photo) {
            toast.loading("Mengupload foto...", { id: toastId });
            newPhotoUrl = await uploadToStorage(files.photo);
        }
        if (files.cert) {
            toast.loading("Mengupload sertifikat asli...", { id: toastId });
            newCertUrl = await uploadToStorage(files.cert);
        }
        if (files.contest) {
            toast.loading("Mengupload sertifikat kontes...", { id: toastId });
            newContestUrl = await uploadToStorage(files.contest);
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        toast.loading("Konfirmasi di Metamask...", { id: toastId });

        const tx = await contract.updateKoiStats(
            targetId,
            parseInt(formData.size),
            formData.age,
            formData.condition,
            newPhotoUrl,
            newCertUrl,
            newContestUrl,
            (formData.condition ? `Kondisi: ${formData.condition} | ` : "") + formData.updateNote
        );

        toast.loading("Menunggu konfirmasi...", { id: toastId });
        await tx.wait();

        // SINKRONISASI SUPABASE (Agar di koleksi user juga update!) menggunakan API bypass RLS
        const syncRes = await fetch('/api/sync-transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                koiId: targetId,
                newSize: parseInt(formData.size),
                newPhotoUrl: newPhotoUrl || currentData.photoUrl
            })
        });

        if (!syncRes.ok) {
            const syncErr = await syncRes.json();
            console.error("Supabase Update Error:", syncErr);
            toast.error("Peringatan: Gagal sinkronisasi data ke server Web2! " + (syncErr.error || 'Terjadi kesalahan'));
        }

        toast.success("DATA BERHASIL DIUPDATE!", { id: toastId });
        setFiles({ photo: null, cert: null, contest: null });
        handleSearch(); 

    } catch (err: any) {
        console.error(err);
        toast.error("Gagal: " + (err.reason || err.message), { id: toastId });
    } finally {
        setLoading(false);
    }
  };

  const handleBurn = async () => {
    if (!account) return toast.error("Connect Wallet Admin dulu!");
    if (!currentData) return;

    if (isLinked === false) {
      setShowWalletGate(true);
      setShowBurnModal(false);
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Memproses laporan kematian (Burn NFT)...");

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        toast.loading("Konfirmasi di Metamask...", { id: toastId });

        // Menggunakan fungsi transferOwnership ke Null Address untuk Burn
        const NULL_ADDRESS = "0x000000000000000000000000000000000000dEaD";
        
        const tx = await contract.transferOwnership(
            targetId,
            NULL_ADDRESS,
            "ALMARHUM (DECEASED)",
            currentData.size,
            currentData.age,
            "Mati",
            currentData.photoUrl,
            "Ikan dilaporkan telah mati (NFT Burned)"
        );

        toast.loading("Menunggu konfirmasi blockchain...", { id: toastId });
        await tx.wait();

        // UPDATE SUPABASE UNTUK BURN (Kosongkan wallet) menggunakan API bypass RLS
        const syncRes = await fetch('/api/sync-transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                koiId: targetId,
                newWallet: NULL_ADDRESS,
                newCondition: "Mati (Deceased)"
            })
        });

        if (!syncRes.ok) {
            const syncErr = await syncRes.json();
            console.error("Supabase Update Error:", syncErr);
            toast.error("Peringatan: Gagal sinkronisasi data kematian ke server Web2! " + (syncErr.error || 'Terjadi kesalahan'));
        }

        toast.success("BERHASIL! Aset telah dikunci secara permanen.", { id: toastId });
        setShowBurnModal(false);
        handleSearch(); 

    } catch (err: any) {
        console.error(err);
        toast.error("Gagal: " + (err.reason || err.message), { id: toastId });
    } finally {
        setLoading(false);
    }
  };

  if (pageLoading) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;

  if (isBanned) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
          <Navbar />
          <div className="flex-grow flex flex-col items-center justify-center p-4 text-center z-0">
              <div className="bg-red-50 p-10 rounded-2xl shadow-xl border border-red-200 max-w-md animate-fade-in-up">
                  <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Ban className="text-red-600 w-10 h-10" /></div>
                  <h1 className="text-2xl font-bold text-red-700 mb-2">Akses Ditolak</h1>
                  <p className="text-gray-600 mb-8">Akun Anda dibekukan. Tidak dapat melakukan update data.</p>
                  <Link href="/report" className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold">Hubungi Admin</Link>
              </div>
          </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10">
        <BackButton />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Update Pertumbuhan Ikan</h1>
        <p className="text-gray-500 mb-8">Perbarui data fisik, foto terkini, atau prestasi baru ke Blockchain.</p>

        {/* STEP 1: CARI IKAN */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
            <label className="block text-sm font-bold text-gray-700 mb-2">Cari ID Koi</label>
            <div className="flex gap-4">
                <input type="text" value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="Contoh: KOI-2025-888" className="flex-grow p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"/>
                <button onClick={handleSearch} disabled={isSearching} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-70">{isSearching ? "Mencari..." : "Cari Data"}</button>
            </div>
        </div>

        {/* STEP 2: FORM */}
        {currentData && (
            <form onSubmit={handleUpdate} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden p-8 sm:p-10 space-y-10 animate-fade-in-up transition-all">
                {/* INFO IKAN & PEMILIK */}
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                    <img src={currentData.photoUrl} className="w-24 h-24 rounded-2xl object-cover shadow-md bg-white p-1" alt="Current" />
                    <div className="text-center sm:text-left">
                        <h3 className="font-black text-2xl text-gray-900 mb-1">{currentData.variety}</h3>
                        <p className="text-sm font-medium text-gray-600 mb-2 flex items-center justify-center sm:justify-start gap-1">
                            <User size={14} className="text-blue-500" /> Pemilik: <span className="font-bold text-gray-800">{ownerName}</span>
                        </p>
                        <p className="text-xs text-gray-500 bg-white/60 px-3 py-1.5 rounded-lg border border-gray-200 inline-block font-mono">
                            {currentData.currentOwner}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><Ruler size={18} className="text-blue-500"/> Ukuran Baru (cm)</label>
                        <input required type="number" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><Calendar size={18} className="text-blue-500"/> Umur Sekarang</label>
                        <input type="text" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-semibold" placeholder="Contoh: Sansai (3 Tahun)" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><Activity size={18} className="text-blue-500"/> Kondisi Terkini</label>
                        <input required type="text" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* FOTO */}
                    <div>
                        <label className="font-bold text-sm block mb-2">Update Foto Terbaru (Opsional)</label>
                        <label className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                            <Upload className="text-gray-400 mr-2" size={24} />
                            <span className="text-sm text-gray-500">
                                {files.photo ? files.photo.name : "Pilih File JPG/PNG"}
                            </span>
                            <input type="file" className="hidden" accept="image/*" 
                                onChange={(e) => handleFileChange(e, 'photo')} />
                        </label>
                    </div>

                    {/* SERTIFIKAT FISIK ASLI */}
                    <div>
                        <label className="font-bold text-sm block mb-2 text-orange-700">Upload Sertifikat Asli (Susulan)</label>
                        <label className="w-full flex items-center justify-center p-4 border-2 border-dashed border-orange-300 bg-orange-50 rounded-xl cursor-pointer hover:bg-orange-100 transition">
                            <FileText className="text-orange-500 mr-2" size={24} />
                            <span className="text-sm text-orange-600 font-medium">
                                {files.cert ? files.cert.name : "Pilih File Sertifikat Asli (Jika Ada)"}
                            </span>
                            <input type="file" className="hidden" accept="image/*,application/pdf"
                                onChange={(e) => handleFileChange(e, 'cert')} />
                        </label>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 p-8 rounded-2xl text-center hover:bg-purple-50 hover:border-purple-300 transition-colors cursor-pointer relative group">
                        <Upload className="mx-auto text-gray-400 group-hover:text-purple-500 transition-colors mb-3 w-8 h-8" />
                        <span className="text-base font-bold text-gray-700 block">Sertifikat Lomba Baru (Opsional)</span>
                        <span className="text-sm text-gray-400 block mt-1">{files.contest ? <span className="text-purple-600 font-medium">{files.contest.name}</span> : "Upload piagam jika baru menang kontes"}</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'contest')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><FileText size={18} className="text-blue-500"/> Catatan Update (Wajib Ditulis)</label>
                    <textarea required rows={3} value={formData.updateNote} onChange={e => setFormData({...formData, updateNote: e.target.value})} placeholder="Ceritakan apa saja yang berubah... (Contoh: Ikan tumbuh sehat dan warna makin pekat)" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all resize-none font-medium"/>
                </div>

                <button type="submit" disabled={loading || !account} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0">
                    {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Save className="w-6 h-6" />} 
                    {loading ? "Menyimpan ke Blockchain..." : "Simpan Perubahan & Transaksi"}
                </button>

                {/* TOMBOL BURN / MATI */}
                <div className="pt-8 mt-8 border-t border-gray-200">
                    <button 
                        type="button" 
                        onClick={() => setShowBurnModal(true)}
                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <Flame size={20} /> Lapor Ikan Mati (Burn NFT)
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-2">Gunakan opsi ini HANYA jika aset fisik (ikan) sudah mati.</p>
                </div>
            </form>
        )}

      </main>

      {showWalletGate && (
        <WalletLinkGate
          userId={authUser?.id || ''}
          walletAddress={account}
          onLinked={() => { setShowWalletGate(false); recheckLink(); toast.success('Wallet ditautkan! Silakan coba lagi.'); }}
          onDismiss={() => setShowWalletGate(false)}
        />
      )}

      {/* MODAL KONFIRMASI BURN */}
      {showBurnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-red-100 transform scale-100 transition-transform">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-2xl font-black text-center text-gray-900 mb-2">Peringatan Keras!</h3>
                <p className="text-center text-gray-600 mb-6">
                    Anda akan melaporkan bahwa <b className="text-gray-900">{currentData?.variety} (ID: {targetId})</b> telah MATI. 
                    Tindakan ini akan <b>MENGUNCI PERMANEN</b> NFT sertifikat ini di Blockchain. Ikan ini tidak akan pernah bisa ditransfer atau diupdate lagi setelah ini.
                </p>
                
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-8">
                    <p className="text-sm text-red-700 font-semibold text-center">Apakah Anda YAKIN 100% ikan ini sudah mati?</p>
                </div>

                <div className="flex gap-4">
                    <button 
                        disabled={loading}
                        onClick={() => setShowBurnModal(false)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition"
                    >
                        Batal
                    </button>
                    <button 
                        disabled={loading}
                        onClick={handleBurn}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5"/> : <Flame size={18} />}
                        Ya, Bakar NFT
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}