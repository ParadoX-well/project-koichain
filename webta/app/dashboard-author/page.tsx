'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { PenLine, ArrowRight, Ban, BookOpen, Eye, Newspaper } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';

export default function AuthorDashboard() {
    const router = useRouter();
    const [fullName, setFullName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isBanned, setIsBanned] = useState(false);

    const { user: authUser, loading: authLoading } = useRequireAuth();

    useEffect(() => {
        if (!authUser) return;

        supabase.from('profiles').select('role, is_banned, full_name').eq('id', authUser.id).single()
            .then(({ data: profile }) => {
                if (!profile) return;
                if (profile.is_banned) { setIsBanned(true); setLoading(false); return; }
                if (profile.role !== 'author') {
                    if (profile.role === 'admin') router.replace('/dashboard-admin');
                    else if (['seller', 'breeder', 'seller,breeder'].includes(profile.role)) router.replace('/dashboard-mitra');
                    else router.replace('/dashboard-user');
                    return;
                }
                setFullName(profile.full_name ?? '');
                setLoading(false);
            });
    }, [authUser, router]);

    // Loading
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
            Memeriksa Status Akun...
        </div>
    );

    // --- TAMPILAN JIKA TERKENA BAN ---
    if (isBanned) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center p-4 text-center z-0">
                    <div className="bg-red-50 p-10 rounded-2xl shadow-xl border border-red-200 max-w-md">
                        <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Ban className="text-red-600 w-10 h-10" />
                        </div>
                        <h1 className="text-2xl font-bold text-red-700 mb-2">Akun Dibekukan</h1>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Maaf, akun Anda telah dinonaktifkan oleh Administrator karena pelanggaran kebijakan.
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

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <div className="relative z-50"><Navbar /></div>

            <main className="max-w-6xl mx-auto px-4 py-12 relative z-0">
                {/* Header */}
                <div className="mb-10">
                    <p className="text-sm font-bold text-red-600 uppercase tracking-widest mb-1">Author Panel</p>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Selamat datang, <span className="capitalize">{fullName || 'Author'}</span> 👋
                    </h1>
                    <p className="text-gray-500 mt-1">Kelola dan terbitkan konten berita seputar dunia Koi dari sini.</p>
                </div>

                {/* Menu Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* MENU 1: TULIS BERITA BARU */}
                    <Link
                        href="/dashboard-author/news/create"
                        className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-100 rounded-full blur-3xl opacity-50 group-hover:bg-red-200 transition"></div>
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <PenLine className="text-red-600 w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-3">Tulis Berita Baru</h3>
                            <p className="text-gray-500 mb-8 leading-relaxed flex-grow">
                                Buat dan terbitkan artikel berita baru seputar dunia Koi, kontes, atau tips perawatan.
                            </p>
                            <div className="flex items-center text-red-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                                Mulai Menulis <ArrowRight size={18} className="ml-2" />
                            </div>
                        </div>
                    </Link>

                    {/* MENU 2: KELOLA BERITA */}
                    <Link
                        href="/dashboard-author/news"
                        className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-yellow-100 rounded-full blur-3xl opacity-50 group-hover:bg-yellow-200 transition"></div>
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <BookOpen className="text-yellow-600 w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-3">Kelola Berita</h3>
                            <p className="text-gray-500 mb-8 leading-relaxed flex-grow">
                                Lihat, edit, atau hapus berita yang sudah pernah kamu tulis dan terbitkan.
                            </p>
                            <div className="flex items-center text-yellow-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                                Lihat Semua <ArrowRight size={18} className="ml-2" />
                            </div>
                        </div>
                    </Link>

                    {/* MENU 3: LIHAT SEMUA BERITA */}
                    <Link
                        href="/news"
                        className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-100 rounded-full blur-3xl opacity-50 group-hover:bg-teal-200 transition"></div>
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <Newspaper className="text-teal-600 w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-3">Lihat Semua Berita</h3>
                            <p className="text-gray-500 mb-8 leading-relaxed flex-grow">
                                Ikuti perkembangan terbaru, panduan perawatan, dan event seputar dunia KoiChain.
                            </p>
                            <div className="flex items-center text-teal-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                                Baca Berita <ArrowRight size={18} className="ml-2" />
                            </div>
                        </div>
                    </Link>

                </div>
            </main>
        </div>
    );
}
