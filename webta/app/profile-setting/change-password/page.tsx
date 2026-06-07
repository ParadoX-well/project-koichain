'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { KeyRound, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function ChangePasswordPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Semua kolom wajib diisi!');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Password baru dan konfirmasi tidak cocok!');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter!');
      return;
    }

    if (!user?.email) {
      toast.error('Sesi tidak valid, mohon login ulang.');
      return;
    }

    setLoading(true);

    try {
      // 1. Re-authenticate untuk memastikan Password Lama benar
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword
      });

      if (signInError) {
        throw new Error('Password saat ini salah!');
      }

      // 2. Jika sukses login ulang, lanjutkan ganti password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      toast.success('Password berhasil diperbarui!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Kembali ke dashboard setelah 2 detik
      setTimeout(() => {
        router.push('/profile-setting');
      }, 2000);

    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      <Toaster position="top-center" />
      
      <div className="flex-1 flex flex-col justify-center items-center p-6 relative">
        <div className="w-full max-w-md">
            
          <Link href="/profile-setting" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 font-medium mb-8 transition group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition" /> Kembali ke Dashboard
          </Link>

          <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-orange-900/5 border border-gray-100">
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 border border-orange-200">
              <KeyRound className="text-orange-600" size={28} />
            </div>

            <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Ganti Password</h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Demi keamanan, silakan masukkan password Anda saat ini sebelum membuat password yang baru.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Password Lama */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Password Saat Ini</label>
                <div className="relative">
                  <input
                    type={showOld ? "text" : "password"} 
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="Masukkan password lama"
                    className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white transition"
                  />
                  <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Password Baru */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Password Baru</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"} 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white transition"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password Baru */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Ulangi Password Baru</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password baru"
                    className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white transition"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-lg shadow-gray-900/20 mt-4 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Simpan Password Baru'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
