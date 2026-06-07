'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Calendar, Tag, Newspaper, Search } from 'lucide-react';

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

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function NewsCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
            <div className="h-52 bg-gray-200 w-full" />
            <div className="p-5 flex flex-col gap-3">
                <div className="h-3 w-20 bg-gray-200 rounded" />
                <div className="h-5 w-full bg-gray-200 rounded" />
                <div className="h-5 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-200 rounded mt-2" />
            </div>
        </div>
    );
}

const ALL_CATEGORIES = ['Semua', 'Kontes Internasional', 'Tips Perawatan', 'Ensiklopedia', 'Berita Industri', 'Info'];

export default function NewsPage() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState<string[]>(ALL_CATEGORIES);

    useEffect(() => {
        async function fetchNews() {
            const { data, error } = await supabase
                .from('news')
                .select('id, title, slug, content, category, image_url, is_main, created_at')
                .order('is_main', { ascending: false })
                .order('created_at', { ascending: false });

            if (!error && data) {
                const items = data as NewsItem[];
                setNews(items);

                // Ambil kategori unik dari data
                const uniqueCats = Array.from(new Set(items.map(n => n.category).filter(Boolean))) as string[];
                setCategories(['Semua', ...uniqueCats]);
            }
            setLoading(false);
        }

        fetchNews();
    }, []);

    const filtered = news.filter((item) => {
        const matchCategory = activeCategory === 'Semua' || item.category === activeCategory;
        const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-grow">
                {/* Hero Header */}
                <section className="bg-white border-b border-gray-200 py-12">
                    <div className="max-w-6xl mx-auto px-6">
                        <BackButton />
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <p className="text-sm font-bold text-red-600 uppercase tracking-widest mb-2">Koi News Feed</p>
                                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 uppercase italic tracking-tight">
                                    Semua <span className="text-red-600">Berita</span>
                                </h1>
                                <p className="text-gray-500 mt-3 max-w-lg">
                                    Kumpulan artikel, tips, dan informasi terkini seputar dunia Koi, kontes, dan perawatan.
                                </p>
                            </div>

                            {/* Search Box */}
                            <div className="relative w-full md:w-72">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari berita..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                                />
                            </div>
                        </div>

                        {/* Filter Kategori */}
                        <div className="flex flex-wrap gap-2 mt-8">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-bold border transition ${
                                        activeCategory === cat
                                            ? 'bg-red-600 text-white border-red-600'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Daftar Berita */}
                <section className="max-w-6xl mx-auto px-6 py-12">

                    {/* Loading */}
                    {loading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 6 }).map((_, i) => <NewsCardSkeleton key={i} />)}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-32 text-center text-gray-400 gap-4">
                            <Newspaper size={56} strokeWidth={1} />
                            <p className="text-lg font-semibold">
                                {searchQuery ? `Tidak ada berita untuk "${searchQuery}"` : 'Belum ada berita di kategori ini.'}
                            </p>
                            <button
                                onClick={() => { setSearchQuery(''); setActiveCategory('Semua'); }}
                                className="text-sm text-red-600 font-bold hover:underline"
                            >
                                Reset Filter
                            </button>
                        </div>
                    )}

                    {/* Grid Berita */}
                    {!loading && filtered.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/news/${item.slug}`}
                                    className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:border-red-200 transition duration-300 flex flex-col"
                                >
                                    {/* Gambar */}
                                    <div className="relative h-52 overflow-hidden bg-gray-100">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.title}
                                                className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                <Newspaper size={40} className="text-gray-300" />
                                            </div>
                                        )}
                                        {item.is_main && (
                                            <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                Utama
                                            </span>
                                        )}
                                        {item.category && (
                                            <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                {item.category}
                                            </span>
                                        )}
                                    </div>

                                    {/* Konten */}
                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-3">
                                            {item.category && <><Tag size={11} className="text-red-400" /> {item.category}</>}
                                            {item.category && <span className="w-1 h-1 bg-gray-300 rounded-full" />}
                                            <Calendar size={11} /> {formatDate(item.created_at)}
                                        </div>

                                        <h2 className="text-lg font-bold text-gray-900 leading-snug mb-2 group-hover:text-red-600 transition line-clamp-2">
                                            {item.title}
                                        </h2>

                                        {item.content && (
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                                                {item.content.replace(/[#*_`[\]]/g, '').slice(0, 100)}...
                                            </p>
                                        )}

                                        <span className="mt-auto text-red-600 text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition duration-300">
                                            Baca Selengkapnya <ArrowRight size={14} />
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
}
