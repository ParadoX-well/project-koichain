'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { supabase } from '@/lib/supabase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contractConfig';
import { ethers } from 'ethers';
import { Send, Loader2, ArrowLeft, Search, UserCheck, AlertTriangle, Upload, User, Ruler, Activity, Calendar, Ban } from 'lucide-react';
import Navbar from "@/components/Navbar";
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import WalletLinkGate, { useWalletLinkCheck } from '@/components/WalletLinkGate';

export default function TransferKoiPage() {
  const { account } = useWallet();
  const router = useRouter();
  const [loading, setLoading] = useState(false); // Loading transaksi
  const [pageLoading, setPageLoading] = useState(true); // Loading cek akses
  const [isSearching, setIsSearching] = useState(false);
  const [isResolvingOwner, setIsResolvingOwner] = useState(false);
  const [resolvedWallet, setResolvedWallet] = useState<string>('');
  const [isBanned, setIsBanned] = useState(false);
  const [showWalletGate, setShowWalletGate] = useState(false);

  const userUpdateProfile = async (updates: any) => {
    try {
      const res = await fetch('/api/user/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
      const data = await res.json();
      if (!res.ok) return { error: new Error(data.error || 'Terjadi kesalahan') };
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const [targetId, setTargetId] = useState('');
  const [koiData, setKoiData] = useState<any>(null);
  const [ownerName, setOwnerName] = useState<string>('Unknown');
  
  const [transferData, setTransferData] = useState({
    newOwner: '', newOwnerName: '', note: '', 
    newSize: '', newAge: '', newCondition: ''
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const { user: authUser, loading: authLoading } = useRequireAuth();
  const { isLinked, recheckLink } = useWalletLinkCheck(authUser?.id || '', account);

  // Cek Ban setelah auth siap
  useEffect(() => {
    if (!authUser) return;
    supabase.from('profiles').select('is_banned').eq('id', authUser.id).single()
      .then(({ data: profile }) => {
        if (profile?.is_banned) setIsBanned(true);
        setPageLoading(false);
      });
  }, [authUser]);

  // Cek jika ada URL param ?id=... (dipanggil dari halaman koleksi)
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
    setKoiData(null);

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
                toast.success("Data ditemukan.");
            }
            setKoiData(data);
            
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

            setTransferData(prev => ({
                ...prev,
                newSize: Number(data.size).toString(),
                newAge: data.age,
                newCondition: data.condition
            }));
        }
    } catch (err) {
        console.error(err);
        toast.error("Gagal koneksi blockchain.");
    } finally {
        setIsSearching(false);
    }
  };

  const handlePhotoChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Format tidak valid! Hanya file gambar yang diperbolehkan.");
        e.target.value = null;
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Ukuran file terlalu besar! Maksimal 5MB.");
        e.target.value = null;
        return;
      }
      setPhotoFile(file);
    } else {
      setPhotoFile(null);
    }
  };

  const uploadPhoto = async () => {
      if (!photoFile) return { publicUrl: "", fileName: "" };
      const fileName = `transfer/${Date.now()}-${photoFile.name}`;
      const formData = new FormData();
      formData.append('file', photoFile);
      formData.append('bucket', 'koi-assets');
      formData.append('fileName', fileName);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const upData = await res.json();
      if (!res.ok) throw new Error(upData.error || 'Gagal upload foto ikan');
      return { publicUrl: upData.publicUrl, fileName };
  };

    const handleResolveOwner = async () => {
    const input = transferData.newOwner.trim();
    if (!input) return toast.error("Masukkan Email atau Wallet Address");

    if (input.includes('@')) {
        setIsResolvingOwner(true);
        const toastIdEmail = toast.loading("Mencari Wallet untuk Email ini...");
        try {
            const res = await fetch('/api/resolve-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: input })
            });
            const data = await res.json();
            
            if (!res.ok) {
                toast.dismiss(toastIdEmail);
                setIsResolvingOwner(false);
                setResolvedWallet('');
                setTransferData(prev => ({ ...prev, newOwnerName: '' }));
                return toast.error(data.error || "Gagal mencari pengguna");
            }
            
            setResolvedWallet(data.wallet_address);
            
            if (data.user_name) {
                setTransferData(prev => ({ ...prev, newOwnerName: data.user_name }));
            }
            
            toast.success("Akun Ditemukan!", { id: toastIdEmail });
        } catch (err) {
            toast.dismiss(toastIdEmail);
            toast.error("Koneksi server gagal");
        } finally {
            setIsResolvingOwner(false);
        }
    } else {
        if (!ethers.isAddress(input)) {
            return toast.error("Format Wallet Tidak Valid!");
        }
        setResolvedWallet(input);
        toast.success("Format Wallet Valid!");
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return toast.error("Hubungkan Wallet!");
    
    if (!transferData.newOwner || !transferData.newOwnerName || !transferData.note) {
        return toast.error("Lengkapi Data Wajib!");
    }

    let finalOwner = transferData.newOwner.trim();
    let resolvedEmail = false;

    // JIKA INPUT ADALAH EMAIL, RESOLVE KE WALLET DULU ATAU GUNAKAN YANG SUDAH DI-RESOLVE
    if (resolvedWallet) {
        finalOwner = resolvedWallet;
        resolvedEmail = true;
    } else if (finalOwner.includes('@')) {
        const toastIdEmail = toast.loading("Mencari Wallet untuk Email ini...");
        try {
            const res = await fetch('/api/resolve-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: finalOwner })
            });
            const data = await res.json();
            
            if (!res.ok) {
                toast.dismiss(toastIdEmail);
                return toast.error(data.error || "Gagal mencari pengguna");
            }
            
            finalOwner = data.wallet_address;
            resolvedEmail = true;
            
            // Auto-fill nama pemilik baru
            if (data.user_name) {
                setTransferData(prev => ({ ...prev, newOwnerName: data.user_name }));
            }
            
            toast.success("Wallet Ditemukan!", { id: toastIdEmail });
        } catch (err) {
            toast.dismiss(toastIdEmail);
            return toast.error("Koneksi server gagal");
        }
    }

    if (!ethers.isAddress(finalOwner)) {
        return toast.error("Alamat Wallet Tidak Valid!");
    }

    // CEK WALLET TERKAIT
    if (isLinked === false) {
      setShowWalletGate(true);
      return;
    }

    if (!confirm(`Transfer hak milik ke ${transferData.newOwnerName} ${resolvedEmail ? `\n(Wallet: ${finalOwner})` : ''}?`)) return;

    setLoading(true);
    const toastId = toast.loading("Memproses transfer...");

    let uploadedFileName = "";

    try {
        let newPhotoUrl = "";
        if (photoFile) {
            toast.loading("Mengupload foto...", { id: toastId });
            const uploadRes = await uploadPhoto();
            newPhotoUrl = uploadRes.publicUrl;
            uploadedFileName = uploadRes.fileName;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        toast.loading("Konfirmasi di Metamask...", { id: toastId });

        const tx = await contract.transferOwnership(
            koiData.id,
            finalOwner,
            transferData.newOwnerName,
            parseInt(transferData.newSize) || 0,
            transferData.newAge,
            transferData.newCondition,
            newPhotoUrl, 
            (transferData.newCondition ? `Kondisi: ${transferData.newCondition} | ` : "") + transferData.note
        );

        toast.loading("Menunggu konfirmasi blok...", { id: toastId });
        await tx.wait();

        // Sinkronisasi data Web2 (Update tabel agar masuk ke koleksi dompet baru) menggunakan API bypass RLS
        const syncRes = await fetch('/api/sync-transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                koiId: koiData.id,
                newWallet: finalOwner,
                newSize: transferData.newSize || 0,
                newPhotoUrl: newPhotoUrl || koiData.photoUrl
            })
        });

        if (!syncRes.ok) {
            const syncErr = await syncRes.json();
            console.error("Supabase Update Error:", syncErr);
            toast.error("Peringatan: Gagal sinkronisasi kepemilikan ke server Web2! " + (syncErr.error || 'Terjadi kesalahan'));
        } else {
            // Tambahkan record total_transfers untuk user yang mentransfer (Leaderboard)
            try {
                if (authUser?.id) {
                    const { data: prof } = await supabase.from('profiles').select('total_transfers').eq('id', authUser.id).single();
                    if (prof) {
                        await userUpdateProfile({ total_transfers: (prof.total_transfers || 0) + 1 });
                    }
                }
            } catch (e) {
                console.error("Gagal update total_transfers", e);
            }
        }

        toast.success("TRANSFER BERHASIL!", { id: toastId });
        
        setKoiData(null);
        setTargetId('');
        setTransferData({ newOwner: '', newOwnerName: '', note: '', newSize: '', newAge: '', newCondition: '' });
        setPhotoFile(null);

    } catch (err: any) {
        console.error(err);
        if (uploadedFileName) {
            toast.loading("Transaksi Gagal. Membersihkan file...", { id: toastId });
            await fetch('/api/upload', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bucket: 'koi-assets', fileNames: [uploadedFileName] })
            });
        }
        toast.error("Gagal: " + (err.reason || err.message), { id: toastId });
    } finally {
        setLoading(false);
    }
  };

  if (pageLoading) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;

  // TAMPILAN JIKA BAN
  if (isBanned) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
          <Navbar />
          <div className="flex-grow flex flex-col items-center justify-center p-4 text-center z-0">
              <div className="bg-red-50 p-10 rounded-2xl shadow-xl border border-red-200 max-w-md animate-fade-in-up">
                  <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Ban className="text-red-600 w-10 h-10" /></div>
                  <h1 className="text-2xl font-bold text-red-700 mb-2">Akses Ditolak</h1>
                  <p className="text-gray-600 mb-8">Akun Anda dibekukan. Tidak dapat melakukan transfer.</p>
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
        
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Send className="text-green-600" /> Transfer & Update
            </h1>
            <p className="text-gray-500">Pindahkan hak milik sekaligus perbarui data fisik ikan.</p>
        </div>

        {/* STEP 1: CARI */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-8">
            <div className="flex gap-3">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                    <input type="text" value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="Masukkan ID Koi (Contoh: KOI-NEW-001)" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <button onClick={handleSearch} disabled={isSearching} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-70 flex items-center gap-2">
                    {isSearching ? <Loader2 className="animate-spin w-5 h-5"/> : "Cari"}
                </button>
            </div>
        </div>

        {/* STEP 2: FORM */}
        {koiData && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-up transition-all">
                {/* INFO IKAN & PEMILIK */}
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-orange-50 to-amber-50 p-6 sm:p-10 border-b border-orange-100">
                    <img src={koiData.photoUrl} className="w-28 h-28 rounded-2xl object-cover shadow-md bg-white p-1" alt="Current" />
                    <div className="text-center sm:text-left flex-grow">
                        <h3 className="font-black text-3xl text-gray-900 mb-2">{koiData.variety}</h3>
                        <p className="text-sm font-medium text-gray-600 mb-2 flex items-center justify-center sm:justify-start gap-2">
                            <User size={16} className="text-orange-500" /> Pemilik Saat Ini: <span className="font-bold text-gray-800 text-base">{ownerName}</span>
                        </p>
                        <p className="text-xs text-gray-500 bg-white/60 px-3 py-1.5 rounded-lg border border-gray-200 inline-block font-mono">
                            {koiData.currentOwner}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleTransfer} className="p-8 sm:p-10 space-y-10">
                    
                    {/* BAGIAN TRANSFER KEPEMILIKAN */}
                    <div>
                        <h4 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2 border-b pb-2"><UserCheck className="text-orange-500"/> Kepemilikan Baru</h4>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Wallet Address Penerima (Atau Alamat Email)</label>
                                <div className="flex gap-2">
                                    <input required type="text" value={transferData.newOwner} onChange={(e) => { setTransferData({...transferData, newOwner: e.target.value}); setResolvedWallet(''); }} placeholder="0x... ATAU user@email.com" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all font-mono text-sm" />
                                    <button type="button" onClick={handleResolveOwner} disabled={isResolvingOwner || !transferData.newOwner} className="bg-orange-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-orange-700 transition disabled:opacity-70 whitespace-nowrap">
                                        {isResolvingOwner ? <Loader2 className="animate-spin w-5 h-5 mx-auto"/> : "Cek Akun"}
                                    </button>
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Pemilik Baru / Breeder Baru</label>
                                <input required type="text" value={transferData.newOwnerName} onChange={(e) => setTransferData({...transferData, newOwnerName: e.target.value})} placeholder={resolvedWallet ? "Nama terisi otomatis" : "Contoh: Budi Susanto atau Koi Farm ID..."} readOnly={!!resolvedWallet} className={`w-full p-4 border border-gray-200 rounded-xl transition-all font-semibold ${resolvedWallet ? 'bg-gray-100 text-gray-500 focus:ring-0 cursor-not-allowed' : 'bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500'}`} />
                                {resolvedWallet && <p className="text-xs text-orange-600 font-medium mt-2">Nama terisi otomatis berdasarkan data pencarian akun di atas.</p>}
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Catatan Transfer (Wajib)</label>
                                <textarea required rows={3} value={transferData.note} onChange={(e) => setTransferData({...transferData, note: e.target.value})} placeholder="Alasan pemindahan kepemilikan... (Contoh: Terjual di acara pelelangan)" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all font-medium resize-none" />
                            </div>
                        </div>
                    </div>

                    {/* BAGIAN UPDATE FISIK */}
                    <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
                        <h4 className="text-lg font-black text-gray-800 mb-2 flex items-center gap-2"><Ruler className="text-blue-500"/> Update Fisik & Kondisi (Opsional)</h4>
                        <p className="text-sm text-gray-500 mb-6">Jika ada perubahan pada fisik ikan sejak sertifikat terakhir, silakan perbarui di sini.</p>
                        
                        <div className="grid md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ukuran (cm)</label>
                                <input type="number" value={transferData.newSize} onChange={e => setTransferData({...transferData, newSize: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Umur</label>
                                <input type="text" value={transferData.newAge} onChange={e => setTransferData({...transferData, newAge: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kondisi</label>
                                <input type="text" value={transferData.newCondition} onChange={e => setTransferData({...transferData, newCondition: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold" />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Update Foto Terbaru (Opsional)</label>
                            <div className="border-2 border-dashed border-gray-300 p-6 rounded-xl text-center hover:bg-white transition-colors cursor-pointer relative group bg-gray-50/50">
                                <Upload className="mx-auto text-gray-400 group-hover:text-blue-500 transition-colors mb-2 w-6 h-6" />
                                <span className="text-sm font-bold text-gray-600 block">{photoFile ? <span className="text-blue-600">{photoFile.name}</span> : "Pilih File Gambar..."}</span>
                                <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200 flex items-start gap-4">
                        <AlertTriangle className="text-yellow-600 shrink-0 mt-1" />
                        <div>
                            <h5 className="font-bold text-yellow-800">Perhatian: Transaksi Final</h5>
                            <p className="text-sm text-yellow-700 mt-1">Setelah proses transfer ini dikonfirmasi, Anda akan kehilangan hak akses administratif terhadap NFT sertifikat ikan ini. Proses ini bersifat permanen.</p>
                        </div>
                    </div>

                    <button type="submit" disabled={loading || !account} className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 text-lg">
                        {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Send className="w-6 h-6" />}
                        {loading ? "Memproses Transaksi..." : "Transfer Hak Milik Sekarang"}
                    </button>
                </form>
            </div>
        )}

      </main>

      {showWalletGate && (
        <WalletLinkGate
          userId={authUser?.id || ''}
          walletAddress={account}
          onLinked={() => { setShowWalletGate(false); recheckLink(); toast.success('Wallet ditautkan! Silakan klik Transfer lagi.'); }}
          onDismiss={() => setShowWalletGate(false)}
        />
      )}
    </div>
  );
}