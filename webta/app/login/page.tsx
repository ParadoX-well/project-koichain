'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, User, Eye, EyeOff, Phone, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

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

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/');
    });
  }, [router]);

  const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      if (form.password !== form.confirmPassword) { toast.error('Password tidak cocok!'); return; }
      if (!agreed) { toast.error('Setujui syarat & ketentuan terlebih dahulu.'); return; }
    }
    setLoading(true);
    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.fullName, phone: form.phone } },
        });
        if (error) throw error;
        toast.success('Pendaftaran berhasil! Cek email untuk verifikasi.');
        setIsRegister(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
        toast.success('Login berhasil!');
        router.replace('/');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error('Gagal login Google: ' + error.message);
  };

  return (
    <div className="min-h-screen flex font-sans text-gray-900">
      <Toaster position="top-center" />

      {/* PANEL KIRI — Dekorasi */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 relative overflow-hidden flex-col items-center justify-center p-12 text-white">
        {/* Dekorasi bulat */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 bg-white/10 rounded-full" />
        {/* <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full" />*/}

        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-35'>
          <img src="/logo-koichain2-tulisan-white-circle.png" alt="Logo KoiChain ID" className="w-100 h-100 object-contain mb-6" />
        </div>

        <div className="relative text-center flex flex-col items-center">
          <h2 className="text-5xl font-black mb-4 leading-tight">
            KoiChain ID
          </h2>
          <p className="text-white/80 text-lg leading-relaxed max-w-sm">
            Platform sertifikasi ikan Koi berbasis blockchain. Keaslian terjamin, kepemilikan tercatat selamanya.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[['🏆', 'Terverifikasi'], ['🔒', 'Aman'], ['⚡', 'Cepat']].map(([icon, label]) => (
              <div key={label} className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs font-bold text-white/90">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-6 text-white/50 text-xs">
          © 2025 KoiChain ID. All rights reserved.
        </div>
      </div>

      {/* PANEL KANAN — Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md py-8">

          {/* Tombol Kembali */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 font-medium transition group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-200" />
              Kembali ke Beranda
            </Link>
          </div>

          {/* Logo Mobile */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <img src="/logo-koichain.jpeg" alt="Logo KoiChain ID" className="w-16 h-16 object-contain rounded-full mb-2" />
            <p className="font-black text-2xl text-orange-600">KoiChain ID</p>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900">
              {isRegister ? 'Buat Akun' : 'Selamat Datang!'}
            </h1>
            <p className="text-gray-500 mt-1.5">
              {isRegister ? 'Isi data diri kamu untuk mulai.' : 'Masuk ke akun KoiChain ID kamu.'}
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition shadow-sm mb-5 group"
          >
            <GoogleIcon />
            <span>{isRegister ? 'Daftar' : 'Masuk'} dengan Google</span>
            <ArrowRight size={14} className="text-gray-400 group-hover:translate-x-1 transition" />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">atau dengan email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* FORM */}
          <form onSubmit={handleAuth} className="space-y-4">

            {/* === REGISTER FIELDS === */}
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text" required value={form.fullName}
                      onChange={e => set('fullName', e.target.value)}
                      placeholder="Nama sesuai KTP"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white transition"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Gunakan nama lengkap sesuai identitas resmi.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Nomor Telepon <span className="text-gray-400 font-normal">(opsional)</span></label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel" value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white transition"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email" required value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold text-gray-700">Password <span className="text-red-500">*</span></label>
                {!isRegister && (
                  <Link href="/reset-password" className="text-xs text-orange-600 hover:underline font-medium">Lupa password?</Link>
                )}
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'} required minLength={isRegister ? 8 : 6}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white transition"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {isRegister && <PasswordStrength password={form.password} />}
            </div>

            {/* Konfirmasi Password (register only) */}
            {isRegister && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Konfirmasi Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'} required
                    value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-11 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 bg-white transition ${form.confirmPassword && form.confirmPassword !== form.password
                      ? 'border-red-300 focus:ring-red-300'
                      : 'border-gray-200 focus:ring-orange-400'
                      }`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <p className="text-xs text-red-500 mt-1">Password tidak cocok.</p>
                )}
              </div>
            )}

            {/* Syarat & Ketentuan (register only) */}
            {isRegister && (
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-orange-50 hover:border-orange-200 transition">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 accent-orange-500 w-4 h-4 shrink-0"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  Saya menyetujui{' '}
                  <Link href="/terms-of-service" className="text-orange-600 font-bold hover:underline">Syarat & Ketentuan</Link>
                  {' '}dan{' '}
                  <Link href="/privacy-policy" className="text-orange-600 font-bold hover:underline">Kebijakan Privasi</Link>
                  {' '}KoiChain ID.
                </span>
              </label>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3.5 rounded-2xl transition shadow-lg shadow-orange-200 flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> Memproses...</>
                : isRegister ? 'Buat Akun Sekarang' : 'Masuk ke Akun'}
            </button>

          </form>

          {/* Switch mode */}
          <p className="mt-6 text-center text-sm text-gray-500">
            {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
            <button
              onClick={() => { setIsRegister(!isRegister); setForm({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' }); setAgreed(false); }}
              className="text-orange-600 font-bold hover:underline"
            >
              {isRegister ? 'Login di sini' : 'Daftar gratis'}
            </button>
          </p>

          <p className="mt-4 text-center text-xs text-gray-400">
            © 2025 KoiChain ID Platform · Semua data dilindungi enkripsi
          </p>
        </div>
      </div>
    </div>
  );
}