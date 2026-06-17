'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import BackButton from '@/components/BackButton';
import { ArrowLeft, ImagePlus, Loader2, Send, Star, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const CATEGORIES = [
    'Kontes Internasional',
    'Tips Perawatan',
    'Ensiklopedia',
    'Berita Industri',
    'Info',
];

// Auto-generate slug dari judul
function toSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export default function CreateNewsPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLTextAreaElement>(null);
    const inlineImageRef = useRef<HTMLInputElement>(null);

    const [authorId, setAuthorId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploadingInlineImage, setUploadingInlineImage] = useState(false);
    const [userRole, setUserRole] = useState<string>('author');

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

    const { user: authUser, loading: authLoading } = useRequireAuth();

    // Proteksi Role
    useEffect(() => {
        if (!authUser) return;

        supabase.from('profiles').select('role, is_banned').eq('id', authUser.id).single()
            .then(({ data: profile }) => {
                if (!profile || profile.is_banned || (profile.role !== 'author' && profile.role !== 'admin')) {
                    router.replace('/profile-setting');
                    return;
                }
                setAuthorId(authUser.id);
                setUserRole(profile.role);
                setLoading(false);
            });
    }, [authUser, router]);

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

    // Handle pilih gambar
    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    }

    function handleRemoveImage() {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    // Submit
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!title.trim()) { toast.error('Judul tidak boleh kosong!'); return; }
        if (!slug.trim()) { toast.error('Slug tidak boleh kosong!'); return; }
        if (!content.trim()) { toast.error('Isi berita tidak boleh kosong!'); return; }

        setSubmitting(true);

        try {
            let imageUrl: string | null = null;

            // Upload gambar ke Supabase Storage jika ada
            if (imageFile) {
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

            const syncRes = await fetch('/api/sync-news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    payload: {
                        title: title.trim(),
                        slug: slug.trim(),
                        category: category || null,
                        content: content.trim(),
                        image_url: imageUrl,
                        is_main: isMain,
                        author_id: authorId,
                    }
                })
            });
            const syncData = await syncRes.json();
            const insertError = !syncRes.ok ? new Error(syncData.error) : null;

            if (insertError) {
                if (insertError.message.includes('23505')) {
                    toast.error('Slug sudah digunakan! Ubah slug menjadi unik.');
                } else {
                    toast.error(`Gagal menyimpan: ${insertError.message}`);
                }
                setSubmitting(false);
                return;
            }

            toast.success('Berita berhasil diterbitkan! 🎉');
            setTimeout(() => router.push('/dashboard-author/news'), 1500);

        } catch (err) {
            toast.error('Terjadi kesalahan tak terduga.');
            setSubmitting(false);
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
            Memeriksa akses...
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <Navbar />

            <main className="max-w-3xl mx-auto px-4 py-10">

                {/* Header */}
                <div className="mb-8">
                    <BackButton />
                    <h1 className="text-3xl font-bold text-gray-900">Tulis Berita Baru</h1>
                    <p className="text-gray-500 mt-1">Isi semua kolom di bawah lalu klik Terbitkan.</p>
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
                            placeholder="Contoh: Grand Champion Kohaku Menang di All Japan Koi Show 2025"
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
                                        placeholder="contoh-slug-berita"
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1.5">Otomatis dari judul. Bisa diedit manual.</p>
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
                            {/* Toolbar Format */}
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => {
                                    const ta = contentRef.current;
                                    if (!ta) return;
                                    const pos = ta.selectionStart;
                                    const newContent = content.slice(0, pos) + '## Judul Seksi\n' + content.slice(pos);
                                    setContent(newContent);
                                }} className="text-xs font-bold px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition">H2</button>
                                <button type="button" onClick={() => {
                                    const ta = contentRef.current;
                                    if (!ta) return;
                                    const pos = ta.selectionStart;
                                    const newContent = content.slice(0, pos) + '### Sub Judul\n' + content.slice(pos);
                                    setContent(newContent);
                                }} className="text-xs font-bold px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition">H3</button>
                                <button type="button" onClick={() => setShowImageInsert(!showImageInsert)}
                                    className={`text-xs font-bold px-2 py-1 rounded transition flex items-center gap-1 ${
                                        showImageInsert ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                    }`}>
                                    🖼️ Insert Gambar
                                </button>
                            </div>
                        </div>

                        {/* Panel Insert Gambar */}
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
                            placeholder="Tulis isi berita di sini. Tekan Enter untuk paragraf baru..."
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
                                    Berita utama akan tampil di posisi besar sebelah kiri pada halaman depan dan halaman berita.
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
                                <><Loader2 size={20} className="animate-spin" /> Menerbitkan...</>
                            ) : (
                                <><Send size={20} /> Terbitkan Berita</>
                            )}
                        </button>
                        <Link
                            href="/dashboard-author"
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
