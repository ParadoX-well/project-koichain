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
            const { data, error } = await supabase
                .from('news')
                .select('id, title, slug, content, category, image_url, is_main, created_at')
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

                {/* Grid Layout ala F1 */}
                {!loading && news.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* BERITA UTAMA (KIRI - BESAR) */}
                        {mainNews && (
                            <Link
                                href={`/news/${mainNews.slug}`}
                                className="group relative block h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-xl"
                            >
                                {mainNews.image_url ? (
                                    <img
                                        src={mainNews.image_url}
                                        alt={mainNews.title}
                                        className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                                <div className="absolute bottom-0 left-0 p-8 w-full">
                                    {mainNews.category && (
                                        <span className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-wider mb-3">
                                            {mainNews.category}
                                        </span>
                                    )}
                                    <h3 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4 group-hover:underline decoration-red-600 decoration-4 underline-offset-4">
                                        {mainNews.title}
                                    </h3>
                                    <div className="flex items-center gap-4 text-gray-300 text-sm font-medium">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} /> {formatDate(mainNews.created_at)}
                                        </span>
                                        <span className="flex items-center gap-1 group-hover:text-white transition">
                                            Baca Selengkapnya <ArrowRight size={14} />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* BERITA SAMPING (KANAN - LIST VERTIKAL) */}
                        <div className="flex flex-col gap-6">
                            {sideNews.map((item) => (
                                <Link
                                    href={`/news/${item.slug}`}
                                    key={item.id}
                                    className="group flex flex-col md:flex-row gap-6 bg-white p-4 rounded-xl shadow-sm hover:shadow-md border border-gray-100 transition h-full"
                                >
                                    <div className="w-full md:w-48 h-48 md:h-full rounded-lg overflow-hidden flex-shrink-0 relative">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.title}
                                                className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                <Newspaper size={32} className="text-gray-300" />
                                            </div>
                                        )}
                                        {item.category && (
                                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                {item.category}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col justify-center py-2 pr-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mb-2 uppercase tracking-wide">
                                            {item.category && <><Tag size={12} className="text-red-500" /> {item.category}</>}
                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                            <Calendar size={12} /> {formatDate(item.created_at)}
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900 mb-3 leading-snug group-hover:text-red-600 transition">
                                            {item.title}
                                        </h4>
                                        {item.content && (
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                                                {item.content.replace(/[#*_`[\]]/g, '').slice(0, 120)}...
                                            </p>
                                        )}
                                        <span className="text-red-600 text-sm font-bold flex items-center gap-1 group-hover:translate-x-2 transition duration-300">
                                            Baca <ArrowRight size={14} />
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>

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