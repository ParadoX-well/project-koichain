'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Database, Send, Activity, ShieldAlert, Wallet, ArrowRight, Ban, Baby, BookOpen, Compass, Store, Newspaper, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Navbar from "@/components/Navbar";
import { Toaster } from 'react-hot-toast';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function MitraDashboard() {
  const { account, connectWallet } = useWallet();
  const router = useRouter();
  const [role, setRole] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false); // State baru untuk status Ban

  const { user: authUser, loading: authLoading } = useRequireAuth();

  useEffect(() => {
    if (!authUser) return;

    supabase
      .from('profiles')
      .select('role, is_banned, full_name')
      .eq('id', authUser.id)
      .single()
      .then(({ data: profile }) => {
        if (!profile) return;

        if (profile.is_banned) {
          setIsBanned(true);
          setLoading(false);
          return;
        }

        const allowedRoles = ['breeder', 'seller', 'seller,breeder'];
        const hasAccess = allowedRoles.includes(profile.role) ||
          (typeof profile.role === 'string' && (profile.role.includes('breeder') || profile.role.includes('seller')));

        if (hasAccess) {
          setRole(profile.role);
          if (profile.full_name) {
            setFullName(profile.full_name);
          }
        } else {
          // Redirect ke dashboard yang sesuai dengan role
          if (profile.role === 'admin') router.replace('/dashboard-admin');
          else if (profile.role === 'author') router.replace('/dashboard-author');
          else router.replace('/dashboard-user');
        }
        setLoading(false);
      });
  }, [authUser, router]);

  // Tampilan Loading
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Memeriksa Status Akun...</div>;

  // --- TAMPILAN JIKA TERKENA BAN ---
  if (isBanned) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
        <Navbar />
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
        <Navbar />
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
      <Navbar />
      <Toaster position="top-center" />

      <main className="max-w-6xl mx-auto px-4 py-12 relative z-0">
        <div className="mb-10">
          <p className="text-sm font-bold text-red-600 uppercase tracking-widest mb-1">
            {role.includes('seller') && role.includes('breeder') ? 'Breeder & Seller Dashboard' :
              role.includes('breeder') ? 'Breeder Dashboard' : 'Seller Dashboard'}
          </p>
          <h1 className="text-3xl font-bold text-gray-900">
            Selamat datang, <span className="capitalize">{fullName || 'Mitra'}</span> 👋
          </h1>
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

        {/* --- SEKSI 1: OPERASIONAL BLOCKCHAIN --- */}
        <div className="mb-10">
          <div className="mb-6 border-b border-gray-200 pb-4">
            <h2 className="text-xl font-bold text-gray-900">Operasional Blockchain</h2>
            <p className="text-gray-500 text-sm mt-1">Aksi langsung ke jaringan Ethereum untuk mengelola aset Koi Anda.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* MENU 1: MINTING (hanya Breeder & Admin) */}
          {!role.includes('seller') || role.includes('breeder') ? (
            <Link href="/minting" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-100 rounded-full blur-3xl opacity-50 group-hover:bg-purple-200 transition"></div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <Database className="text-purple-600 w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">Upload Ikan Baru</h3>
                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Terbitkan sertifikat digital (Minting) untuk ikan koi baru ke Blockchain.</p>
                <div className="flex items-center text-purple-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                  Mulai Upload <ArrowRight size={18} className="ml-2" />
                </div>
              </div>
            </Link>
          ) : null}

          {/* Menu Update */}
          <Link href="/update-koi" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-100 rounded-full blur-3xl opacity-50 group-hover:bg-cyan-200 transition"></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Activity className="text-cyan-600 w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Update Data</h3>
              <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Perbarui ukuran, umur, atau foto terkini dari ikan yang Anda miliki.</p>
              <div className="flex items-center text-cyan-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                Update Sekarang <ArrowRight size={18} className="ml-2" />
              </div>
            </div>
          </Link>

          {/* Menu Transfer */}
          <Link href="/transfer" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-green-100 rounded-full blur-3xl opacity-50 group-hover:bg-green-200 transition"></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Send className="text-green-600 w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Transfer Kepemilikan</h3>
              <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Jual atau pindahkan hak milik sertifikat ikan ke pembeli lain.</p>
              <div className="flex items-center text-green-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                Kirim Aset <ArrowRight size={18} className="ml-2" />
              </div>
            </div>
          </Link>


          {/* MENU SESI PEMIJAHAN (hanya Breeder) */}
          {role.includes('breeder') && (
            <Link href="/minting/spawning" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-100 rounded-full blur-3xl opacity-50 group-hover:bg-orange-200 transition"></div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <Baby className="text-orange-600 w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">Sesi Pemijahan</h3>
                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Kelola sesi pemijahan dan batch mint anakan dari indukan yang terdaftar.</p>
                <div className="flex items-center text-orange-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                  Kelola Sesi <ArrowRight size={18} className="ml-2" />
                </div>
              </div>
            </Link>
          )}

          </div>
        </div>

        {/* --- SEKSI 2: EKSPLORASI & KATALOG --- */}
        <div className="mb-10">
          <div className="mb-6 border-b border-gray-200 pb-4">
            <h2 className="text-xl font-bold text-gray-900">Eksplorasi & Katalog</h2>
            <p className="text-gray-500 text-sm mt-1">Lihat koleksi aset, jelajahi galeri publik, dan temukan mitra resmi.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* MENU 4: KOLEKSI KOI */}
          <Link href="/dashboard-mitra/collection" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50 group-hover:bg-blue-200 transition"></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <BookOpen className="text-blue-600 w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Koleksi Koi Saya</h3>
              <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Lihat semua sertifikat koi yang telah diterbitkan oleh akun Anda.</p>
              <div className="flex items-center text-blue-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                Lihat Koleksi <ArrowRight size={18} className="ml-2" />
              </div>
            </div>
          </Link>

          {/* MENU 5: JELAJAHI KOLEKSI PUBLIK */}
          <Link href="/koi" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-sky-100 rounded-full blur-3xl opacity-50 group-hover:bg-sky-200 transition"></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-sky-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Compass className="text-sky-600 w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Jelajahi Semua Koleksi</h3>
              <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Jelajahi galeri publik untuk melihat semua data sertifikat koi yang terdaftar di blockchain.</p>
              <div className="flex items-center text-sky-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                Jelajahi Sekarang <ArrowRight size={18} className="ml-2" />
              </div>
            </div>
          </Link>

          {/* MENU 6: KATALOG MITRA */}
          <Link href="/mitra" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-50 group-hover:bg-indigo-200 transition"></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Store className="text-indigo-600 w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Katalog Mitra</h3>
              <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Jelajahi daftar seluruh mitra (Breeder & Seller) resmi yang terdaftar di KoiChain.</p>
              <div className="flex items-center text-indigo-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                Lihat Mitra <ArrowRight size={18} className="ml-2" />
              </div>
            </div>
          </Link>

          {/* MENU 7: LIHAT SEMUA BERITA */}
          <Link href="/news" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-100 rounded-full blur-3xl opacity-50 group-hover:bg-teal-200 transition"></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Newspaper className="text-teal-600 w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Lihat Semua Berita</h3>
              <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Ikuti perkembangan terbaru, panduan perawatan, dan event seputar dunia KoiChain.</p>
              <div className="flex items-center text-teal-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                Baca Berita <ArrowRight size={18} className="ml-2" />
              </div>
            </div>
          </Link>

          {/* MENU 8: FORM PENGADUAN */}
          <Link href="/report" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-100 rounded-full blur-3xl opacity-50 group-hover:bg-rose-200 transition"></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-rose-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <MessageSquare className="text-rose-600 w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Formulir Pengaduan</h3>
              <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Laporkan kendala, sertifikat bermasalah, atau pertanyaan langsung ke admin kami.</p>
              <div className="flex items-center text-rose-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                Buat Laporan <ArrowRight size={18} className="ml-2" />
              </div>
            </div>
          </Link>

          </div>
        </div>
      </main>
    </div>
  );
}
