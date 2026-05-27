'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { PenLine, ArrowRight, Ban, BookOpen, Eye } from 'lucide-react';
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
                if (profile.role !== 'author' && profile.role !== 'admin') {
                    router.replace('/dashboard-user');
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
                <div className="relative z-50"><Navbar /></div>
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
            <Toaster position="top-center" />

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* MENU 1: TULIS BERITA BARU */}
                    <Link
                        href="/dashboard-author/news/create"
                        className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-red-200 transition duration-300"
                    >
                        <div className="bg-red-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-600 transition">
                            <PenLine className="text-red-600 w-7 h-7 group-hover:text-white transition" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Tulis Berita Baru</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Buat dan terbitkan artikel berita baru seputar dunia Koi, kontes, atau tips perawatan.
                        </p>
                        <div className="flex items-center text-red-600 font-bold text-sm group-hover:translate-x-2 transition">
                            Mulai Menulis <ArrowRight size={16} className="ml-2" />
                        </div>
                    </Link>

                    {/* MENU 2: KELOLA BERITA */}
                    <Link
                        href="/dashboard-author/news"
                        className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-orange-200 transition duration-300"
                    >
                        <div className="bg-orange-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500 transition">
                            <BookOpen className="text-orange-500 w-7 h-7 group-hover:text-white transition" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Kelola Berita</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Lihat, edit, atau hapus berita yang sudah pernah kamu tulis dan terbitkan.
                        </p>
                        <div className="flex items-center text-orange-500 font-bold text-sm group-hover:translate-x-2 transition">
                            Lihat Semua <ArrowRight size={16} className="ml-2" />
                        </div>
                    </Link>

                    {/* MENU 3: PREVIEW HALAMAN BERITA */}
                    <Link
                        href="/news"
                        target="_blank"
                        className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition duration-300"
                    >
                        <div className="bg-blue-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition">
                            <Eye className="text-blue-600 w-7 h-7 group-hover:text-white transition" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Lihat Halaman Berita</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Buka halaman berita publik untuk melihat tampilan artikel yang sudah terbit.
                        </p>
                        <div className="flex items-center text-blue-600 font-bold text-sm group-hover:translate-x-2 transition">
                            Buka di Tab Baru <ArrowRight size={16} className="ml-2" />
                        </div>
                    </Link>

                </div>
            </main>
        </div>
    );
}
