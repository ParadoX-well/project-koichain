'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Calendar, Tag, Newspaper, AlertCircle } from 'lucide-react';

type NewsDetail = {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    category: string | null;
    image_url: string | null;
    is_main: boolean;
    created_at: string;
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function SkeletonDetail() {
    return (
        <div className="animate-pulse max-w-3xl mx-auto px-6 py-12">
            <div className="h-4 w-32 bg-gray-200 rounded mb-8" />
            <div className="h-3 w-24 bg-gray-200 rounded mb-4" />
            <div className="h-10 w-full bg-gray-200 rounded mb-2" />
            <div className="h-10 w-3/4 bg-gray-200 rounded mb-6" />
            <div className="h-4 w-40 bg-gray-200 rounded mb-8" />
            <div className="h-72 w-full bg-gray-200 rounded-2xl mb-10" />
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`h-4 bg-gray-200 rounded mb-3 ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
            ))}
        </div>
    );
}

export default function NewsDetailPage() {
    const params = useParams();
    const slug = params?.slug as string;

    const [news, setNews] = useState<NewsDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!slug) return;

        async function fetchNewsDetail() {
            const { data, error } = await supabase
                .from('news')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error || !data) {
                setNotFound(true);
            } else {
                setNews(data as NewsDetail);
            }
            setLoading(false);
        }

        fetchNewsDetail();
    }, [slug]);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            <main className="flex-grow">

                {/* Loading */}
                {loading && <SkeletonDetail />}

                {/* Not Found */}
                {!loading && notFound && (
                    <div className="flex flex-col items-center justify-center py-40 text-center text-gray-400 gap-4">
                        <AlertCircle size={56} strokeWidth={1} />
                        <p className="text-xl font-bold text-gray-700">Berita tidak ditemukan</p>
                        <p className="text-sm text-gray-400">Berita yang kamu cari mungkin sudah dihapus atau salah URL.</p>
                        <Link href="/news" className="mt-4 text-red-600 font-bold flex items-center gap-2 hover:underline">
                            <ArrowLeft size={16} /> Kembali ke Semua Berita
                        </Link>
                    </div>
                )}

                {/* Konten Berita */}
                {!loading && news && (
                    <article>

                        {/* ===== HEADER SECTION ===== */}
                        <div className="bg-white text-gray-900 w-full px-6 py-10 md:py-14 border-b border-gray-100">
                            <div className="max-w-3xl mx-auto">

                                {/* Kembali */}
                                <Link
                                    href="/news"
                                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 font-medium transition mb-6 group"
                                >
                                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition duration-200" />
                                    Kembali ke Semua Berita
                                </Link>

                                {/* Badge kategori */}
                                <div className="flex flex-wrap items-center gap-2 mb-5">
                                    {news.category && (
                                        <span className="inline-block bg-red-600 text-white text-[11px] font-extrabold px-3 py-1 rounded uppercase tracking-widest">
                                            {news.category}
                                        </span>
                                    )}
                                    {news.is_main && (
                                        <span className="inline-block border border-red-300 text-red-600 text-[11px] font-bold px-3 py-1 rounded uppercase tracking-widest">
                                            Berita Utama
                                        </span>
                                    )}
                                </div>

                                {/* Judul besar */}
                                <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight uppercase mb-5">
                                    {news.title}
                                </h1>

                                {/* Tanggal */}
                                <p className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Calendar size={14} />
                                    {formatDate(news.created_at)}
                                </p>
                            </div>
                        </div>

                        {/* ===== HERO IMAGE ===== */}
                        <div className="bg-white">
                            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
                                {news.image_url ? (
                                    <img
                                        src={news.image_url}
                                        alt={news.title}
                                        className="w-full h-auto rounded-2xl"
                                    />
                                ) : (
                                    <div className="w-full h-64 rounded-2xl bg-gray-100 flex items-center justify-center">
                                        <Newspaper size={48} className="text-gray-300" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ===== KONTEN ARTIKEL (putih) ===== */}
                        <div className="bg-white">
                        <div className="max-w-3xl mx-auto px-6 py-10">


                            {/* Divider */}
                            <hr className="border-gray-100 mb-8" />

                            {/* Isi Berita */}
                            {news.content ? (
                                <div className="max-w-none">
                                    {news.content.split('\n').map((line, i) => {
                                        const trimmed = line.trim();

                                        // Gambar inline: ![keterangan](url)
                                        const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
                                        if (imageMatch) {
                                            return (
                                                <figure key={i} className="my-8">
                                                    <img
                                                        src={imageMatch[2]}
                                                        alt={imageMatch[1]}
                                                        className="w-full rounded-2xl object-cover shadow-md"
                                                    />
                                                    {imageMatch[1] && (
                                                        <figcaption className="text-center text-xs text-gray-400 mt-3 italic">
                                                            {imageMatch[1]}
                                                        </figcaption>
                                                    )}
                                                </figure>
                                            );
                                        }

                                        // Heading 2: ## Judul Seksi
                                        if (trimmed.startsWith('## ')) {
                                            return (
                                                <h2 key={i} className="text-2xl font-extrabold text-gray-900 mt-10 mb-4 tracking-tight">
                                                    {trimmed.slice(3)}
                                                </h2>
                                            );
                                        }

                                        // Heading 3: ### Sub Judul
                                        if (trimmed.startsWith('### ')) {
                                            return (
                                                <h3 key={i} className="text-xl font-bold text-gray-800 mt-8 mb-3">
                                                    {trimmed.slice(4)}
                                                </h3>
                                            );
                                        }

                                        // Baris kosong
                                        if (!trimmed) return <div key={i} className="h-3" />;

                                        // Paragraf biasa
                                        return (
                                            <p key={i} className="mb-5 text-gray-700 text-base leading-[1.85rem]">
                                                {line}
                                            </p>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-400 italic text-center py-12">Konten berita belum tersedia.</p>
                            )}

                            {/* Footer Artikel */}
                            <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <p className="text-xs text-gray-400">
                                    Diterbitkan pada {formatDate(news.created_at)}
                                </p>
                                <Link
                                    href="/news"
                                    className="inline-flex items-center gap-2 text-sm font-bold text-red-600 border border-red-200 px-5 py-2 rounded-full hover:bg-red-600 hover:text-white transition"
                                >
                                    <ArrowLeft size={14} /> Berita Lainnya
                                </Link>
                            </div>
                        </div>
                        </div>
                    </article>
                )}
            </main>

            <Footer />
        </div>
    );
}
