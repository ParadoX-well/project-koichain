'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowRight, ShieldCheck, Ruler, Tag, Calendar } from 'lucide-react';

type KoiItem = {
    id: string;
    name: string;
    breed: string;
    size: number;
    front_image_url: string;
    updated_at?: string;
};

// Data Dummy Estetik (Digunakan jika database kosong)
const DUMMY_KOIS: KoiItem[] = [
    {
        id: "dummy-1",
        name: "Shining Kohaku",
        breed: "Kohaku",
        size: 45,
        front_image_url: "https://images.unsplash.com/photo-1510006766352-7b1945f32ea6?q=80&w=600&auto=format&fit=crop",
        updated_at: new Date().toISOString()
    },
    {
        id: "dummy-2",
        name: "Midnight Showa",
        breed: "Showa",
        size: 52,
        front_image_url: "https://images.unsplash.com/photo-1544464525-4122d2507d3f?q=80&w=600&auto=format&fit=crop",
        updated_at: new Date().toISOString()
    },
    {
        id: "dummy-3",
        name: "Golden Ogon",
        breed: "Ogon",
        size: 38,
        front_image_url: "https://images.unsplash.com/photo-1616035251642-1e5509747a06?q=80&w=600&auto=format&fit=crop",
        updated_at: new Date().toISOString()
    },
    {
        id: "dummy-4",
        name: "Platinum Sanke",
        breed: "Sanke",
        size: 49,
        front_image_url: "https://images.unsplash.com/photo-1621303882794-c9b0e1e69b56?q=80&w=600&auto=format&fit=crop",
        updated_at: new Date().toISOString()
    }
];

export default function LiveShowcase() {
    const [kois, setKois] = useState<KoiItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLatestKois() {
            try {
                // Tarik 4 sertifikat koi terbaru dari database Web3
                const { data, error } = await supabase
                    .from('koi_certificates')
                    .select('koi_id, variety, size, photo_url, updated_at')
                    .not('photo_url', 'is', null)
                    .order('updated_at', { ascending: false })
                    .order('minted_at', { ascending: false })
                    .limit(4);

                if (!error && data && data.length > 0) {
                    // Map data ke struktur KoiItem
                    const mappedData: KoiItem[] = data.map((cert: any) => ({
                        id: cert.koi_id,
                        name: cert.koi_id,
                        breed: cert.variety,
                        size: cert.size || 0,
                        front_image_url: cert.photo_url,
                        updated_at: cert.updated_at
                    }));
                    setKois(mappedData);
                } else {
                    // Fallback jika kosong agar landing page tetap hidup
                    setKois(DUMMY_KOIS);
                }
            } catch (err) {
                setKois(DUMMY_KOIS);
            } finally {
                setLoading(false);
            }
        }
        fetchLatestKois();
    }, []);

    return (
        <section className="py-24 bg-gray-50 relative">
            <div className="container mx-auto px-6">
                
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="text-green-600 font-bold text-sm tracking-widest uppercase">Live Showcase</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                            Koleksi <span className="text-orange-600">Web3</span> Terbaru
                        </h2>
                        <p className="text-gray-500 mt-4 text-lg">
                            Melihat aset Koi berharga yang baru saja diamankan dan disertifikasi ke dalam jaringan Blockchain KoiChain secara real-time.
                        </p>
                    </div>
                    <Link href="/koi" className="hidden md:inline-flex items-center gap-2 font-bold text-orange-600 hover:text-pink-600 transition group">
                        Jelajahi Semua Koleksi 
                        <span className="bg-orange-100 group-hover:bg-pink-100 p-2 rounded-full transition-colors">
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </Link>
                </div>

                {/* Grid Koleksi */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="animate-pulse bg-gray-200 h-96 rounded-3xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {kois.map((koi, idx) => (
                            <Link 
                                href={koi.id.startsWith('dummy') ? '#' : `/koi/${koi.id}`} 
                                key={idx}
                                className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl border border-gray-100 transition-all duration-500 hover:-translate-y-2 flex flex-col h-[420px]"
                            >
                                {/* Tag Blockchain */}
                                <div className="absolute top-4 right-4 z-20 bg-black/40 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg">
                                    <ShieldCheck size={12} className="text-green-400" /> Web3 Verified
                                </div>

                                <div className="h-2/3 relative overflow-hidden bg-gray-100 w-full">
                                    <img 
                                        src={koi.front_image_url} 
                                        alt={koi.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                                
                                <div className="p-6 flex flex-col flex-grow bg-white relative z-10">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">{koi.name}</h3>
                                    
                                    <div className="mt-auto pt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100">
                                        <div className="flex items-center gap-1 text-sm font-medium text-gray-500">
                                            <Tag size={14} className="text-orange-500" />
                                            {koi.breed}
                                        </div>
                                        <div className="flex items-center gap-1 text-sm font-medium text-gray-500">
                                            <Ruler size={14} className="text-pink-500" />
                                            {koi.size} cm
                                        </div>
                                        <div className="flex items-center gap-1 text-sm font-medium text-gray-500 ml-auto">
                                            <Calendar size={14} className="text-blue-500" />
                                            {koi.updated_at ? new Date(koi.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Baru'}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
                
                <div className="mt-10 text-center md:hidden">
                    <Link href="/koi" className="inline-flex items-center gap-2 font-bold text-orange-600 border-2 border-orange-600 px-6 py-3 rounded-full hover:bg-orange-600 hover:text-white transition w-full justify-center">
                        Jelajahi Semua Koleksi <ArrowRight size={20} />
                    </Link>
                </div>

            </div>
        </section>
    );
}
