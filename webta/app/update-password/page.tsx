'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Loader2, Eye, EyeOff, Save, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Min. 8 karakter', ok: password.length >= 8 },
    { label: 'Huruf besar', ok: /[A-Z]/.test(password) },
    { label: 'Huruf kecil', ok: /[a-z]/.test(password) },
    { label: 'Angka', ok: /[0-9]/.test(password) },
  ];
  const passed = checks.filter(c => c.ok).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400'];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < passed ? colors[passed - 1] : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(c => (
          <div key={c.label} className={`flex items-center gap-1.5 text-xs transition-colors ${c.ok ? 'text-green-600' : 'text-gray-400'}`}>
            <CheckCircle2 size={11} className={c.ok ? 'opacity-100' : 'opacity-30'} />
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Memastikan bahwa user sudah terautentikasi (otomatis login via magic link)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error('Sesi tidak valid atau telah kedaluwarsa. Silakan ulangi proses Lupa Password.');
        setTimeout(() => router.replace('/login'), 3000);
      }
    });
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok!');
      return;
    }
    
    // Validasi kekuatan password secara basic (opsional tapi disarankan)
    if (password.length < 8) {
      toast.error('Password harus minimal 8 karakter!');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      toast.success('Password berhasil diperbarui! Mengalihkan ke Dashboard...');
      setTimeout(() => router.replace('/profile-setting'), 2000);
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat memperbarui password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      
      <div className="flex-1 flex flex-col justify-center items-center p-6 relative">
        <div className="w-full max-w-md">

          <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-orange-900/5 border border-gray-100">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6 border border-green-200">
              <Save className="text-green-600" size={28} />
            </div>

            <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Buat Password Baru</h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Silakan masukkan password baru Anda. Pastikan password kuat dan mudah diingat.
            </p>

            <form onSubmit={handleUpdate} className="space-y-5">
              
              {/* Password Baru */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Password Baru <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'} required minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white transition"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              {/* Konfirmasi Password */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Konfirmasi Password Baru <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'} required minLength={8}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white transition"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-4 mt-6 rounded-xl transition shadow-lg shadow-orange-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
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
