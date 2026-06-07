'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Search, ShieldCheck, Ruler, Tag, Filter, X } from 'lucide-react';
import BackButton from '@/components/BackButton';

type KoiItem = {
    id: string;
    name: string;
    breed: string;
    size: number;
    front_image_url: string;
};

// Data Dummy Estetik (Digunakan jika database kosong agar halaman tidak kosong)
const DUMMY_KOIS: KoiItem[] = [
    { id: "dummy-1", name: "Shining Kohaku", breed: "Kohaku", size: 45, front_image_url: "https://images.unsplash.com/photo-1510006766352-7b1945f32ea6?q=80&w=600&auto=format&fit=crop" },
    { id: "dummy-2", name: "Midnight Showa", breed: "Showa", size: 52, front_image_url: "https://images.unsplash.com/photo-1544464525-4122d2507d3f?q=80&w=600&auto=format&fit=crop" },
    { id: "dummy-3", name: "Golden Ogon", breed: "Ogon", size: 38, front_image_url: "https://images.unsplash.com/photo-1616035251642-1e5509747a06?q=80&w=600&auto=format&fit=crop" },
    { id: "dummy-4", name: "Platinum Sanke", breed: "Sanke", size: 49, front_image_url: "https://images.unsplash.com/photo-1621303882794-c9b0e1e69b56?q=80&w=600&auto=format&fit=crop" },
    { id: "dummy-5", name: "Crimson Asagi", breed: "Asagi", size: 55, front_image_url: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=600&auto=format&fit=crop" },
    { id: "dummy-6", name: "Phantom Shiro", breed: "Shiro Utsuri", size: 42, front_image_url: "https://images.unsplash.com/photo-1588622152848-18e0018f3d1b?q=80&w=600&auto=format&fit=crop" },
];

// Daftar standar yang ada di dropdown minting
const STANDARD_BREEDS = [
    "Kohaku", "Taisho Sanke", "Showa Sanshoku", "Shiro Utsuri", "Hi Utsuri", 
    "Utsurimono", "Asagi", "Shusui", "Koromo", "Goshiki", "Kawarimono", 
    "Hikarimono", "Hikari Moyo", "Hikari Utsuri", "Kinginrin", "Tancho", "Doitsu"
];

export default function KoiCollectionPage() {
    const [kois, setKois] = useState<KoiItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBreed, setFilterBreed] = useState('');

    useEffect(() => {
        async function fetchKois() {
            setLoading(true);
            try {
                let query = supabase
                    .from('koi_certificates')
                    .select('koi_id, variety, size, photo_url')
                    .not('photo_url', 'is', null)
                    .order('updated_at', { ascending: false })
                    .order('minted_at', { ascending: false });

                if (searchQuery) {
                    query = query.ilike('koi_id', `%${searchQuery}%`);
                }
                
                if (filterBreed) {
                    if (filterBreed === 'Lainnya') {
                        // Ambil semua breed yang BUKAN bagian dari list standar (karena typo atau custom)
                        query = query.not('variety', 'in', `(${STANDARD_BREEDS.join(',')})`);
                    } else {
                        query = query.eq('variety', filterBreed);
                    }
                }

                const { data, error } = await query;

                if (!error && data && data.length > 0) {
                    const mappedData: KoiItem[] = data.map((cert: any) => ({
                        id: cert.koi_id,
                        name: cert.koi_id,
                        breed: cert.variety,
                        size: cert.size || 0,
                        front_image_url: cert.photo_url
                    }));
                    setKois(mappedData);
                } else if (!searchQuery && !filterBreed) {
                    // Hanya pasang dummy jika memang databasenya kosong total
                    setKois(DUMMY_KOIS);
                } else {
                    setKois([]); // Kosong karena filter
                }
            } catch (err) {
                console.error(err);
                if (!searchQuery && !filterBreed) setKois(DUMMY_KOIS);
            } finally {
                setLoading(false);
            }
        }

        // Debounce pencarian
        const timeoutId = setTimeout(() => {
            fetchKois();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, filterBreed]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            <Navbar />

            <main className="flex-grow pt-10 pb-24">
                
                {/* --- HEADER --- */}
                <div className="bg-white border-b border-gray-200 py-16 mb-12">
                    <div className="max-w-7xl mx-auto px-6 relative">
                        <div className="absolute top-0 left-6">
                            <BackButton />
                        </div>
                        
                        <div className="text-center pt-8">
                            <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-orange-200">
                            <ShieldCheck size={16} /> Web3 Verified Registry
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight mb-6">
                            Koleksi Eksklusif <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600">KoiChain</span>
                        </h1>
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                            Eksplorasi ribuan aset ikan koi berkelas yang telah memiliki sertifikat keaslian dan sejarah silsilah abadi di dalam jaringan Blockchain.
                        </p>
                    </div>
                </div>
                </div>

                {/* --- FILTER & SEARCH --- */}
                <div className="max-w-7xl mx-auto px-6 mb-10">
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between overflow-hidden">
                        
                        {/* Search Bar */}
                        <div className="relative w-full md:w-96 flex-shrink-0">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="text-gray-400 w-5 h-5" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Cari nama koi..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-medium outline-none"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Filter Kategori */}
                        <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 md:pb-0 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <div className="flex items-center gap-2 text-gray-400 mr-2 sticky left-0 bg-white z-10 py-1">
                                <Filter size={18} />
                                <span className="text-sm font-bold uppercase tracking-wider">Filter:</span>
                            </div>
                            
                            <button 
                                onClick={() => setFilterBreed('')}
                                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterBreed === '' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Semua Jenis
                            </button>
                            
                            {STANDARD_BREEDS.map((b) => (
                                <button 
                                    key={b}
                                    onClick={() => setFilterBreed(b)}
                                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterBreed === b ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {b}
                                </button>
                            ))}
                            
                            <button 
                                onClick={() => setFilterBreed('Lainnya')}
                                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterBreed === 'Lainnya' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Lainnya
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- GRID GALLERY --- */}
                <div className="max-w-7xl mx-auto px-6">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="animate-pulse bg-gray-200 h-[420px] rounded-3xl" />
                            ))}
                        </div>
                    ) : kois.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
                                        <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors truncate">{koi.name}</h3>
                                        
                                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100">
                                            <div className="flex items-center gap-1 text-sm font-medium text-gray-500">
                                                <Tag size={14} className="text-orange-500" />
                                                <span className="truncate max-w-[100px]">{koi.breed}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm font-medium text-gray-500">
                                                <Ruler size={14} className="text-pink-500" />
                                                {koi.size} cm
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Koleksi Tidak Ditemukan</h3>
                            <p className="text-gray-500">Tidak ada ikan koi yang sesuai dengan kata kunci "{searchQuery}" atau jenis tersebut.</p>
                            <button 
                                onClick={() => { setSearchQuery(''); setFilterBreed(''); }}
                                className="mt-6 inline-block bg-gray-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition"
                            >
                                Reset Pencarian
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
