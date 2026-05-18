'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { supabase } from '@/lib/supabase';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contractConfig';
import { ethers } from 'ethers';
import { Upload, Save, Loader2, ArrowLeft, Ruler, Calendar, Activity, FileText, Search, Ban } from 'lucide-react';
import Navbar from "@/components/Navbar";
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function UpdateKoiPage() {
  const { account } = useWallet();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  
  const [targetId, setTargetId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentData, setCurrentData] = useState<any>(null);

  const [formData, setFormData] = useState({
    size: '',
    age: '',
    condition: '',
    updateNote: ''
  });

  const [files, setFiles] = useState<{ photo: File | null, contest: File | null }>({
    photo: null,
    contest: null
  });

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
    setCurrentData(null);

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
                toast.success("Data ditemukan!");
            }
            setCurrentData(data);
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

  const uploadToStorage = async (file: File) => {
    const fileName = `updates/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('koi-assets').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('koi-assets').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return toast.error("Connect Wallet Admin dulu!");
    if (!formData.updateNote) return toast.error("Wajib isi catatan update!");

    setLoading(true);
    const toastId = toast.loading("Memproses update...");

    try {
        let newPhotoUrl = "";
        let newContestUrl = "";

        if (files.photo) {
            toast.loading("Mengupload foto...", { id: toastId });
            newPhotoUrl = await uploadToStorage(files.photo);
        }
        if (files.contest) {
            toast.loading("Mengupload sertifikat...", { id: toastId });
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
            newContestUrl,
            formData.updateNote
        );

        toast.loading("Menunggu konfirmasi...", { id: toastId });
        await tx.wait();

        toast.success("DATA BERHASIL DIUPDATE!", { id: toastId });
        setFiles({ photo: null, contest: null });
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
          <div className="relative z-50"><Navbar /></div>
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
      <Toaster position="top-center" />

      <main className="max-w-4xl mx-auto px-4 py-10">
        <Link href="/" className="text-sm text-gray-500 hover:text-orange-600 flex items-center gap-1 mb-6"><ArrowLeft size={16} /> Kembali ke Admin Panel</Link>
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
            <form onSubmit={handleUpdate} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden p-8 space-y-8 animation-fade-in-up">
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <img src={currentData.photoUrl} className="w-16 h-16 rounded-lg object-cover bg-gray-200" alt="Current" />
                    <div><h3 className="font-bold text-lg">{currentData.variety}</h3><p className="text-sm text-gray-500">Pemilik: <span className="font-mono text-xs bg-gray-200 px-1 rounded">{currentData.currentOwner}</span></p></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div><label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Ruler size={16}/> Ukuran Baru (cm)</label><input required type="number" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Calendar size={16}/> Umur Sekarang</label><input type="text" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Contoh: Sansai (3 Tahun)" /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Activity size={16}/> Kondisi Fisik</label><input required type="text" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-2 border-dashed border-gray-300 p-6 rounded-xl text-center hover:bg-gray-50 cursor-pointer relative"><Upload className="mx-auto text-gray-400 mb-2" /><span className="text-sm font-bold text-gray-600 block">Update Foto Ikan (Opsional)</span><span className="text-xs text-gray-400 block mt-1">{files.photo ? files.photo.name : "Biarkan kosong jika tidak ganti"}</span><input type="file" accept="image/*" onChange={e => setFiles({...files, photo: e.target.files?.[0] || null})} className="absolute inset-0 opacity-0 cursor-pointer" /></div>
                    <div className="border-2 border-dashed border-gray-300 p-6 rounded-xl text-center hover:bg-gray-50 cursor-pointer relative"><Upload className="mx-auto text-gray-400 mb-2" /><span className="text-sm font-bold text-gray-600 block">Sertifikat Lomba Baru (Opsional)</span><span className="text-xs text-gray-400 block mt-1">{files.contest ? files.contest.name : "Upload jika menang kontes"}</span><input type="file" accept="image/*" onChange={e => setFiles({...files, contest: e.target.files?.[0] || null})} className="absolute inset-0 opacity-0 cursor-pointer" /></div>
                </div>

                <div><label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><FileText size={16}/> Catatan Update (Wajib)</label><textarea required rows={2} value={formData.updateNote} onChange={e => setFormData({...formData, updateNote: e.target.value})} placeholder="Contoh: Ikan tumbuh sehat..." className="w-full p-3 border border-gray-300 rounded-xl resize-none"/></div>

                <button type="submit" disabled={loading || !account} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition disabled:opacity-50">{loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} {loading ? "Menyimpan ke Blockchain..." : "Simpan Perubahan"}</button>
            </form>
        )}

      </main>
    </div>
  );
}