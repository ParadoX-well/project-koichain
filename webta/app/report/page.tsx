'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AlertTriangle, Send, Upload, FileText, CheckCircle, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function ReportPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // State Form
  const [formData, setFormData] = useState({
    category: 'fraud', // Default: Indikasi Penipuan
    title: '',
    description: '',
    contactInfo: ''
  });
  const [file, setFile] = useState<File | null>(null);

  // Auto-fill jika user sudah login
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        setFormData(prev => ({ ...prev, contactInfo: user.email! }));
      }
    };
    checkUser();
  }, []);

  // Upload Bukti ke Storage
  const uploadEvidence = async () => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `proof-${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage.from('report-proofs').upload(fileName, file);
    if (error) throw error;
    
    const { data } = supabase.storage.from('report-proofs').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.contactInfo) {
      return toast.error("Mohon lengkapi formulir!");
    }

    setLoading(true);
    const toastId = toast.loading("Mengirim laporan...");

    try {
      // 1. Upload File (Jika ada)
      let evidenceUrl = null;
      if (file) {
        evidenceUrl = await uploadEvidence();
      }

      // 2. Simpan ke Database
      const { data: { user } } = await supabase.auth.getUser(); // Cek user lagi untuk user_id
      
      const { error } = await supabase.from('reports').insert({
        user_id: user?.id || null, // Bisa null jika guest
        category: formData.category,
        title: formData.title,
        description: formData.description,
        contact_info: formData.contactInfo,
        evidence_url: evidenceUrl
      });

      if (error) throw error;

      toast.success("Laporan berhasil dikirim!", { id: toastId });
      setSubmitted(true); // Ganti tampilan ke Sukses

    } catch (err: any) {
      console.error(err);
      toast.error("Gagal mengirim: " + err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Tampilan Sukses
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-green-100 max-w-md text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600 w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Laporan Diterima</h1>
            <p className="text-gray-500 mb-8">
              Terima kasih telah membantu menjaga keamanan komunitas WebKoi. Tim kami akan meninjau laporan Anda dan menghubungi melalui kontak yang diberikan.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition"
            >
              Buat Laporan Baru
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <Navbar />
      <Toaster position="top-center" />

      <main className="flex-grow container mx-auto px-4 py-12 max-w-3xl">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Pusat Bantuan & Laporan</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Temukan bug? Menemukan indikasi penipuan? Atau punya saran fitur? Sampaikan kepada kami agar WebKoi menjadi lebih baik.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-orange-50 px-8 py-4 border-b border-orange-100 flex items-center gap-3">
             <AlertTriangle className="text-orange-600" />
             <span className="font-bold text-orange-800">Formulir Pengaduan</span>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {/* Kategori */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Kategori Laporan</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white"
              >
                <option value="fraud">⚠️ Indikasi Penipuan / Sertifikat Palsu</option>
                <option value="bug">🐛 Bug Aplikasi / Error</option>
                <option value="account">👤 Masalah Akun / Login</option>
                <option value="content">🚫 Pelanggaran Konten</option>
                <option value="suggestion">💡 Saran & Masukan</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            {/* Judul */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Judul Laporan</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Contoh: Sertifikat ID KOI-123 Mencurigakan"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Kronologi / Detail Masalah</label>
              <textarea 
                required
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Jelaskan secara detail apa yang terjadi..."
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none"
              />
            </div>

            {/* Bukti Foto */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Bukti Pendukung (Opsional)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition cursor-pointer relative group">
                  <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-orange-500 transition" />
                  <span className="text-sm font-medium text-gray-600 block">
                      {file ? <span className="text-green-600 font-bold">{file.name}</span> : "Upload Screenshot / Foto"}
                  </span>
                  <span className="text-xs text-gray-400">JPG, PNG (Max 5MB)</span>
              </div>
            </div>

            {/* Kontak */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email / Kontak Dihubungi</label>
              <input 
                type="text" 
                required
                value={formData.contactInfo}
                onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
                placeholder="email@anda.com atau No WA"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Kami akan menghubungi Anda melalui kontak ini jika diperlukan.</p>
            </div>

            <hr className="border-gray-100" />

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
              {loading ? "Mengirim..." : "Kirim Laporan"}
            </button>

          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}