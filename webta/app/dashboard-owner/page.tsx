'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Database, Send, Activity, ShieldAlert, Wallet, ArrowRight, Ban, Baby, BookOpen } from 'lucide-react';
import Link from 'next/link';
import Navbar from "@/components/Navbar";
import { Toaster } from 'react-hot-toast';

export default function OwnerDashboard() {
  const { account, connectWallet } = useWallet();
  const router = useRouter();
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false); // State baru untuk status Ban

  // Cek Role & Status Ban — pakai onAuthStateChange agar tidak stuck saat client-side nav
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_banned')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        if (profile.is_banned) {
          setIsBanned(true);
          setLoading(false);
          return;
        }

        const allowedRoles = ['breeder', 'seller', 'seller,breeder', 'admin', 'author'];
        if (!allowedRoles.includes(profile.role)) {
          router.replace('/dashboard-user');
        } else {
          setRole(profile.role);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Tampilan Loading
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Memeriksa Status Akun...</div>;

  // --- TAMPILAN JIKA TERKENA BAN ---
  if (isBanned) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
        <div className="relative z-50"><Navbar /></div>
        <div className="flex-grow flex flex-col items-center justify-center p-4 text-center z-0">
          <div className="bg-red-50 p-10 rounded-2xl shadow-xl border border-red-200 max-w-md animate-fade-in-up">
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ban className="text-red-600 w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-red-700 mb-2">Akun Dibekukan</h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Maaf, akun Anda telah dinonaktifkan oleh Administrator karena pelanggaran kebijakan. Anda tidak dapat mengakses fitur Minting atau Transfer.
            </p>

            <div className="bg-white p-4 rounded-xl border border-red-100 text-sm text-left mb-6">
              <p className="font-bold text-red-800 mb-1">Apa yang harus saya lakukan?</p>
              <p className="text-gray-500">Silakan hubungi admin melalui halaman laporan atau email untuk mengajukan banding.</p>
            </div>

            <Link href="/report" className="w-full block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-lg transition shadow-lg">
              Hubungi Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Tampilan Belum Connect Wallet
  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
        <div className="relative z-50"><Navbar /></div>
        <div className="flex-grow flex flex-col items-center justify-center p-4 text-center z-0">
          <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-200 max-w-md">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="text-orange-600 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Mitra</h1>
            <p className="text-gray-500 mb-8">
              Halo {role ? <span className="uppercase font-bold text-orange-600">{role}</span> : 'Mitra'}! <br />
              Silakan hubungkan Wallet untuk mengelola aset Ikan Koi Anda.
            </p>
            <button onClick={() => connectWallet()} className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white px-6 py-4 rounded-xl font-bold text-lg transition shadow-lg relative z-10">
              <Wallet size={24} /> Hubungkan Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <div className="relative z-50"><Navbar /></div>
      <Toaster position="top-center" />

      <main className="max-w-6xl mx-auto px-4 py-12 relative z-0">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 capitalize">{role} Dashboard</h1>
          <p className="text-gray-500 mt-1">Kelola sertifikat digital dan aset Koi Anda di sini.</p>
          {role.includes('seller') && !role.includes('breeder') && (
            <div className="mt-4 inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-2 rounded-xl">
              <span className="text-base">🏪</span>
              <span><strong>Seller</strong> hanya dapat transfer sertifikat. Mint hanya untuk Breeder.</span>
            </div>
          )}
          {role.includes('breeder') && !role.includes('seller') && (
            <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-2 rounded-xl">
              <span className="text-base">🐟</span>
              <span><strong>Breeder</strong> dapat menerbitkan sertifikat baru dan transfer kepemilikan.</span>
            </div>
          )}
          {role.includes('seller') && role.includes('breeder') && (
            <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-xl">
              <span className="text-base">⭐</span>
              <span><strong>Seller & Breeder</strong> — semua fitur aktif: Minting, Pemijahan, Transfer.</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* MENU 1: MINTING (hanya Breeder & Admin) */}
          {!role.includes('seller') || role.includes('breeder') ? (
            <Link href="/minting" className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-purple-200 transition duration-300">
              <div className="bg-purple-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition">
                <Database className="text-purple-600 w-7 h-7 group-hover:text-white transition" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Ikan Baru</h3>
              <p className="text-gray-500 text-sm mb-6">Terbitkan sertifikat digital (Minting) untuk ikan koi baru ke Blockchain.</p>
              <div className="flex items-center text-purple-600 font-bold text-sm group-hover:translate-x-2 transition">
                Mulai Upload <ArrowRight size={16} className="ml-2" />
              </div>
            </Link>
          ) : null}

          {/* MENU SESI PEMIJAHAN (hanya Breeder) */}
          {role.includes('breeder') && (
            <Link href="/minting/spawning" className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-orange-200 transition duration-300">
              <div className="bg-orange-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500 transition">
                <Baby className="text-orange-500 w-7 h-7 group-hover:text-white transition" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sesi Pemijahan</h3>
              <p className="text-gray-500 text-sm mb-6">Kelola sesi pemijahan dan batch mint anakan dari indukan yang terdaftar.</p>
              <div className="flex items-center text-orange-500 font-bold text-sm group-hover:translate-x-2 transition">
                Kelola Sesi <ArrowRight size={16} className="ml-2" />
              </div>
            </Link>
          )}

          {/* MENU 2: TRANSFER KEPEMILIKAN */}
          <Link href="/admin/transfer" className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-green-200 transition duration-300">
            <div className="bg-green-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition">
              <Send className="text-green-600 w-7 h-7 group-hover:text-white transition" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Transfer Kepemilikan</h3>
            <p className="text-gray-500 text-sm mb-6">Jual atau pindahkan hak milik sertifikat ikan ke pembeli lain.</p>
            <div className="flex items-center text-green-600 font-bold text-sm group-hover:translate-x-2 transition">
              Kirim Aset <ArrowRight size={16} className="ml-2" />
            </div>
          </Link>

          {/* MENU 3: UPDATE PERTUMBUHAN */}
          <Link href="/admin/update-koi" className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-cyan-200 transition duration-300">
            <div className="bg-cyan-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cyan-600 transition">
              <Activity className="text-cyan-600 w-7 h-7 group-hover:text-white transition" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Update Data</h3>
            <p className="text-gray-500 text-sm mb-6">Perbarui ukuran, umur, atau foto terkini dari ikan yang Anda miliki.</p>
            <div className="flex items-center text-cyan-600 font-bold text-sm group-hover:translate-x-2 transition">
              Update Sekarang <ArrowRight size={16} className="ml-2" />
            </div>
          </Link>

          {/* MENU 4: KOLEKSI KOI */}
          <Link href="/dashboard-owner/collection" className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition duration-300">
            <div className="bg-blue-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition">
              <BookOpen className="text-blue-600 w-7 h-7 group-hover:text-white transition" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Koleksi Koi Saya</h3>
            <p className="text-gray-500 text-sm mb-6">Lihat semua sertifikat koi yang telah diterbitkan oleh akun Anda.</p>
            <div className="flex items-center text-blue-600 font-bold text-sm group-hover:translate-x-2 transition">
              Lihat Koleksi <ArrowRight size={16} className="ml-2" />
            </div>
          </Link>

        </div>
      </main>
    </div>
  );
}