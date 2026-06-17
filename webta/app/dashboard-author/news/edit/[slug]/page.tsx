'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import BackButton from '@/components/BackButton';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ArrowLeft, ImagePlus, Loader2, Save, Star, X, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const CATEGORIES = [
    'Kontes Internasional',
    'Tips Perawatan',
    'Ensiklopedia',
    'Berita Industri',
    'Info',
];

function toSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export default function EditNewsPage() {
    const router = useRouter();
    const params = useParams();
    const slugParam = params?.slug as string;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLTextAreaElement>(null);
    const inlineImageRef = useRef<HTMLInputElement>(null);

    const [newsId, setNewsId] = useState<string>('');
    const [oldImageUrl, setOldImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingInlineImage, setUploadingInlineImage] = useState(false);

    // Gambar
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageRemoved, setImageRemoved] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [category, setCategory] = useState('');
    const [content, setContent] = useState('');
    const [isMain, setIsMain] = useState(false);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [insertImageUrl, setInsertImageUrl] = useState('');
    const [showImageInsert, setShowImageInsert] = useState(false);
    const [insertImageCaption, setInsertImageCaption] = useState('');

    const { user: authUser } = useRequireAuth();

    // Proteksi role & fetch data berita
    useEffect(() => {
        if (!slugParam || !authUser) return;

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

            // Fetch data berita berdasarkan slug
            const { data: newsData, error } = await supabase
                .from('news')
                .select('*')
                .eq('slug', slugParam)
                .single();

            if (error || !newsData) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            setNewsId(newsData.id);
            setTitle(newsData.title ?? '');
            setSlug(newsData.slug ?? '');
            setCategory(newsData.category ?? '');
            setContent(newsData.content ?? '');
            setIsMain(newsData.is_main ?? false);
            setOldImageUrl(newsData.image_url ?? null);
            setImagePreview(newsData.image_url ?? null);
            setLoading(false);
        }

        init();
    }, [slugParam, authUser, router]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        if (!slugManuallyEdited) {
            setSlug(toSlug(newTitle));
        }
    };

    // Upload gambar inline ke Supabase Storage
    async function handleInlineImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingInlineImage(true);
        const ext = file.name.split('.').pop();
        const fileName = `inline-${Date.now()}.${ext}`;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'news_images');
        formData.append('fileName', fileName);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        
        if (!res.ok) {
            toast.error(`Gagal upload: ${data.error}`);
        } else {
            setInsertImageUrl(data.publicUrl);
            toast.success('Gambar berhasil diupload!');
        }
        setUploadingInlineImage(false);
        if (inlineImageRef.current) inlineImageRef.current.value = '';
    }

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setImageRemoved(false);
    }

    function handleRemoveImage() {
        setImageFile(null);
        setImagePreview(null);
        setImageRemoved(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!title.trim()) { toast.error('Judul tidak boleh kosong!'); return; }
        if (!slug.trim()) { toast.error('Slug tidak boleh kosong!'); return; }
        if (!content.trim()) { toast.error('Isi berita tidak boleh kosong!'); return; }

        setSubmitting(true);

        try {
            let imageUrl: string | null = oldImageUrl;

            // Kasus 1: Gambar diganti dengan yang baru
            if (imageFile) {
                // Hapus gambar lama dari storage jika ada
                if (oldImageUrl) {
                    const oldFileName = oldImageUrl.split('/').pop();
                    if (oldFileName) {
                        await fetch('/api/upload', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ bucket: 'news_images', fileNames: [oldFileName] })
                        });
                    }
                }

                // Upload gambar baru
                const ext = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}-${slug}.${ext}`;

                const formData = new FormData();
                formData.append('file', imageFile);
                formData.append('bucket', 'news_images');
                formData.append('fileName', fileName);
                
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await res.json();

                if (!res.ok) {
                    toast.error(`Gagal upload gambar: ${data.error}`);
                    setSubmitting(false);
                    return;
                }

                imageUrl = data.publicUrl;
            }

            // Kasus 2: Gambar dihapus tanpa diganti
            if (imageRemoved && !imageFile) {
                if (oldImageUrl) {
                    const oldFileName = oldImageUrl.split('/').pop();
                    if (oldFileName) {
                        await fetch('/api/upload', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ bucket: 'news_images', fileNames: [oldFileName] })
                        });
                    }
                }
                imageUrl = null;
            }

            // Update data di tabel news
            const { error: updateError } = await supabase
                .from('news')
                .update({
                    title: title.trim(),
                    slug: slug.trim(),
                    category: category || null,
                    content: content.trim(),
                    image_url: imageUrl,
                    is_main: isMain,
                })
                .eq('id', newsId);

            if (updateError) {
                if (updateError.code === '23505') {
                    toast.error('Slug sudah digunakan oleh berita lain!');
                } else {
                    toast.error(`Gagal menyimpan: ${updateError.message}`);
                }
                setSubmitting(false);
                return;
            }

            toast.success('Berita berhasil diperbarui! ✅');
            setTimeout(() => router.push('/dashboard-author/news'), 1500);

        } catch {
            toast.error('Terjadi kesalahan tak terduga.');
            setSubmitting(false);
        }
    }

    // Loading
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
            Memuat data berita...
        </div>
    );

    // Not Found
    if (notFound) return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="flex-grow flex flex-col items-center justify-center gap-4 text-gray-400">
                <AlertCircle size={56} strokeWidth={1} />
                <p className="text-xl font-bold text-gray-700">Berita tidak ditemukan</p>
                <BackButton />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <Navbar />

            <main className="max-w-3xl mx-auto px-4 py-10">

                {/* Header */}
                <div className="mb-8">
                    <BackButton />
                    <h1 className="text-3xl font-bold text-gray-900">Edit Berita</h1>
                    <p className="text-gray-500 mt-1">Perbarui informasi berita di bawah ini.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* JUDUL */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Judul Berita <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={handleTitleChange}
                            placeholder="Judul berita..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                        />
                    </div>

                    {/* SLUG & KATEGORI */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Slug (URL) <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-sm shrink-0">/news/</span>
                                    <input
                                        type="text"
                                        value={slug}
                                        onChange={(e) => {
                                            setSlug(toSlug(e.target.value));
                                            setSlugManuallyEdited(true);
                                        }}
                                        placeholder="slug-berita"
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1.5">Mengubah slug akan memutus link berita lama.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Kategori</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition bg-white"
                                >
                                    <option value="">-- Pilih Kategori --</option>
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* GAMBAR SAMPUL */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <label className="block text-sm font-bold text-gray-700 mb-3">Gambar Sampul</label>

                        {imagePreview ? (
                            <div className="relative rounded-xl overflow-hidden">
                                <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-red-600 hover:text-white p-2 rounded-full shadow transition"
                                >
                                    <X size={16} />
                                </button>
                                <div className="absolute bottom-3 left-3">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs font-bold bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white px-3 py-1.5 rounded-full shadow transition"
                                    >
                                        Ganti Gambar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-48 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-red-400 hover:text-red-500 transition cursor-pointer"
                            >
                                <ImagePlus size={32} />
                                <span className="text-sm font-medium">Klik untuk upload gambar sampul</span>
                                <span className="text-xs">PNG, JPG, WEBP — Maks 5MB</span>
                            </button>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </div>

                    {/* ISI BERITA */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-bold text-gray-700">
                                Isi Berita <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => {
                                    const ta = contentRef.current;
                                    if (!ta) return;
                                    const pos = ta.selectionStart;
                                    setContent(content.slice(0, pos) + '## Judul Seksi\n' + content.slice(pos));
                                }} className="text-xs font-bold px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition">H2</button>
                                <button type="button" onClick={() => {
                                    const ta = contentRef.current;
                                    if (!ta) return;
                                    const pos = ta.selectionStart;
                                    setContent(content.slice(0, pos) + '### Sub Judul\n' + content.slice(pos));
                                }} className="text-xs font-bold px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition">H3</button>
                                <button type="button" onClick={() => setShowImageInsert(!showImageInsert)}
                                    className={`text-xs font-bold px-2 py-1 rounded transition flex items-center gap-1 ${
                                        showImageInsert ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                    }`}>
                                    🖼️ Insert Gambar
                                </button>
                            </div>
                        </div>

                        {showImageInsert && (
                            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={insertImageCaption}
                                    onChange={(e) => setInsertImageCaption(e.target.value)}
                                    placeholder="Keterangan gambar (opsional)"
                                    className="w-full px-3 py-2 rounded-lg border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={insertImageUrl}
                                        onChange={(e) => setInsertImageUrl(e.target.value)}
                                        placeholder="URL gambar: https://... atau upload di kanan →"
                                        className="flex-1 px-3 py-2 rounded-lg border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => inlineImageRef.current?.click()}
                                        disabled={uploadingInlineImage}
                                        className="px-3 py-2 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-600 hover:text-white transition whitespace-nowrap disabled:opacity-50 flex items-center gap-1"
                                    >
                                        {uploadingInlineImage
                                            ? <><Loader2 size={13} className="animate-spin" /> Mengupload...</>
                                            : <>📁 Upload File</>}
                                    </button>
                                </div>
                                <input
                                    ref={inlineImageRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleInlineImageUpload}
                                    className="hidden"
                                />
                                <button type="button" onClick={() => {
                                    if (!insertImageUrl.trim()) return;
                                    const ta = contentRef.current;
                                    const pos = ta ? ta.selectionStart : content.length;
                                    const tag = `\n![${insertImageCaption}](${insertImageUrl.trim()})\n`;
                                    setContent(content.slice(0, pos) + tag + content.slice(pos));
                                    setInsertImageUrl('');
                                    setInsertImageCaption('');
                                    setShowImageInsert(false);
                                }} className="w-full px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition">
                                    Sisipkan ke Konten
                                </button>
                            </div>
                        )}

                        <textarea
                            ref={contentRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Tulis isi berita di sini..."
                            rows={14}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm leading-7 focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-y"
                        />
                        <div className="flex items-start justify-between mt-1.5 gap-4">
                            <div className="text-xs text-gray-400 leading-relaxed">
                                <span className="font-bold">Format:</span>{' '}
                                <code className="bg-gray-100 px-1 rounded">## Judul</code> untuk heading •{' '}
                                <code className="bg-gray-100 px-1 rounded">![keterangan](url)</code> untuk gambar di tengah
                            </div>
                            <p className="text-xs text-gray-400 shrink-0">{content.length} karakter</p>
                        </div>
                    </div>

                    {/* OPSI BERITA UTAMA */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <label className="flex items-start gap-4 cursor-pointer">
                            <div className="relative mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={isMain}
                                    onChange={(e) => setIsMain(e.target.checked)}
                                    className="sr-only"
                                />
                                <div
                                    className={`w-12 h-6 rounded-full transition-colors duration-300 ${isMain ? 'bg-red-600' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${isMain ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 flex items-center gap-2">
                                    <Star size={15} className={isMain ? 'text-red-500' : 'text-gray-400'} />
                                    Jadikan Berita Utama
                                </p>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Berita utama akan tampil di posisi besar pada halaman depan dan halaman berita.
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* TOMBOL AKSI */}
                    <div className="flex flex-col sm:flex-row gap-3 pb-10">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg"
                        >
                            {submitting ? (
                                <><Loader2 size={20} className="animate-spin" /> Menyimpan...</>
                            ) : (
                                <><Save size={20} /> Simpan Perubahan</>
                            )}
                        </button>
                        <Link
                            href="/dashboard-author/news"
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-600 px-8 py-4 rounded-xl font-bold text-lg hover:border-gray-400 transition"
                        >
                            Batal
                        </Link>
                    </div>

                </form>
            </main>
        </div>
    );
}
