'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Upload, Save, Loader2, FileText } from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from "@/components/Navbar";

export default function RequestCertificatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  // State Form
  const [applicantName, setApplicantName] = useState('');
  const [koiVariety, setKoiVariety] = useState('');
  const [colorPattern, setColorPattern] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 1. Cek Kelayakan User (Wajib Login & Verified)
  useEffect(() => {
    const checkEligibility = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace('/login');
        return;
      }
      setUser(user);

      // Cek Profile Status
      const { data: profile } = await supabase
        .from('profiles')
        .select('verification_status')
        .eq('id', user.id)
        .single();

      if (profile?.verification_status !== 'verified') {
        toast.error("Akun Anda belum terverifikasi! Tidak bisa mengajukan sertifikat.");
        router.replace('/dashboard-user'); // Tendang balik ke dashboard
        return;
      }

      setLoading(false);
    };

    checkEligibility();
  }, [router]);

  // Handle Ganti Foto
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Buat preview gambar lokal
    }
  };

  // Handle Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !koiVariety || !colorPattern || !photoFile) {
      toast.error("Mohon lengkapi semua data dan foto!");
      return;
    }

    setSubmitting(true);

    try {
      // A. Upload Foto ke Bucket 'koi-photos'
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `koi-${Date.now()}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('koi-photos')
        .upload(fileName, photoFile);

      if (uploadError) throw uploadError;

      // Dapatkan Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('koi-photos')
        .getPublicUrl(fileName);

      // B. Simpan Data ke Tabel 'certification_requests'
      const { error: dbError } = await supabase
        .from('certification_requests')
        .insert({
          user_id: user.id,
          applicant_name: applicantName,
          koi_variety: koiVariety,
          color_pattern: colorPattern,
          photo_url: publicUrl,
          status: 'pending' // Default pending
        });

      if (dbError) throw dbError;

      toast.success("Pengajuan Berhasil Dikirim!");
      
      // Redirect balik ke dashboard setelah 2 detik
      setTimeout(() => {
        router.push('/dashboard-user');
      }, 2000);

    } catch (error: any) {
      toast.error("Gagal mengirim: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <Toaster position="top-center" />

      <main className="max-w-3xl mx-auto px-4 py-10">
        
        {/* Header */}
        <div className="mb-6">
            <Link href="/dashboard-user" className="text-sm text-gray-500 hover:text-orange-600 flex items-center gap-1 mb-2">
                <ArrowLeft size={16} /> Kembali ke Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Form Pengajuan Sertifikasi</h1>
            <p className="text-gray-500">Isi data Ikan Koi Anda dengan lengkap dan akurat.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-orange-50 px-8 py-4 border-b border-orange-100 flex items-center gap-2">
                <FileText className="text-orange-600" />
                <span className="font-bold text-orange-900">Detail Ikan Koi</span>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                
                {/* Nama Pengaju */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap Pemilik</label>
                    <input 
                        type="text" 
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder="Contoh: Andika Attar"
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Varietas */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Varietas / Jenis</label>
                        <select 
                            value={koiVariety}
                            onChange={(e) => setKoiVariety(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                        >
                            <option value="">-- Pilih Jenis --</option>
                            <option value="Kohaku">Kohaku</option>
                            <option value="Taisho Sanshoku">Taisho Sanshoku (Sanke)</option>
                            <option value="Showa Sanshoku">Showa Sanshoku</option>
                            <option value="Tancho">Tancho</option>
                            <option value="Asagi">Asagi</option>
                            <option value="Lainnya">Lainnya</option>
                        </select>
                    </div>

                    {/* Pola Warna */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Pola Warna Dominan</label>
                        <input 
                            type="text" 
                            value={colorPattern}
                            onChange={(e) => setColorPattern(e.target.value)}
                            placeholder="Contoh: Merah-Putih 3 Step"
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition"
                        />
                    </div>
                </div>

                {/* Upload Foto */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Foto Ikan Koi (Wajib Jelas)</label>
                    
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Area Upload */}
                        <div className="w-full md:w-1/2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition relative group">
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="flex flex-col items-center text-gray-400 group-hover:text-orange-600">
                                <Upload size={32} className="mb-2" />
                                <span className="text-sm font-medium">Klik untuk pilih foto</span>
                                <span className="text-xs mt-1">JPG/PNG Maks 5MB</span>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="w-full md:w-1/2 h-40 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden relative">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-gray-400 text-sm">Preview Foto</span>
                            )}
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* Tombol Submit */}
                <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <> <Loader2 className="animate-spin" /> Mengirim Data... </>
                    ) : (
                        <> <Save size={20} /> Kirim Pengajuan Sertifikasi </>
                    )}
                </button>

            </form>
        </div>
      </main>
    </div>
  );
}