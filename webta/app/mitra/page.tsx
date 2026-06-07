'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Store, MapPin, BadgeCheck, Instagram, ArrowRight, ShieldCheck, Trophy, Medal, Award } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function MitraCatalog() {
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    useEffect(() => {
        const fetchPartners = async () => {
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    user_wallets ( wallet_address )
                `)
                .eq('is_banned', false)
                .in('role', ['breeder', 'seller', 'seller,breeder'])
                .order('full_name', { ascending: true });
            
            if (profiles) {
                // Ambil semua sertifikat untuk menghitung mint_count dan koi_count
                const { data: allKois } = await supabase
                    .from('koi_certificates')
                    .select('wallet_address, breeder_id');
                
                const countByWallet: Record<string, number> = {};
                const countByBreeder: Record<string, number> = {};

                if (allKois) {
                    allKois.forEach(k => {
                        if (k.wallet_address) {
                            const addr = k.wallet_address.toLowerCase();
                            countByWallet[addr] = (countByWallet[addr] || 0) + 1;
                        }
                        if (k.breeder_id) {
                            countByBreeder[k.breeder_id] = (countByBreeder[k.breeder_id] || 0) + 1;
                        }
                    });
                }

                const partnersWithStats = profiles.map(p => {
                    let totalKoi = 0;
                    if (p.user_wallets && Array.isArray(p.user_wallets)) {
                        p.user_wallets.forEach((w: any) => {
                            if (w.wallet_address) {
                                totalKoi += countByWallet[w.wallet_address.toLowerCase()] || 0;
                            }
                        });
                    }
                    return { 
                        ...p, 
                        koi_count: totalKoi,
                        mint_count: countByBreeder[p.id] || 0,
                        total_transfers: p.total_transfers || 0
                    };
                });

                setPartners(partnersWithStats);
            }
            setLoading(false);
        };
        fetchPartners();
    }, []);

    const filtered = partners.filter(p => {
        const matchSearch = (p.full_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (p.store_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (p.store_address?.toLowerCase() || '').includes(search.toLowerCase());
        const matchRole = filterRole === 'all' || p.role.includes(filterRole);
        return matchSearch && matchRole;
    });

    // Top 5 Breeder (berdasarkan jumlah minting terbanyak)
    const topBreeders = [...partners]
        .filter(p => p.role?.includes('breeder') && p.mint_count > 0)
        .sort((a, b) => (b.mint_count || 0) - (a.mint_count || 0))
        .slice(0, 5);

    // Top 5 Seller (berdasarkan jumlah transfer terbanyak)
    const topSellers = [...partners]
        .filter(p => p.total_transfers > 0)
        .sort((a, b) => (b.total_transfers || 0) - (a.total_transfers || 0))
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Navbar />
            {/* HERO SECTION */}
            <div className="bg-gradient-to-br from-orange-600 to-red-700 text-white py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-5 mix-blend-overlay"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="max-w-6xl mx-auto px-4 relative z-10 text-center">
                    <span className="bg-white/20 text-orange-50 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase mb-6 inline-block backdrop-blur-sm border border-white/30">Official Partners</span>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight drop-shadow-lg">Temukan Mitra Koi Terpercaya</h1>
                    <p className="text-lg md:text-xl text-orange-100 max-w-2xl mx-auto font-medium">Jelajahi profil Breeder dan Seller bersertifikat di ekosistem KoiChain untuk memastikan keaslian koi Anda.</p>
                </div>
            </div>

            {/* SEARCH & FILTER SECTION */}
            <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-20 w-full mb-12">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-4 md:p-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari nama mitra..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-none focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 font-medium transition"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                        <button onClick={() => setFilterRole('all')} className={`shrink-0 px-6 py-4 rounded-2xl font-bold transition ${filterRole === 'all' ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>Semua Mitra</button>
                        <button onClick={() => setFilterRole('breeder')} className={`shrink-0 px-6 py-4 rounded-2xl font-bold transition flex items-center gap-2 ${filterRole === 'breeder' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>Breeder 🥇</button>
                        <button onClick={() => setFilterRole('seller')} className={`shrink-0 px-6 py-4 rounded-2xl font-bold transition flex items-center gap-2 ${filterRole === 'seller' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>Seller 🥈</button>
                    </div>
                </div>
            </div>

            {/* HALL OF FAME LEADERBOARD */}
            {!loading && (topBreeders.length > 0 || topSellers.length > 0) && (
                <div className="max-w-6xl mx-auto px-4 w-full mb-16">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black text-gray-900 flex items-center justify-center gap-3">
                            <Trophy className="text-yellow-500 w-8 h-8" /> Hall of Fame <Trophy className="text-yellow-500 w-8 h-8" />
                        </h2>
                        <p className="text-gray-500 mt-2 font-medium">Mitra terbaik dengan kontribusi terbesar di ekosistem KoiChain</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* TOP BREEDERS */}
                        {topBreeders.length > 0 && (
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-6 md:p-8 border border-blue-100 shadow-lg shadow-blue-900/5">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                                        <Award size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-blue-900">Top Breeder</h3>
                                        <p className="text-blue-700 text-sm font-medium">Sertifikat Tercetak Terbanyak</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    {topBreeders.map((b, index) => (
                                        <Link href={`/user/${b.id}`} key={b.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all border border-blue-100 group">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${index === 0 ? 'bg-yellow-100 text-yellow-600' : index === 1 ? 'bg-gray-200 text-gray-600' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-400'}`}>
                                                {index + 1}
                                            </div>
                                            <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                                                {b.avatar_url ? <img src={b.avatar_url} className="w-full h-full object-cover" alt="Avatar" /> : <Store className="w-6 h-6 text-gray-400 m-3" />}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <h4 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{b.store_name || b.full_name}</h4>
                                                <p className="text-xs text-gray-500 truncate">{b.store_address || 'Indonesia'}</p>
                                            </div>
                                            <div className="text-right shrink-0 bg-blue-50 px-3 py-1.5 rounded-lg">
                                                <div className="text-lg font-black text-blue-700">{b.mint_count}</div>
                                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Minting</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TOP SELLERS */}
                        {topSellers.length > 0 && (
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 md:p-8 border border-purple-100 shadow-lg shadow-purple-900/5">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/30">
                                        <Medal size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-purple-900">Top Seller</h3>
                                        <p className="text-purple-700 text-sm font-medium">Transaksi Transfer Terbanyak</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    {topSellers.map((s, index) => (
                                        <Link href={`/user/${s.id}`} key={s.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all border border-purple-100 group">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${index === 0 ? 'bg-yellow-100 text-yellow-600' : index === 1 ? 'bg-gray-200 text-gray-600' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-purple-50 text-purple-400'}`}>
                                                {index + 1}
                                            </div>
                                            <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                                                {s.avatar_url ? <img src={s.avatar_url} className="w-full h-full object-cover" alt="Avatar" /> : <Store className="w-6 h-6 text-gray-400 m-3" />}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <h4 className="font-bold text-gray-900 truncate group-hover:text-purple-600 transition-colors">{s.store_name || s.full_name}</h4>
                                                <p className="text-xs text-gray-500 truncate">{s.store_address || 'Indonesia'}</p>
                                            </div>
                                            <div className="text-right shrink-0 bg-purple-50 px-3 py-1.5 rounded-lg">
                                                <div className="text-lg font-black text-purple-700">{s.total_transfers}</div>
                                                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Transfer</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* GRID CONTENT */}
            <main className="flex-grow max-w-6xl mx-auto px-4 w-full mb-20">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-3xl"></div>)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                        <Store className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-600">Tidak ada mitra ditemukan</h3>
                        <p className="text-gray-400 mt-2">Coba gunakan kata kunci pencarian yang lain.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(p => (
                            <Link href={`/user/${p.id}`} key={p.id} className="group bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col">
                                {/* Banner Area */}
                                <div className={`h-24 w-full relative ${p.role.includes('breeder') ? 'bg-gradient-to-r from-blue-600 to-cyan-500' : 'bg-gradient-to-r from-purple-600 to-pink-500'}`}>
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>

                                {/* Content Area */}
                                <div className="px-6 pb-6 pt-0 relative flex-grow flex flex-col">
                                    {/* Avatar */}
                                    <div className="w-20 h-20 bg-white rounded-2xl p-1 shadow-lg absolute -top-10 left-6 z-10 border border-gray-100">
                                        <div className="w-full h-full bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                                            {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" alt="Avatar" /> : <Store size={30} className="text-gray-400" />}
                                        </div>
                                    </div>

                                    {/* Role Badge */}
                                    <div className="flex justify-end mt-3 mb-4">
                                        {p.role.includes('breeder') ? (
                                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-black uppercase flex items-center gap-1"><ShieldCheck size={12} /> BREEDER</span>
                                        ) : (
                                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-black uppercase flex items-center gap-1"><BadgeCheck size={12} /> SELLER</span>
                                        )}
                                    </div>

                                    {/* Text Content */}
                                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition truncate mt-2">{p.store_name || p.full_name}</h2>
                                    <p className="text-sm font-medium text-gray-500 mb-4 truncate">{p.full_name}</p>

                                    <div className="space-y-2 mb-6 text-sm text-gray-600">
                                        <div className="flex items-center gap-2"><MapPin size={16} className="text-gray-400 shrink-0" /> <span className="truncate">{p.store_address || 'Alamat tidak tersedia'}</span></div>
                                        {p.instagram && <div className="flex items-center gap-2"><Instagram size={16} className="text-gray-400 shrink-0" /> <span className="truncate">{p.instagram}</span></div>}
                                        <div className="flex items-center gap-2 text-orange-600 font-bold mt-2">
                                            <Store size={16} className="shrink-0" /> <span>{p.koi_count} Koleksi Koi Tersertifikasi</span>
                                        </div>
                                    </div>

                                    {/* Push bottom */}
                                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Verifikasi Resmi</span>
                                        <div className="w-8 h-8 rounded-full bg-orange-50 group-hover:bg-orange-600 flex items-center justify-center transition-colors">
                                            <ArrowRight size={16} className="text-orange-600 group-hover:text-white transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            {/* CALL TO ACTION */}
            <div className="bg-gray-900 text-white py-16 mt-auto">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-black mb-4">Punya Usaha Budidaya atau Toko Koi?</h2>
                    <p className="text-gray-400 mb-8 max-w-2xl mx-auto">Tingkatkan kepercayaan pembeli Anda dengan mendaftarkan koleksi ikan Anda ke Blockchain KoiChain. Dapatkan lencana verifikasi dan tampil di direktori ini.</p>
                    <Link href="/login" className="inline-block bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-full font-black text-lg transition shadow-lg shadow-orange-600/30">
                        Daftar Sebagai Mitra
                    </Link>
                </div>
            </div>

            <Footer />
        </div>
    );
}
