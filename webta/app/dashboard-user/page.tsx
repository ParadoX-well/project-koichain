'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import {
  User, Mail, Phone, MapPin, Camera, Save, LogOut, Loader2,
  ShieldCheck, ShieldAlert, ChevronRight, Edit3, Check, X, Wallet, Plus, Trash2
} from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; gradient: string }> = {
  admin:   { label: 'Admin',   color: 'text-red-700',    bg: 'bg-red-100 border-red-200',    gradient: 'from-red-500 to-red-700' },
  author:  { label: 'Author',  color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-200', gradient: 'from-yellow-400 to-orange-500' },
  breeder: { label: 'Breeder', color: 'text-blue-700',   bg: 'bg-blue-100 border-blue-200',  gradient: 'from-blue-500 to-indigo-600' },
  seller:  { label: 'Seller',  color: 'text-purple-700', bg: 'bg-purple-100 border-purple-200', gradient: 'from-purple-500 to-violet-600' },
  user:    { label: 'User',    color: 'text-gray-600',   bg: 'bg-gray-100 border-gray-200',  gradient: 'from-orange-400 to-rose-500' },
};

export default function DashboardUser() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  const [userId, setUserId] = useState('');
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    role: 'user',
    avatarUrl: '',
    isVerified: false,
    isBanned: false,
  });
  const [draft, setDraft] = useState({ fullName: '', phone: '', address: '' });
  const [userWallets, setUserWallets] = useState<any[]>([]);

  const roleConf = ROLE_CONFIG[profile.role] || ROLE_CONFIG.user;

  const { user: authUser, loading: authLoading } = useRequireAuth();

  useEffect(() => {
    if (!authUser) return;
    async function getData() {
      setUserId(authUser.id);

      const { data: p } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
      if (p) {
        let currentPhone = p.phone;
        if (!currentPhone && authUser.user_metadata?.phone) {
          currentPhone = authUser.user_metadata.phone;
          supabase.from('profiles').update({ phone: currentPhone }).eq('id', authUser.id).then();
        }

        const isPartner = ['breeder', 'seller', 'admin', 'author'].includes(p.role);
        const data = {
          fullName: p.full_name || '',
          email: authUser.email || '',
          phone: currentPhone || '',
          address: p.address || '',
          role: p.role || 'user',
          avatarUrl: p.avatar_url || '',
          isVerified: isPartner || p.verification_status === 'verified',
          isBanned: p.is_banned || false,
        };
        setProfile(data);
        setDraft({ fullName: data.fullName, phone: data.phone, address: data.address });

        const { data: wals } = await supabase.from('user_wallets').select('*').eq('user_id', authUser.id).order('created_at', { ascending: true });
        setUserWallets(wals || []);
      }
      setLoading(false);
    }
    getData();
  }, [authUser]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploadingAvatar(true);
    const toastId = toast.loading('Mengupload foto...');
    try {
      const ext = file.name.split('.').pop();
      const fileName = `avatar-${userId}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
      setProfile(prev => ({ ...prev, avatarUrl: publicUrl }));
      toast.success('Foto profil diperbarui!', { id: toastId });
    } catch (err: any) {
      toast.error('Gagal upload: ' + err.message, { id: toastId });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Update profiles table
      const { error } = await supabase.from('profiles').update({
        full_name: draft.fullName,
        phone: draft.phone,
        address: draft.address,
        updated_at: new Date(),
      }).eq('id', userId);
      if (error) throw error;

      // 2. Sync Display Name ke Supabase Auth user_metadata
      await supabase.auth.updateUser({
        data: { full_name: draft.fullName, display_name: draft.fullName }
      });

      setProfile(prev => ({ ...prev, fullName: draft.fullName, phone: draft.phone, address: draft.address }));
      setEditingField(null);
      toast.success('Profil berhasil disimpan! ✅');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectWalletAndLink = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        const walletAddress = accounts[0].toLowerCase();

        // Cek dulu apakah wallet sudah terdaftar
        const { data: existing } = await supabase
          .from('user_wallets')
          .select('id, user_id')
          .eq('wallet_address', walletAddress)
          .maybeSingle();
        
        if (existing) {
          if (existing.user_id === userId) {
            toast('Wallet ini sudah terdaftar di akun kamu.', { icon: 'ℹ️' });
          } else {
            toast.error('Wallet ini sudah digunakan oleh akun lain. Pilih wallet berbeda.');
          }
          return;
        }

        // Link ke akun
        const toastId = toast.loading('Menautkan wallet...');
        const { error } = await supabase.from('user_wallets').insert({
           user_id: userId,
           wallet_address: walletAddress,
           label: 'MetaMask',
           is_primary: userWallets.length === 0
        });

        if (error) throw error;
        toast.success('Wallet berhasil ditambahkan!', { id: toastId });
        
        // Refresh list
        const { data: wals } = await supabase.from('user_wallets').select('*').eq('user_id', userId).order('created_at', { ascending: true });
        setUserWallets(wals || []);
      } catch (err: any) {
        toast.error('Gagal menautkan wallet: ' + err.message);
      }
    } else {
      toast.error('MetaMask tidak ditemukan!');
    }
  };

  const handleUnlinkWallet = async (walletId: string) => {
    if (userWallets.length === 1) {
       toast.error('Kamu harus punya minimal 1 wallet! Tidak bisa menghapus wallet terakhir.');
       return;
    }
    if (!confirm('Yakin ingin menghapus wallet ini dari akun?')) return;
    
    const toastId = toast.loading('Menghapus wallet...');
    try {
      const { error } = await supabase.from('user_wallets').delete().eq('id', walletId);
      if (error) throw error;
      toast.success('Wallet dihapus!', { id: toastId });
      setUserWallets(prev => prev.filter(w => w.id !== walletId));
    } catch(err: any) {
      toast.error('Gagal hapus wallet: ' + err.message, { id: toastId });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (authLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-gray-400" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <Toaster position="top-center" />

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ===== KOLOM KIRI ===== */}
          <div className="w-full lg:w-80 space-y-4 shrink-0">

            {/* Kartu Profil */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Banner */}
              <div className={`h-24 bg-gradient-to-r ${roleConf.gradient}`} />

              {/* Avatar + Info */}
              <div className="px-6 pb-6 -mt-12">
                <div className="relative w-24 h-24 mx-auto mb-4 group">
                  <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                    {profile.avatarUrl
                      ? <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={40} /></div>
                    }
                  </div>
                  <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                    {uploadingAvatar ? <Loader2 size={20} className="text-white animate-spin" /> : <Camera size={20} className="text-white" />}
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>

                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900 truncate">{profile.fullName || 'Pengguna'}</h2>
                  <p className="text-sm text-gray-400 truncate mb-3">{profile.email}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${roleConf.bg} ${roleConf.color}`}>
                    {roleConf.label}
                  </span>
                </div>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 px-4 py-3">
                <button onClick={handleLogout} className="w-full py-2.5 text-red-600 text-sm font-bold bg-red-50 hover:bg-red-100 rounded-xl transition flex items-center justify-center gap-2">
                  <LogOut size={16} /> Keluar
                </button>
              </div>
            </div>

            {/* Status Akun */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-4">Status Akun</h3>

              {profile.isBanned ? (
                <div className="flex items-center gap-3 text-red-700 bg-red-50 p-3 rounded-xl border border-red-100 mb-4">
                  <ShieldAlert size={22} />
                  <div>
                    <p className="font-bold text-sm">Akun Dibanned</p>
                    <p className="text-xs">Hubungi admin untuk info lebih lanjut.</p>
                  </div>
                </div>
              ) : profile.isVerified ? (
                <div className="flex items-center gap-3 text-green-700 bg-green-50 p-3 rounded-xl border border-green-100 mb-4">
                  <ShieldCheck size={22} />
                  <div>
                    <p className="font-bold text-sm">Terverifikasi</p>
                    <p className="text-xs">Akun Mitra Resmi KoiChain ID.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-100 mb-4">
                  <ShieldAlert size={22} />
                  <div>
                    <p className="font-bold text-sm">Regular User</p>
                    <p className="text-xs">Belum menjadi mitra resmi.</p>
                  </div>
                </div>
              )}

              <Link
                href="/dashboard-user/verification"
                className="flex items-center justify-between w-full p-3 rounded-xl border border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition group"
              >
                <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-700">
                  {profile.isVerified ? 'Info Kemitraan' : 'Daftar Jadi Mitra'}
                </span>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-orange-500 transition" />
              </Link>
            </div>

            {/* Info singkat */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-2">Info Kontak</h3>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail size={15} className="text-gray-400 shrink-0" />
                <span className="truncate">{profile.email || '-'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone size={15} className="text-gray-400 shrink-0" />
                <span>{profile.phone || '-'}</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <MapPin size={15} className="text-gray-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{profile.address || '-'}</span>
              </div>
            </div>
          </div>

          {/* ===== KOLOM KANAN ===== */}
          <div className="flex-1 space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
                <p className="text-sm text-gray-400 mt-0.5">Kelola informasi akun dan preferensi kamu.</p>
              </div>
            </div>

            {/* Form Edit Profil */}
            <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 flex items-center gap-2"><Edit3 size={16} /> Edit Profil</h2>
              </div>

              <div className="p-6 space-y-5">
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    value={draft.fullName}
                    onChange={e => setDraft({ ...draft, fullName: e.target.value })}
                    placeholder="Nama lengkap kamu"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Nama ini juga akan diperbarui di sistem autentikasi.</p>
                </div>

                {/* Email (readonly) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <div className="flex items-center gap-3 px-4 py-3 border border-gray-100 rounded-xl bg-gray-50 text-sm text-gray-500">
                    <Mail size={15} className="text-gray-400 shrink-0" />
                    {profile.email}
                    <span className="ml-auto text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase">Tidak dapat diubah</span>
                  </div>
                </div>

                {/* Telepon */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nomor Telepon</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={draft.phone}
                      onChange={e => setDraft({ ...draft, phone: e.target.value })}
                      placeholder="08xxxxxxxxxx"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                    />
                  </div>
                </div>

                {/* Alamat */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Alamat</label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-4 top-4 text-gray-400" />
                    <textarea
                      rows={3}
                      value={draft.address}
                      onChange={e => setDraft({ ...draft, address: e.target.value })}
                      placeholder="Alamat lengkap..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Aksi */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <p className="text-xs text-gray-400">Perubahan akan langsung tersimpan ke akun kamu.</p>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 disabled:opacity-60 transition shadow"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>

            {/* Kelola Wallet */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><Wallet size={16} /> Kelola Wallet</h3>
                {userWallets.length < 3 && (
                  <button onClick={handleConnectWalletAndLink} className="text-xs font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                    <Plus size={14} /> Tambah Wallet
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {userWallets.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Wallet size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Belum ada wallet yang terhubung.</p>
                  </div>
                ) : (
                  userWallets.map((w, idx) => (
                    <div key={w.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50 hover:border-orange-200 transition group">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                          <Wallet size={18} className="text-orange-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-800">{w.label}</p>
                            {w.is_primary && <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded uppercase font-black">Primary</span>}
                          </div>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{w.wallet_address.substring(0,6)}...{w.wallet_address.substring(38)}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleUnlinkWallet(w.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                        title="Hapus Wallet"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              {userWallets.length >= 3 && (
                <p className="text-xs text-gray-400 mt-4 text-center">Maksimal 3 wallet per akun.</p>
              )}
            </div>

            {/* Keamanan */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Keamanan</h3>
              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Password</p>
                  <p className="text-xs text-gray-400 mt-0.5">Ubah password akun kamu</p>
                </div>
                <Link
                  href="/reset-password"
                  className="text-sm font-bold text-orange-600 hover:text-orange-700 border border-orange-200 px-4 py-2 rounded-xl hover:bg-orange-50 transition"
                >
                  Ubah Password
                </Link>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}