'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { supabase } from '@/lib/supabase';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contractConfig';
import { ethers } from 'ethers';
import { Send, Loader2, ArrowLeft, Search, UserCheck, AlertTriangle, Upload, User, Ruler, Activity, Calendar, Ban } from 'lucide-react';
import Navbar from "@/components/Navbar";
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function TransferKoiPage() {
  const { account } = useWallet();
  const router = useRouter();
  const [loading, setLoading] = useState(false); // Loading transaksi
  const [pageLoading, setPageLoading] = useState(true); // Loading cek akses
  const [isSearching, setIsSearching] = useState(false);
  const [isBanned, setIsBanned] = useState(false);

  const [targetId, setTargetId] = useState('');
  const [koiData, setKoiData] = useState<any>(null);
  
  const [transferData, setTransferData] = useState({
    newOwner: '', newOwnerName: '', note: '', 
    newSize: '', newAge: '', newCondition: ''
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // CEK AKSES & BAN
  useEffect(() => {
    const checkAccess = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace('/login'); return; }

        const { data: profile } = await supabase.from('profiles').select('role, is_banned').eq('id', user.id).single();
        if (profile) {
            if (profile.is_banned) {
                setIsBanned(true);
                setPageLoading(false);
                return;
            }
        }
        setPageLoading(false);
    };
    checkAccess();
  }, [router]);


  const handleSearch = async () => {
    if (!targetId.trim()) return toast.error("Masukkan ID Koi!");
    setIsSearching(true);
    setKoiData(null);

    try {
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545/");
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

  const uploadPhoto = async () => {
      if (!photoFile) return "";
      const fileName = `transfer/${Date.now()}-${photoFile.name}`;
      const { error } = await supabase.storage.from('koi-assets').upload(fileName, photoFile);
      if (error) throw error;
      const { data } = supabase.storage.from('koi-assets').getPublicUrl(fileName);
      return data.publicUrl;
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return toast.error("Hubungkan Wallet!");
    
    if (!transferData.newOwner || !transferData.newOwnerName || !transferData.note) {
        return toast.error("Lengkapi Data Wajib!");
    }
    if (!ethers.isAddress(transferData.newOwner)) {
        return toast.error("Alamat Wallet Tidak Valid!");
    }

    if (!confirm(`Transfer hak milik ke ${transferData.newOwnerName}?`)) return;

    setLoading(true);
    const toastId = toast.loading("Memproses transfer...");

    try {
        let newPhotoUrl = "";
        if (photoFile) {
            toast.loading("Mengupload foto...", { id: toastId });
            newPhotoUrl = await uploadPhoto();
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        toast.loading("Konfirmasi di Metamask...", { id: toastId });

        const tx = await contract.transferOwnership(
            koiData.id,
            transferData.newOwner,
            transferData.newOwnerName,
            parseInt(transferData.newSize) || 0,
            transferData.newAge,
            transferData.newCondition,
            newPhotoUrl, 
            transferData.note
        );

        toast.loading("Menunggu konfirmasi blok...", { id: toastId });
        await tx.wait();

        toast.success("TRANSFER BERHASIL!", { id: toastId });
        
        setKoiData(null);
        setTargetId('');
        setTransferData({ newOwner: '', newOwnerName: '', note: '', newSize: '', newAge: '', newCondition: '' });
        setPhotoFile(null);

    } catch (err: any) {
        console.error(err);
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
          <div className="relative z-50"><Navbar /></div>
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
      <Toaster position="top-center" />

      <main className="max-w-4xl mx-auto px-4 py-10">
        
        <Link href="/" className="text-sm text-gray-500 hover:text-orange-600 flex items-center gap-1 mb-6"><ArrowLeft size={16} /> Kembali</Link>
        
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
            <div className="animate-fade-in-up bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                
                {/* Info Ikan */}
                <div className="bg-green-50 px-8 py-6 border-b border-green-100 flex items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-lg border border-green-200 overflow-hidden">
                         {koiData.photoUrl ? <img src={koiData.photoUrl} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-xs text-gray-400">No Foto</div>}
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-green-900">{koiData.variety}</h3>
                        <p className="text-sm text-green-700 font-mono">ID: {koiData.id}</p>
                    </div>
                </div>

                <form onSubmit={handleTransfer} className="p-8 space-y-8">
                    
                    {/* Bagian Wajib */}
                    <div>
                        <h4 className="font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2"><UserCheck size={18}/> Data Penerima (Wajib)</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Wallet Address Penerima</label>
                                <input required type="text" value={transferData.newOwner} onChange={(e) => setTransferData({...transferData, newOwner: e.target.value})} placeholder="0x..." className="w-full p-3 border rounded-xl font-mono text-sm" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Pemilik Baru / Breeder Baru</label>
                                <input required type="text" value={transferData.newOwnerName} onChange={(e) => setTransferData({...transferData, newOwnerName: e.target.value})} placeholder="Nama orang atau nama farm baru..." className="w-full p-3 border rounded-xl" />
                                <p className="text-xs text-gray-500 mt-1">Nama ini akan menggantikan nama di sertifikat.</p>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Catatan Transfer</label>
                                <textarea required rows={2} value={transferData.note} onChange={(e) => setTransferData({...transferData, note: e.target.value})} placeholder="Alasan transfer..." className="w-full p-3 border rounded-xl" />
                            </div>
                        </div>
                    </div>

                    {/* Bagian Opsional */}
                    <div>
                        <h4 className="font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2"><Activity size={18}/> Update Data Fisik (Opsional)</h4>
                        <p className="text-xs text-gray-500 mb-4">Biarkan kosong jika tidak ingin mengubah data fisik.</p>
                        
                        <div className="grid md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1"><Ruler size={14}/> Ukuran (cm)</label>
                                <input type="number" value={transferData.newSize} onChange={e => setTransferData({...transferData, newSize: e.target.value})} className="w-full p-3 border rounded-xl" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1"><Calendar size={14}/> Umur</label>
                                <input type="text" value={transferData.newAge} onChange={e => setTransferData({...transferData, newAge: e.target.value})} className="w-full p-3 border rounded-xl" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1"><Activity size={14}/> Kondisi</label>
                                <input type="text" value={transferData.newCondition} onChange={e => setTransferData({...transferData, newCondition: e.target.value})} className="w-full p-3 border rounded-xl" />
                            </div>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 p-6 rounded-xl text-center hover:bg-gray-50 cursor-pointer relative group">
                            <Upload className="mx-auto text-gray-400 mb-2 group-hover:text-green-600 transition" />
                            <span className="text-sm font-bold text-gray-600 block group-hover:text-green-700">Update Foto Ikan (Opsional)</span>
                            <span className="text-xs text-gray-400 block mt-1">{photoFile ? <b className="text-green-600">{photoFile.name}</b> : "Klik untuk pilih file"}</span>
                            <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading || !account || (koiData.currentOwner.toLowerCase() !== account?.toLowerCase())}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                        {loading ? "Memproses di Blockchain..." : "Kirim & Update Aset"}
                    </button>

                </form>
            </div>
        )}

      </main>
    </div>
  );
}