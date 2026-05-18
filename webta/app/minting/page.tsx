'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { supabase } from '@/lib/supabase';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contractConfig';
import { ethers } from 'ethers';
import { Upload, Save, Loader2, ArrowLeft, QrCode as QrIcon, ShieldAlert, GitMerge, Ban } from 'lucide-react';
import Navbar from "@/components/Navbar";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import QRCode from 'react-qr-code';

export default function MintKoiPage() {
  const { account } = useWallet();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [processLoading, setProcessLoading] = useState(false);
  const [mintedData, setMintedData] = useState<any>(null);
  const [isBanned, setIsBanned] = useState(false); // State Ban

  const [formData, setFormData] = useState({
    id: '',
    variety: '',
    breeder: '',
    gender: 'Tidak Diketahui',
    age: '',
    size: '',
    condition: '',
    fatherId: '', 
    motherId: ''
  });

  const [files, setFiles] = useState<{ photo: File | null, cert: File | null, contest: File | null }>({
    photo: null,
    cert: null,
    contest: null
  });

  // Simpan path file yang berhasil diupload untuk keperluan Rollback
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([]);

  // 1. CEK AKSES & BAN
  useEffect(() => {
    const checkAccess = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace('/login'); return; }

        const { data: profile } = await supabase.from('profiles').select('role, is_banned').eq('id', user.id).single();
        
        if (profile) {
            // Cek Ban duluan
            if (profile.is_banned) {
                setIsBanned(true);
                setLoading(false);
                return;
            }

            if (!['admin', 'breeder', 'seller'].includes(profile.role)) {
                toast.error("Akses Ditolak! Hanya Mitra yang boleh upload.");
                router.replace('/dashboard-user');
                return;
            }
        }
        setLoading(false);
    };
    checkAccess();
  }, [router]);

  // ... (Fungsi handleInputChange, handleFileChange, uploadToStorage, rollbackFiles sama seperti sebelumnya)

  const handleInputChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e: any, type: 'photo' | 'cert' | 'contest') => {
    if (e.target.files?.[0]) setFiles({ ...files, [type]: e.target.files[0] });
  };

  const uploadToStorage = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random()}.${fileExt}`;
    
    const { error } = await supabase.storage.from('koi-assets').upload(fileName, file);
    if (error) throw error;

    // Simpan path file agar bisa dihapus nanti jika gagal
    setUploadedPaths(prev => [...prev, fileName]);

    const { data } = supabase.storage.from('koi-assets').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // FUNGSI ROLLBACK (HAPUS FILE JIKA GAGAL)
  const rollbackFiles = async () => {
      if (uploadedPaths.length > 0) {
          console.log("Melakukan Rollback File...", uploadedPaths);
          await supabase.storage.from('koi-assets').remove(uploadedPaths);
          setUploadedPaths([]); // Reset
      }
  };


  // 2. PROSES MINTING UTAMA
  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return toast.error("Hubungkan Wallet Admin/Mitra!");
    if (!files.photo) return toast.error("Foto Ikan Wajib Diisi!");

    setProcessLoading(true);
    setUploadedPaths([]); 
    
    const toastId = toast.loading("Memulai proses...");

    try {
      // A. Upload File ke Supabase
      toast.loading("Mengupload foto & dokumen...", { id: toastId });
      const photoUrl = await uploadToStorage(files.photo, 'photos');
      
      const certUrl = files.cert ? await uploadToStorage(files.cert, 'certs') : "";
      const contestUrl = files.contest ? await uploadToStorage(files.contest, 'contests') : "";

      // B. Koneksi ke Blockchain
      toast.loading("Menghubungkan ke Smart Contract...", { id: toastId });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // C. Kirim Transaksi
      toast.loading("Silakan Konfirmasi di Metamask...", { id: toastId });
      
      const tx = await contract.mintCertificate(
        formData.id,
        formData.variety,
        formData.breeder,
        formData.gender,
        formData.age,           
        parseInt(formData.size), 
        formData.condition,
        photoUrl,
        certUrl,    
        contestUrl,
        formData.fatherId, 
        formData.motherId
      );

      toast.loading("Menunggu konfirmasi blok...", { id: toastId });
      await tx.wait(); 

      toast.success("SERTIFIKAT BERHASIL DITERBITKAN!", { id: toastId });
      setUploadedPaths([]); 

      setMintedData({
        ...formData,
        photoUrl,
        txHash: tx.hash,
        verifyUrl: `${window.location.origin}/koi/${formData.id}` 
      });

    } catch (err: any) {
      console.error(err);
      toast.loading("Transaksi Gagal. Membersihkan file...", { id: toastId });
      await rollbackFiles();
      toast.error("Gagal: " + (err.reason || err.message), { id: toastId });
    } finally {
      setProcessLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Memeriksa Izin...</div>;

  // --- TAMPILAN BLOKIR JIKA DI-BAN ---
  if (isBanned) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
        <div className="relative z-50"><Navbar /></div>
        <div className="flex-grow flex flex-col items-center justify-center p-4 text-center z-0">
            <div className="bg-red-50 p-10 rounded-2xl shadow-xl border border-red-200 max-w-md animate-fade-in-up">
                <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Ban className="text-red-600 w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold text-red-700 mb-2">Akses Ditolak</h1>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    Akun Anda telah dinonaktifkan. Anda tidak diizinkan melakukan Minting atau aktivitas lainnya.
                </p>
                <Link href="/report" className="w-full block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-lg transition shadow-lg">
                    Hubungi Admin
                </Link>
            </div>
        </div>
      </div>
    );
  }

  // Tampilan Sukses
  if (mintedData) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
            <Navbar />
            <div className="bg-white p-8 rounded-2xl shadow-xl mt-10 max-w-md w-full">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><QrIcon className="text-green-600" size={32}/></div>
                <h2 className="text-2xl font-bold text-green-700 mb-2">Sukses!</h2>
                <div className="bg-white p-2 border-4 border-black rounded-xl inline-block mb-4"><QRCode value={mintedData.verifyUrl} size={150} /></div>
                <p className="font-bold text-lg">{mintedData.id}</p>
                <Link href={`/koi/${mintedData.id}`} className="text-blue-600 underline text-sm block mt-2 mb-6">Lihat Detail Sertifikat</Link>
                <button onClick={() => window.location.reload()} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold">Input Lagi</button>
            </div>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <Toaster position="top-center" />

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
            <Link href="/" className="text-sm text-gray-500 hover:text-orange-600 flex items-center gap-1 mb-2"><ArrowLeft size={16} /> Kembali</Link>
            <h1 className="text-3xl font-bold text-gray-900">Upload Ikan Baru</h1>
            <p className="text-gray-500">Mencatat data fisik dan dokumen ke Blockchain (Permanen).</p>
        </div>

        <form onSubmit={handleMint} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div><label className="font-bold text-sm block mb-2">ID Koi (Unik)</label><input required name="id" onChange={handleInputChange} type="text" placeholder="Contoh: KOI-2025-001" className="w-full p-3 border rounded-xl" /></div>
                <div><label className="font-bold text-sm block mb-2">Varietas</label><input required name="variety" onChange={handleInputChange} type="text" placeholder="Kohaku, Showa..." className="w-full p-3 border rounded-xl" /></div>
                <div><label className="font-bold text-sm block mb-2">Breeder</label><input required name="breeder" onChange={handleInputChange} type="text" className="w-full p-3 border rounded-xl" /></div>
                <div>
                    <label className="font-bold text-sm block mb-2">Gender</label>
                    <select name="gender" onChange={handleInputChange} className="w-full p-3 border rounded-xl bg-white">
                        <option value="Tidak Diketahui">Tidak Diketahui</option>
                        <option value="Jantan">Jantan</option>
                        <option value="Betina">Betina</option>
                    </select>
                </div>
                <div><label className="font-bold text-sm block mb-2">Umur</label><input name="age" onChange={handleInputChange} type="text" placeholder="Contoh: Sansai (3 Tahun)" className="w-full p-3 border rounded-xl" /></div>
                <div><label className="font-bold text-sm block mb-2">Ukuran (cm)</label><input required name="size" onChange={handleInputChange} type="number" placeholder="55" className="w-full p-3 border rounded-xl" /></div>
                <div className="col-span-2"><label className="font-bold text-sm block mb-2">Kondisi</label><input required name="condition" onChange={handleInputChange} type="text" placeholder="Sehat, Body Bulky..." className="w-full p-3 border rounded-xl" /></div>
            </div>

            {/* FORM SILSILAH (LINEAGE) */}
            <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2"><GitMerge size={20}/> Silsilah Keluarga (Lineage)</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="font-bold text-sm block mb-2 text-orange-800">ID Indukan Jantan (Bapak)</label>
                        <input name="fatherId" onChange={handleInputChange} type="text" placeholder="ID Koi Bapak (Opsional)" className="w-full p-3 border border-orange-200 rounded-xl" />
                    </div>
                    <div>
                        <label className="font-bold text-sm block mb-2 text-orange-800">ID Indukan Betina (Ibu)</label>
                        <input name="motherId" onChange={handleInputChange} type="text" placeholder="ID Koi Ibu (Opsional)" className="w-full p-3 border border-orange-200 rounded-xl" />
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
                <p className="font-bold text-gray-700">Upload Berkas</p>
                <div className="grid md:grid-cols-3 gap-4">
                    {/* Foto Utama */}
                    <div className="border-2 border-dashed p-4 rounded-xl text-center hover:bg-gray-50 cursor-pointer relative">
                        <span className="text-sm font-bold block mb-1">Foto Ikan (Wajib)</span>
                        <input required type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'photo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <span className="text-xs text-green-600 block mt-1">{files.photo ? files.photo.name : "Pilih File"}</span>
                    </div>
                    {/* Sertifikat Asli */}
                    <div className="border-2 border-dashed p-4 rounded-xl text-center hover:bg-gray-50 cursor-pointer relative">
                        <span className="text-sm font-bold block mb-1">Sertifikat Asli</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'cert')} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <span className="text-xs text-green-600 block mt-1">{files.cert ? files.cert.name : "Opsional"}</span>
                    </div>
                    {/* Sertifikat Lomba */}
                    <div className="border-2 border-dashed p-4 rounded-xl text-center hover:bg-gray-50 cursor-pointer relative">
                        <span className="text-sm font-bold block mb-1">Sertifikat Lomba</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'contest')} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <span className="text-xs text-green-600 block mt-1">{files.contest ? files.contest.name : "Opsional"}</span>
                    </div>
                </div>
            </div>

            <button type="submit" disabled={processLoading} className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95 disabled:scale-100 disabled:opacity-70">
                {processLoading ? <Loader2 className="animate-spin"/> : <Save/>}
                {processLoading ? "Sedang Minting..." : "Simpan ke Blockchain"}
            </button>
        </form>
      </main>
    </div>
  );
}