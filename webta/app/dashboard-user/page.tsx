'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, Mail, Phone, MapPin, Camera, Save, LogOut, Loader2, ShieldCheck, ShieldAlert, ChevronRight, Store } from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from "@/components/Navbar";

export default function DashboardUser() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    role: 'user',
    avatarUrl: '',
    // Kita tidak pakai verificationStatus mentah lagi untuk UI, tapi cek role
    isVerified: false 
  });

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/login');
      setUser(user);

      let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

      if (profile) {
        // LOGIKA BARU: Dianggap verified jika role BUKAN user biasa, ATAU status verified
        const isPartner = ['breeder', 'seller', 'admin'].includes(profile.role);
        const isKtpVerified = profile.verification_status === 'verified';

        setFormData({
            fullName: profile.full_name || '',
            email: user.email || '', 
            phone: profile.phone || '',
            address: profile.address || '',
            role: profile.role || 'user',
            avatarUrl: profile.avatar_url || '',
            isVerified: isPartner || isKtpVerified
        });
      }
      setLoading(false);
    };

    getData();
  }, [router]);

  // ... (Fungsi Upload Avatar & Save Profile SAMA SEPERTI SEBELUMNYA, tidak berubah) ...
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        const toastId = toast.loading("Mengupload foto...");
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
        setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
        toast.success("Foto profil diperbarui!", { id: toastId });
        setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) { toast.error("Gagal upload: " + err.message); }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
        const { error } = await supabase.from('profiles').update({
            full_name: formData.fullName, phone: formData.phone, address: formData.address, updated_at: new Date()
        }).eq('id', user.id);
        if (error) throw error;
        toast.success("Profil disimpan!");
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.replace('/login'); };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <Toaster position="top-center" />

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
            
            {/* KIRI */}
            <div className="w-full lg:w-1/3 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-24 bg-gradient-to-r ${formData.role === 'admin' ? 'from-red-500 to-red-700' : formData.role !== 'user' ? 'from-purple-500 to-blue-500' : 'from-orange-500 to-yellow-500'}`}></div>
                    
                    <div className="relative w-32 h-32 mx-auto -mt-12 mb-4 group cursor-pointer">
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-100">
                            {formData.avatarUrl ? <img src={formData.avatarUrl} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-300"><User size={64}/></div>}
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <Camera className="text-white w-8 h-8" />
                            <input type="file" onChange={handleAvatarUpload} className="absolute inset-0 cursor-pointer opacity-0" />
                        </div>
                    </div>

                    <h2 className="text-xl font-bold capitalize">{formData.fullName || 'User'}</h2>
                    <p className="text-sm text-gray-500 mb-4">{formData.email}</p>
                    
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-6 border ${formData.role !== 'user' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {formData.role}
                    </span>

                    <button onClick={handleLogout} className="w-full py-2.5 text-red-600 text-sm font-bold bg-red-50 hover:bg-red-100 rounded-xl transition flex justify-center gap-2"><LogOut size={18} /> Keluar</button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Status Akun</h3>
                    
                    {/* LOGIKA BADGE DIPERBAIKI */}
                    {formData.isVerified ? (
                        <div className="flex items-center gap-3 text-green-700 bg-green-50 p-3 rounded-xl border border-green-100 mb-4">
                            <ShieldCheck size={24} />
                            <div>
                                <p className="font-bold text-sm">Terverifikasi</p>
                                <p className="text-xs">Akun Mitra Resmi WebKoi.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 text-orange-700 bg-orange-50 p-3 rounded-xl border border-orange-100 mb-4">
                            <ShieldAlert size={24} />
                            <div>
                                <p className="font-bold text-sm">Regular User</p>
                                <p className="text-xs">Belum menjadi mitra.</p>
                            </div>
                        </div>
                    )}

                    {/* Jika SUDAH jadi mitra, tombolnya ganti jadi 'Lihat Info Mitra' */}
                    <Link 
                        href="/dashboard-user/verification" 
                        className="flex items-center justify-between w-full p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:text-blue-600 transition group bg-gray-50 hover:bg-white"
                    >
                        <span className="text-sm font-medium">{formData.isVerified ? 'Info Kemitraan' : 'Daftar Jadi Mitra'}</span>
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-500" />
                    </Link>
                </div>
            </div>

            {/* KANAN (FORM EDIT) - SAMA SEPERTI SEBELUMNYA */}
            <div className="w-full lg:w-2/3">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-8 py-5 border-b border-gray-200"><h3 className="font-bold text-lg">Edit Profil</h3></div>
                    <form onSubmit={handleSaveProfile} className="p-8 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="col-span-2"><label className="block text-sm font-bold mb-2">Nama Lengkap</label><input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Nama Lengkap"/></div>
                            <div><label className="block text-sm font-bold mb-2">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                            <div><label className="block text-sm font-bold mb-2">Telepon</label><input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="08..." /></div>
                            <div className="col-span-2"><label className="block text-sm font-bold mb-2">Alamat</label><textarea rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Alamat lengkap..." /></div>
                        </div>
                        <div className="flex justify-end"><button type="submit" disabled={saving} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 flex gap-2">{saving ? <Loader2 className="animate-spin"/> : <Save/>} Simpan</button></div>
                    </form>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}