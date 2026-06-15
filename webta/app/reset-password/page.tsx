'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Masukkan email Anda.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      toast.success('Berhasil! Silakan periksa email Anda untuk link reset password.');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses permintaan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      
      <div className="flex-1 flex flex-col justify-center items-center p-6 relative">
        <div className="w-full max-w-md">
            
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 font-medium mb-8 transition group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition" /> Kembali ke Login
          </Link>

          <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-orange-900/5 border border-gray-100">
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 border border-orange-200">
              <KeyRound className="text-orange-600" size={28} />
            </div>

            <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Lupa Password?</h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Masukkan email yang terdaftar. Kami akan mengirimkan tautan untuk mengatur ulang password Anda.
            </p>

            <form onSubmit={handleReset} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Terdaftar <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white transition"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-lg shadow-gray-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Kirim Link Reset'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
