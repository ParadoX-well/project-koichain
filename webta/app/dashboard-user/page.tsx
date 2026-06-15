'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Search, Store, Compass, ArrowRight, ShieldCheck, Newspaper, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Navbar from "@/components/Navbar";
import { Toaster } from 'react-hot-toast';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function UserDashboard() {
  const router = useRouter();
  const [role, setRole] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const { user: authUser, loading: authLoading } = useRequireAuth();

  useEffect(() => {
    if (!authUser) return;

    supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', authUser.id)
      .single()
      .then(({ data: profile }) => {
        if (!profile) return;

        setRole(profile.role);
        if (profile.full_name) {
          setFullName(profile.full_name);
        }
        
        // If they are admin or author, they might want to go to their own dashboard, but let's allow them here.
        setLoading(false);
      });
  }, [authUser]);

  // Tampilan Loading
  if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Memuat Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-12 relative z-0">
        <div className="mb-10">
          <p className="text-sm font-bold text-orange-600 uppercase tracking-widest mb-1">
            Dashboard Pengguna
          </p>
          <h1 className="text-3xl font-bold text-gray-900">
            Selamat datang, <span className="capitalize">{fullName || 'Pengguna'}</span> 👋
          </h1>
          <p className="text-gray-500 mt-1">Jelajahi dunia digital KoiChain dan mulai koleksi Anda.</p>
          
          {role === 'user' && (
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 p-6 rounded-2xl">
              <div className="bg-orange-100 p-3 rounded-full shrink-0">
                <ShieldCheck className="text-orange-600 w-8 h-8" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-bold text-gray-900 text-lg">Ingin Menerbitkan Sertifikat Sendiri?</h3>
                <p className="text-gray-600 text-sm mt-1">Daftar menjadi Mitra (Breeder / Seller) resmi kami untuk mengelola dan menerbitkan sertifikat Koi secara digital di blockchain.</p>
              </div>
              <Link href="/profile-setting/verification" className="shrink-0 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition">
                Daftar Jadi Mitra
              </Link>
            </div>
          )}
        </div>

        {/* --- SEKSI: EKSPLORASI & RIWAYAT --- */}
        <div className="mb-10">
          <div className="mb-6 border-b border-gray-200 pb-4">
            <h2 className="text-xl font-bold text-gray-900">Eksplorasi & Layanan</h2>
            <p className="text-gray-500 text-sm mt-1">Jelajahi koleksi aset, temukan mitra resmi, dan lacak riwayat sertifikat.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* MENU: JELAJAHI KOLEKSI PUBLIK */}
            <Link href="/koi" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-sky-100 rounded-full blur-3xl opacity-50 group-hover:bg-sky-200 transition"></div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-sky-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <Compass className="text-sky-600 w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">Jelajahi Semua Koleksi</h3>
                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Lihat semua data sertifikat koi yang terdaftar di ekosistem blockchain KoiChain.</p>
                <div className="flex items-center text-sky-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                  Jelajahi Sekarang <ArrowRight size={18} className="ml-2" />
                </div>
              </div>
            </Link>

            {/* MENU: KATALOG MITRA */}
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

            {/* MENU: CEK & RIWAYAT */}
            <Link href="/check" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-100 rounded-full blur-3xl opacity-50 group-hover:bg-purple-200 transition"></div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <Search className="text-purple-600 w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">Cek & Riwayat</h3>
                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Lacak keaslian sertifikat dan riwayat transaksi perpindahan kepemilikan Koi.</p>
                <div className="flex items-center text-purple-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                  Mulai Melacak <ArrowRight size={18} className="ml-2" />
                </div>
              </div>
            </Link>

            {/* MENU: LIHAT SEMUA BERITA */}
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

            {/* MENU: FORM PENGADUAN */}
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
