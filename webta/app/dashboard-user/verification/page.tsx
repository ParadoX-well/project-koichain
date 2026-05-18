'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, ArrowLeft, Briefcase, UserCheck, Store, MapPin, FileText, Upload, Loader2, Save, Trash2, AlertTriangle, CheckCircle2, Mail, Phone, Instagram } from 'lucide-react';
import Navbar from "@/components/Navbar";
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function VerificationPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  
  // State Navigasi UI
  const [view, setView] = useState<'selection' | 'form'>('selection'); 
  const [selectedRole, setSelectedRole] = useState(''); 

  // State Form Lengkap
  const [formData, setFormData] = useState({
    storeName: '',
    storeAddress: '',
    storeDescription: '',
    contactEmail: '',
    contactPhone: '',
    instagram: ''
  });

  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/login');
      setUser(user);

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
          setProfile(data);
          // Pre-fill data jika ada
          setFormData(prev => ({
              ...prev,
              storeName: data.store_name || '',
              storeAddress: data.store_address || '',
              storeDescription: data.store_description || '',
              contactEmail: data.contact_email || user.email || '',
              contactPhone: data.contact_phone || '',
              instagram: data.instagram || ''
          }));
      }
    };
    getData();
  }, [router]);

  // Handle Pilih Role
  const handleSelectRole = (role: string) => {
    setSelectedRole(role);
    setView('form');
    // Jika data toko kosong, reset. Jika ada (misal admin edit), biarkan.
    if (!profile?.store_name) {
        setFormData(prev => ({ 
            ...prev, 
            storeName: '', 
            storeAddress: '', 
            storeDescription: '' 
        }));
    }
    setKtpFile(null);
  };

  // Upload KTP
  const uploadKTP = async (userId: string) => {
    if (!ktpFile) return null;
    const fileExt = ktpFile.name.split('.').pop();
    const fileName = `ktp-${userId}-${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage.from('ktp-documents').upload(fileName, ktpFile);
    if (error) throw error;
    
    const { data } = supabase.storage.from('ktp-documents').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.storeName || !formData.storeAddress || !formData.contactEmail || !formData.contactPhone) {
        toast.error("Mohon lengkapi Data Usaha dan Kontak!");
        return;
    }
    // KTP Wajib jika belum ada di database
    if (!profile.ktp_url && !ktpFile) {
         toast.error("Wajib upload KTP!");
         return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Menyimpan data...");

    try {
        let ktpUrl = profile.ktp_url;
        if (ktpFile) {
            ktpUrl = await uploadKTP(user.id);
        }

        // LOGIKA KHUSUS: Jika user adalah ADMIN, jangan ubah role/request
        // Admin boleh mengisi data toko tanpa turun pangkat jadi breeder
        const isAdmin = profile.role === 'admin';

        const updates: any = {
            store_name: formData.storeName,
            store_address: formData.storeAddress,
            store_description: formData.storeDescription,
            contact_email: formData.contactEmail,
            contact_phone: formData.contactPhone,
            instagram: formData.instagram,
            ktp_url: ktpUrl,
            updated_at: new Date()
        };

        // Jika BUKAN admin, set status request agar masuk antrian approval
        if (!isAdmin) {
            updates.requested_role = selectedRole;
        }

        const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);

        if (error) throw error;

        toast.success(isAdmin ? "Profil Bisnis Disimpan!" : "Pengajuan berhasil dikirim!", { id: toastId });
        window.location.reload();

    } catch (err: any) {
        console.error(err);
        toast.error("Gagal: " + err.message, { id: toastId });
        setSubmitting(false);
    }
  };

  // Reset
  const handleCancelRequest = async () => {
      if(!confirm("Yakin ingin membatalkan pengajuan?")) return;
      setCanceling(true);
      const { error } = await supabase.from('profiles').update({
          requested_role: null
      }).eq('id', user.id);

      if(!error) {
          toast.success("Dibatalkan.");
          window.location.reload(); 
      } else {
          toast.error("Gagal reset: " + error.message);
          setCanceling(false);
      }
  };

  if (!profile) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Memuat...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <Toaster position="top-center" />
      
      <main className="max-w-4xl mx-auto px-4 py-10">
        
        <div className="flex items-center gap-2 mb-6">
            <Link href="/dashboard-user" className="text-gray-500 hover:text-orange-600 transition flex items-center gap-1">
                <ArrowLeft size={18}/> Kembali ke Profil
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">Upgrade Akun</span>
        </div>

        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.role === 'admin' ? "Profil Bisnis Admin" : 
                 profile.requested_role ? "Status Pengajuan" : 
                 view === 'selection' ? "Pilih Jenis Kemitraan" : `Formulir ${selectedRole === 'breeder' ? 'Breeder' : 'Penjual'}`}
            </h1>
            <p className="text-gray-500">
                {profile.role === 'admin' ? "Lengkapi data usaha Anda agar tampil sebagai Mitra Terverifikasi." :
                 profile.requested_role ? "Pantau status verifikasi akun Anda." : "Lengkapi data usaha dan kontak agar mudah dihubungi pembeli."}
            </p>
        </div>

        {/* --- LOGIKA TAMPILAN UTAMA --- */}

        {/* 1. SUDAH JADI PARTNER (NON-ADMIN) */}
        {profile.role !== 'user' && profile.role !== 'admin' ? (
             <div className="bg-white p-8 rounded-2xl border border-green-200 shadow-sm text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-800 mb-2">Selamat!</h2>
                <p className="text-gray-600 mb-6">
                    Anda sudah resmi terdaftar sebagai <span className="font-bold uppercase text-green-700">{profile.role}</span>.
                </p>
                <div className="flex justify-center gap-4">
                    <Link href="/minting" className="inline-block bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg transition">
                        Mulai Upload Ikan
                    </Link>
                    {/* Opsi Edit Profil Bisnis bisa ditambahkan disini nanti */}
                </div>
             </div>

        /* 2. PENDING REQUEST (NON-ADMIN) */
        ) : profile.requested_role && profile.role !== 'admin' ? (
            <div className="bg-white p-8 rounded-2xl border border-yellow-200 shadow-sm text-center relative overflow-hidden">
                <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Clock size={40} className="text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Pengajuan Sedang Ditinjau</h3>
                <p className="text-gray-600 max-w-lg mx-auto mb-4">
                    Anda mengajukan diri sebagai <span className="font-bold uppercase text-orange-600">{profile.requested_role}</span>.
                </p>
                <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl text-sm text-yellow-800 mb-8 inline-block text-left">
                    <p className="flex items-center gap-2 mb-1 font-bold"><AlertTriangle size={16}/> Info:</p>
                    <p>Ingin mengubah data kontak atau pilihan role?</p>
                    <p>Silakan batalkan pengajuan ini terlebih dahulu.</p>
                </div>
                <br/>
                <button 
                    onClick={handleCancelRequest}
                    disabled={canceling}
                    className="inline-flex items-center gap-2 mx-auto text-red-500 hover:text-red-700 text-sm font-bold border border-red-200 px-6 py-3 rounded-xl hover:bg-red-50 transition shadow-sm"
                >
                    {canceling ? <Loader2 className="animate-spin"/> : <Trash2 size={18} />}
                    Batalkan & Buat Pengajuan Baru
                </button>
            </div>

        /* 3. PILIH ROLE (ADMIN ATAU USER AWAL) */
        ) : view === 'selection' ? (
            
            <div className="grid md:grid-cols-2 gap-6">
                <div onClick={() => handleSelectRole('breeder')} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-500 hover:shadow-lg transition cursor-pointer group flex flex-col justify-between h-full">
                    <div>
                        <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition">
                            <UserCheck className="text-blue-600 w-8 h-8 group-hover:text-white transition" />
                        </div>
                        <h4 className="font-bold text-xl mb-3 text-gray-900">Breeder Koi</h4>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Khusus untuk pembudidaya ikan koi (Farm) yang ingin menerbitkan <b>Sertifikat Kelahiran</b>.
                        </p>
                    </div>
                    <button className="w-full py-3 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition">
                        {profile.role === 'admin' ? 'Isi Data Breeder' : 'Pilih Breeder'}
                    </button>
                </div>

                <div onClick={() => handleSelectRole('seller')} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-purple-500 hover:shadow-lg transition cursor-pointer group flex flex-col justify-between h-full">
                    <div>
                        <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition">
                            <Store className="text-purple-600 w-8 h-8 group-hover:text-white transition" />
                        </div>
                        <h4 className="font-bold text-xl mb-3 text-gray-900">Penjual / Dealer</h4>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Cocok untuk toko, dealer, atau showroom yang ingin menerbitkan sertifikat kepemilikan baru.
                        </p>
                    </div>
                    <button className="w-full py-3 bg-white border-2 border-purple-600 text-purple-600 font-bold rounded-xl hover:bg-purple-600 hover:text-white transition">
                        {profile.role === 'admin' ? 'Isi Data Penjual' : 'Pilih Penjual'}
                    </button>
                </div>
            </div>

        /* 4. FORM VIEW */
        ) : (
            
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <Briefcase size={20}/> Data {selectedRole === 'breeder' ? 'Farm' : 'Toko'} {profile.role === 'admin' && '(Mode Admin)'}
                    </h3>
                    <button onClick={() => setView('selection')} className="text-sm text-gray-500 hover:text-red-500 underline">Ganti Pilihan</button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    
                    {/* IDENTITAS USAHA */}
                    <div>
                        <h4 className="text-sm font-bold text-orange-600 uppercase mb-4 border-b pb-2">1. Identitas Usaha</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Usaha <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Store className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <input required type="text" value={formData.storeName} onChange={(e) => setFormData({...formData, storeName: e.target.value})} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder={selectedRole === 'breeder' ? "Nama Farm" : "Nama Toko"} />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Alamat Lengkap <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <textarea required rows={2} value={formData.storeAddress} onChange={(e) => setFormData({...formData, storeAddress: e.target.value})} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none" placeholder="Alamat lengkap..." />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi Singkat</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <textarea rows={2} value={formData.storeDescription} onChange={(e) => setFormData({...formData, storeDescription: e.target.value})} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none" placeholder="Contoh: Spesialis Kohaku..." />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KONTAK BISNIS */}
                    <div>
                        <h4 className="text-sm font-bold text-orange-600 uppercase mb-4 border-b pb-2">2. Kontak Bisnis</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email Bisnis <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <input required type="email" value={formData.contactEmail} onChange={(e) => setFormData({...formData, contactEmail: e.target.value})} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="email@bisnis.com" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">No. Telp / WA <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <input required type="text" value={formData.contactPhone} onChange={(e) => setFormData({...formData, contactPhone: e.target.value})} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="0812xxx" />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Instagram (Opsional)</label>
                                <div className="relative">
                                    <Instagram className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <input type="text" value={formData.instagram} onChange={(e) => setFormData({...formData, instagram: e.target.value})} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="@username" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DOKUMEN */}
                    <div>
                        <h4 className="text-sm font-bold text-orange-600 uppercase mb-4 border-b pb-2">3. Dokumen Legalitas</h4>
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                            <label className="block text-sm font-bold text-blue-900 mb-2">Upload KTP Pemilik {profile.ktp_url ? "(Sudah Ada)" : <span className="text-red-500">*</span>}</label>
                            <p className="text-xs text-blue-700 mb-4">Verifikasi legalitas usaha. Data aman.</p>
                            
                            <div className="border-2 border-dashed border-blue-300 bg-white rounded-xl p-6 text-center relative hover:bg-blue-50 transition group cursor-pointer">
                                <input 
                                    required={!profile.ktp_url} 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => setKtpFile(e.target.files?.[0] || null)} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition" />
                                <span className="text-sm font-medium text-gray-600 block">
                                    {ktpFile ? <span className="text-green-600 font-bold">{ktpFile.name}</span> : profile.ktp_url ? "Ganti Foto KTP (Opsional)" : "Klik untuk upload foto KTP"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={submitting} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                        {submitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        {submitting ? "Menyimpan Data..." : profile.role === 'admin' ? "Simpan Profil Bisnis" : "Kirim Pengajuan"}
                    </button>
                </form>
            </div>
        )}
      </main>
    </div>
  );
}