'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, Tag, Newspaper } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Tipe data untuk satu berita dari Supabase
type NewsItem = {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    category: string | null;
    image_url: string | null;
    is_main: boolean;
    created_at: string;
};

// Helper: format tanggal dari ISO string ke "DD Mon YYYY"
function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

// Komponen Skeleton Loading untuk Berita Utama
function MainNewsSkeleton() {
    return (
        <div className="animate-pulse h-[400px] lg:h-[500px] rounded-2xl bg-gray-200" />
    );
}

// Komponen Skeleton Loading untuk Berita Samping
function SideNewsSkeleton() {
    return (
        <div className="flex flex-col md:flex-row gap-6 bg-white p-4 rounded-xl border border-gray-100">
            <div className="animate-pulse w-full md:w-48 h-36 rounded-lg bg-gray-200 flex-shrink-0" />
            <div className="flex flex-col justify-center gap-3 flex-1 py-2">
                <div className="animate-pulse h-3 w-24 bg-gray-200 rounded" />
                <div className="animate-pulse h-5 w-full bg-gray-200 rounded" />
                <div className="animate-pulse h-5 w-3/4 bg-gray-200 rounded" />
                <div className="animate-pulse h-3 w-16 bg-gray-200 rounded" />
            </div>
        </div>
    );
}

export default function NewsSection() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNews() {
            // FIX: Dobrak status Auth dulu supaya antrian request database tidak hang
            await supabase.auth.getSession();

            const { data, error } = await supabase
                .from('news')
                .select('id, title, slug, content, category, image_url, is_main, created_at')
                .order('is_main', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(4);

            if (!error && data) {
                setNews(data as NewsItem[]);
            }
            setLoading(false);
        }

        fetchNews();
    }, []);

    const mainNews = news.find((n) => n.is_main) ?? news[0] ?? null;
    const sideNews = news.filter((n) => n.id !== mainNews?.id).slice(0, 3);

    return (
        <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-6">

                {/* Header Section */}
                <div className="flex justify-between items-end mb-10 border-b-4 border-red-600 pb-4">
                    <div>
                        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight uppercase italic">
                            Koi News <span className="text-red-600">Feed</span>
                        </h2>
                        <p className="text-gray-500 mt-2">Update terbaru seputar dunia Koi, kontes, dan tips perawatan.</p>
                    </div>
                    <Link href="/news" className="hidden md:flex items-center gap-2 font-bold text-red-600 hover:text-red-800 transition">
                        Lihat Semua Berita <ArrowRight size={20} />
                    </Link>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <MainNewsSkeleton />
                        <div className="flex flex-col gap-6">
                            <SideNewsSkeleton />
                            <SideNewsSkeleton />
                            <SideNewsSkeleton />
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && news.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center text-gray-400 gap-4">
                        <Newspaper size={56} strokeWidth={1} />
                        <p className="text-lg font-semibold">Belum ada berita yang diterbitkan.</p>
                        <p className="text-sm">Pantau terus halaman ini untuk update terbaru!</p>
                    </div>
                )}

                {/* Modern Layout: 1 Hero (Top), 3 Cards Grid (Bottom) */}
                {!loading && news.length > 0 && (
                    <div className="flex flex-col gap-8">
                        {/* BERITA UTAMA (HERO - ATAS) */}
                        {mainNews && (
                            <Link
                                href={`/news/${mainNews.slug}`}
                                className="group relative block w-full h-[400px] lg:h-[500px] rounded-3xl overflow-hidden shadow-xl"
                            >
                                {mainNews.image_url ? (
                                    <img
                                        src={mainNews.image_url}
                                        alt={mainNews.title}
                                        className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black" />
                                )}
                                {/* Overlay Gradient - lebih gelap di bawah agar teks terbaca jelas */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                                <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full lg:w-3/4">
                                    {mainNews.category && (
                                        <span className="inline-block bg-orange-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 shadow-lg shadow-orange-900/50">
                                            {mainNews.category}
                                        </span>
                                    )}
                                    <h3 className="text-3xl lg:text-5xl font-black text-white leading-tight mb-4 group-hover:text-orange-400 transition-colors duration-300">
                                        {mainNews.title}
                                    </h3>
                                    {mainNews.content && (
                                        <p className="text-gray-300 text-sm lg:text-base line-clamp-2 mb-6 max-w-2xl">
                                            {mainNews.content.replace(/[#*_`[\]]/g, '').slice(0, 150)}...
                                        </p>
                                    )}
                                    <div className="flex items-center gap-6 text-gray-300 text-sm font-medium">
                                        <span className="flex items-center gap-2">
                                            <Calendar size={16} /> {formatDate(mainNews.created_at)}
                                        </span>
                                        <span className="flex items-center gap-2 text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full transition">
                                            Baca Artikel <ArrowRight size={16} />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* BERITA SAMPING (GRID 3 KOLOM BAWAH) */}
                        {sideNews.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {sideNews.map((item) => (
                                    <Link
                                        href={`/news/${item.slug}`}
                                        key={item.id}
                                        className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 transition-all duration-300 flex flex-col"
                                    >
                                        <div className="w-full h-56 relative overflow-hidden bg-gray-100">
                                            {item.image_url ? (
                                                <img
                                                    src={item.image_url}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Newspaper size={40} className="text-gray-300" />
                                                </div>
                                            )}
                                            {item.category && (
                                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase shadow-sm">
                                                    {item.category}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6 flex flex-col flex-grow">
                                            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-3">
                                                <Calendar size={14} /> {formatDate(item.created_at)}
                                            </div>
                                            <h4 className="text-xl font-bold text-gray-900 mb-3 leading-snug group-hover:text-orange-600 transition-colors">
                                                {item.title}
                                            </h4>
                                            {item.content && (
                                                <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-grow">
                                                    {item.content.replace(/[#*_`[\]]/g, '').slice(0, 120)}...
                                                </p>
                                            )}
                                            <span className="text-orange-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 mt-auto transition-all">
                                                Selengkapnya <ArrowRight size={16} />
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tombol Mobile */}
                <div className="mt-8 text-center md:hidden">
                    <Link href="/news" className="inline-flex items-center gap-2 font-bold text-red-600 border-2 border-red-600 px-6 py-3 rounded-full hover:bg-red-600 hover:text-white transition">
                        Lihat Semua Berita <ArrowRight size={20} />
                    </Link>
                </div>

            </div>
        </section>
    );
}