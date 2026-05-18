'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from "@/components/Navbar";

// Komponen Icon Google (SVG)
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  // Cek jika user sudah login
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.replace('/dashboard-user');
    };
    checkUser();
  }, [router]);

  // Handle Login Email/Password Biasa
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        // REGISTER
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { full_name: formData.fullName } // Simpan nama di metadata
          }
        });
        if (error) throw error;
        toast.success("Pendaftaran berhasil! Silakan cek email untuk verifikasi.");
      } else {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        toast.success("Login berhasil!");
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLE LOGIN GOOGLE ---
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback` // Pastikan folder auth/callback dibuat (lihat langkah 4)
      }
    });

    if (error) {
      toast.error("Gagal login Google: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <Navbar />
      <Toaster position="top-center" />

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 w-full max-w-md">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
              {isRegister ? 'Buat Akun Baru' : 'Selamat Datang'}
            </h1>
            <p className="text-gray-500 text-sm">
              {isRegister ? 'Mulai perjalanan digital ikan Koi Anda.' : 'Masuk untuk mengelola aset digital Anda.'}
            </p>
          </div>

          {/* TOMBOL GOOGLE */}
          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition shadow-sm mb-6 group"
          >
            <GoogleIcon />
            <span>Masuk dengan Google</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
          </button>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">Atau dengan Email</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* FORM MANUAL */}
          <form onSubmit={handleAuth} className="space-y-4">
            
            {isRegister && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Nama Anda"
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                <input 
                  type="email" 
                  required
                  className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="nama@email.com"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                <input 
                  type="password" 
                  required
                  minLength={6}
                  className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="••••••••"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isRegister ? 'Daftar Sekarang' : 'Masuk')}
            </button>

          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">
              {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
            </span>
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="text-orange-600 font-bold hover:underline"
            >
              {isRegister ? 'Login di sini' : 'Daftar di sini'}
            </button>
          </div>

        </div>
      </main>
      
    </div>
  );
}