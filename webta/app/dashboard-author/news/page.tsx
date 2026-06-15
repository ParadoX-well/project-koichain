'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import BackButton from '@/components/BackButton';
import {
    ArrowLeft, PenLine, Trash2, PlusCircle,
    Calendar, Tag, Star, Newspaper, Loader2, AlertTriangle
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

type NewsItem = {
    id: string;
    title: string;
    slug: string;
    category: string | null;
    image_url: string | null;
    is_main: boolean;
    created_at: string;
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function SkeletonRow() {
    return (
        <div className="animate-pulse flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
            <div className="w-20 h-16 rounded-lg bg-gray-200 flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/3 bg-gray-200 rounded" />
            </div>
            <div className="h-8 w-16 bg-gray-200 rounded-lg" />
        </div>
    );
}

export default function ManageNewsPage() {
    const router = useRouter();
    const [userRole, setUserRole] = useState<string>('');
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const { user: authUser } = useRequireAuth();

    // Proteksi role & fetch berita
    useEffect(() => {
        if (!authUser) return;

        async function init() {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, is_banned')
                .eq('id', authUser.id)
                .single();

            if (!profile || profile.is_banned || (profile.role !== 'author' && profile.role !== 'admin')) {
                router.replace('/profile-setting');
                return;
            }

            setUserRole(profile.role);

            let query = supabase
                .from('news')
                .select('id, title, slug, category, image_url, is_main, created_at')
                .order('created_at', { ascending: false });

            if (profile.role === 'author') {
                query = query.eq('author_id', authUser.id);
            }

            const { data, error } = await query;
            if (!error && data) setNews(data as NewsItem[]);
            setLoading(false);
        }

        init();
    }, [authUser, router]);

    async function handleDelete(item: NewsItem) {
        setDeletingId(item.id);
        setConfirmDeleteId(null);

        // Hapus gambar dari Storage jika ada
        if (item.image_url) {
            const fileName = item.image_url.split('/').pop();
            if (fileName) {
                await supabase.storage.from('news_images').remove([fileName]);
            }
        }

        const { error } = await supabase.from('news').delete().eq('id', item.id);

        if (error) {
            toast.error('Gagal menghapus berita.');
        } else {
            toast.success('Berita berhasil dihapus.');
            setNews((prev) => prev.filter((n) => n.id !== item.id));
        }

        setDeletingId(null);
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-10">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <BackButton />
                        <h1 className="text-3xl font-bold text-gray-900">Kelola Berita</h1>
                        <p className="text-gray-500 mt-1">
                            {userRole === 'admin' ? 'Semua berita di platform' : 'Berita yang kamu tulis'}
                        </p>
                    </div>
                    <Link
                        href="/dashboard-author/news/create"
                        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition shadow-md whitespace-nowrap"
                    >
                        <PlusCircle size={18} /> Tulis Baru
                    </Link>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col gap-3">
                        {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
                    </div>
                )}

                {/* Empty State */}
                {!loading && news.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 text-center text-gray-400 gap-4">
                        <Newspaper size={56} strokeWidth={1} />
                        <p className="text-lg font-semibold">Belum ada berita yang ditulis.</p>
                        <Link
                            href="/dashboard-author/news/create"
                            className="text-sm font-bold text-red-600 hover:underline flex items-center gap-1"
                        >
                            <PlusCircle size={14} /> Tulis berita pertama kamu
                        </Link>
                    </div>
                )}

                {/* List Berita */}
                {!loading && news.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {news.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden"
                            >
                                <div className="flex items-center gap-4 p-4">
                                    {/* Thumbnail */}
                                    <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Newspaper size={20} className="text-gray-300" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            {item.is_main && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase">
                                                    <Star size={9} /> Utama
                                                </span>
                                            )}
                                            {item.category && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                                                    <Tag size={9} /> {item.category}
                                                </span>
                                            )}
                                        </div>
                                        <p className="font-bold text-gray-900 text-sm leading-snug truncate">{item.title}</p>
                                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                            <Calendar size={11} /> {formatDate(item.created_at)}
                                        </p>
                                    </div>

                                    {/* Aksi */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Link
                                            href={`/dashboard-author/news/edit/${item.slug}`}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition"
                                        >
                                            <PenLine size={13} /> Edit
                                        </Link>
                                        <button
                                            onClick={() => setConfirmDeleteId(item.id)}
                                            disabled={deletingId === item.id}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-600 hover:text-white transition disabled:opacity-50"
                                        >
                                            {deletingId === item.id
                                                ? <Loader2 size={13} className="animate-spin" />
                                                : <Trash2 size={13} />
                                            }
                                            Hapus
                                        </button>
                                    </div>
                                </div>

                                {/* Konfirmasi Hapus (inline) */}
                                {confirmDeleteId === item.id && (
                                    <div className="bg-red-50 border-t border-red-100 px-4 py-3 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 text-sm text-red-700">
                                            <AlertTriangle size={16} />
                                            <span>Yakin ingin menghapus berita ini? Tindakan tidak bisa dibatalkan.</span>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="text-xs font-bold text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item)}
                                                className="text-xs font-bold text-white bg-red-600 px-3 py-1.5 rounded-lg hover:bg-red-700 transition"
                                            >
                                                Ya, Hapus
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

            </main>
        </div>
    );
}
