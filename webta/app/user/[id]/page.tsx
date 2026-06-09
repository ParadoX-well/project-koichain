'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { User, MapPin, Search, Ruler, ShieldCheck, Mail, Fish, Calendar, ArrowLeft, Tag, Phone, Instagram } from 'lucide-react';
import BackButton from '@/components/BackButton';
import ImageLightbox from '@/components/ImageLightbox';

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const resolvedUserId = unwrappedParams.id;

    const [profile, setProfile] = useState<any>(null);
    const [wallets, setWallets] = useState<string[]>([]);
    const [kois, setKois] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true);
            try {
                const userId = resolvedUserId;

                // 1. Fetch Profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (profileError || !profileData) {
                    setLoading(false);
                    return;
                }
                setProfile(profileData);

                // 2. Fetch User Wallets
                const { data: walletsData } = await supabase
                    .from('user_wallets')
                    .select('wallet_address')
                    .eq('user_id', userId);

                const walletList = walletsData?.map(w => w.wallet_address) || [];
                setWallets(walletList);

                // 3. Fetch Koi Collection based on Wallets
                if (walletList.length > 0) {
                    const orQuery = walletList.map(addr => `wallet_address.ilike.${addr}`).join(',');
                    const { data: koiData } = await supabase
                        .from('koi_certificates')
                        .select('koi_id, variety, size, photo_url, minted_at')
                        .or(orQuery)
                        .order('updated_at', { ascending: false })
                        .order('minted_at', { ascending: false });

                    if (koiData) {
                        setKois(koiData);
                    }
                }
            } catch (err) {
                console.error("Error fetching public profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [resolvedUserId]);

    const filteredKois = kois.filter(k => 
        k.koi_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.variety?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-500 font-medium">Memuat Profil...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <User className="w-12 h-12 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Profil Tidak Ditemukan</h1>
                    <p className="text-gray-500 max-w-md mx-auto mb-8">Maaf, akun yang Anda cari tidak ada atau mungkin sudah dihapus dari sistem.</p>
                    <Link href="/koi" className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition flex items-center gap-2">
                        <ArrowLeft size={18} /> Kembali ke Jelajah
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            <Navbar />

            {/* HEADER / BANNER PROFIL */}
            <div className="bg-white border-b border-gray-200">
                {/* Banner Image */}
                <div className="h-48 md:h-64 bg-slate-900 w-full relative overflow-hidden">
                    {profile.banner_url ? (
                        <img src={profile.banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover object-center" />
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-900 to-black"></div>
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1510006766352-7b1945f32ea6?q=80&w=2000&auto=format&fit=crop')] opacity-20 bg-cover bg-center"></div>
                        </>
                    )}
                    
                    <div className="absolute top-6 left-6 z-10">
                        <BackButton />
                    </div>
                </div>

                {/* Profile Info Container */}
                <div className="max-w-6xl mx-auto px-4 md:px-6 relative pb-10">
                    {/* Header Row: Avatar & Stats */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-16 md:-mt-20 relative z-10">
                        {/* Avatar (Overlaps Banner) */}
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden flex-shrink-0 relative">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.full_name || 'User'} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                    <User size={64} />
                                </div>
                            )}
                        </div>

                        {/* Statistik Singkat */}
                        <div className="flex gap-3 md:gap-4 md:mb-2 w-full md:w-auto mt-2 md:mt-0">
                            <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center flex-1 md:flex-none md:w-[160px] h-24 md:h-28 transition-all hover:-translate-y-1">
                                <p className="text-2xl md:text-3xl font-black text-gray-900 leading-none">{kois.length}</p>
                                <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest mt-2 text-center px-2">Koleksi Koi</p>
                            </div>
                            <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center flex-1 md:flex-none md:w-[160px] h-24 md:h-28 transition-all hover:-translate-y-1">
                                <p className="text-2xl md:text-3xl font-black text-gray-900 leading-none">{wallets.length}</p>
                                <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest mt-2 text-center px-2">Dompet Terhubung</p>
                            </div>
                        </div>
                    </div>

                    {/* Nama & Info (Completely below banner) */}
                    <div className="mt-5 md:mt-6 max-w-3xl">
                        {(() => {
                            const isMitra = profile.role && (profile.role.toLowerCase().includes('breeder') || profile.role.toLowerCase().includes('seller') || profile.role.toLowerCase().includes('admin'));
                            return (
                                <>
                                    <div className="flex flex-wrap items-center gap-3 mb-1">
                                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 capitalize tracking-tight">
                                            {isMitra && profile.store_name 
                                                ? profile.store_name 
                                                : profile.full_name || 'Anonymous User'}
                                        </h1>
                                        {isMitra && (
                                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-blue-100">
                                                <ShieldCheck size={14} /> Terverifikasi
                                            </span>
                                        )}
                                    </div>
                                    
                                    {isMitra && profile.store_name && (
                                        <p className="text-gray-500 mb-3 text-sm font-semibold">Owner: {profile.full_name}</p>
                                    )}

                                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 text-sm text-gray-500 font-medium leading-relaxed mb-4">
                                        <div className="inline-flex items-center gap-1.5 uppercase tracking-wider text-orange-600 font-bold bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 self-start">
                                            <User size={14} />
                                            {profile.role || 'Kolektor'}
                                        </div>
                                        {((isMitra && profile.store_address) || profile.address) && (
                                            <>
                                                <span className="hidden md:inline text-gray-300">•</span>
                                                <div className="flex items-start md:items-center gap-1.5">
                                                    <MapPin size={16} className="flex-shrink-0 mt-0.5 md:mt-0 text-gray-400" />
                                                    <span>{isMitra && profile.store_address ? profile.store_address : profile.address}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* TOMBOL KONTAK (Hanya untuk Mitra) */}
                                    {isMitra && (
                                        <div className="mt-6 mb-6">
                                            {profile.store_description && (
                                                <p className="text-gray-600 italic mb-5 border-l-4 border-orange-300 pl-4 py-1">{profile.store_description}</p>
                                            )}
                                            
                                            <div className="flex flex-wrap gap-3">
                                                {profile.contact_phone && (
                                                    <a href={`https://wa.me/${profile.contact_phone.replace(/^0/, '62')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#20bd5a] transition shadow-md hover:-translate-y-0.5">
                                                        <Phone size={18} /> Chat WhatsApp
                                                    </a>
                                                )}
                                                {profile.instagram && (
                                                    <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition shadow-md hover:-translate-y-0.5">
                                                        <Instagram size={18} /> Instagram
                                                    </a>
                                                )}
                                                {profile.contact_email && (
                                                    <a href={`mailto:${profile.contact_email}`} className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm hover:-translate-y-0.5">
                                                        <Mail size={18} /> Email Bisnis
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* KOLEKSI KOI */}
            <div className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                            <Fish className="text-orange-500" />
                            Katalog Koleksi
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Daftar lengkap aset ikan Koi yang dimiliki dan didaftarkan ke Blockchain.</p>
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Cari nama atau jenis koi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-gray-200 pl-11 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition shadow-sm font-medium"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                </div>

                {filteredKois.length === 0 ? (
                    <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <Fish className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Koleksi</h3>
                        <p className="text-gray-500 max-w-md">Akun ini belum mendaftarkan atau memiliki aset ikan Koi di dalam sistem.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredKois.map((koi) => (
                            <Link href={`/koi/${koi.koi_id}`} key={koi.koi_id} className="group flex flex-col bg-white rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-orange-200 transition-all duration-300 overflow-hidden cursor-pointer relative">
                                {/* Badge Web3 */}
                                <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider flex items-center gap-1.5 border border-white/20">
                                    <ShieldCheck size={12} className="text-green-400" /> WEB3 VERIFIED
                                </div>

                                {/* Gambar */}
                                <div className="w-full aspect-square bg-gray-100 relative overflow-hidden">
                                    {koi.photo_url && koi.photo_url.length > 5 ? (
                                        <img
                                            src={koi.photo_url}
                                            alt={koi.variety}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                            <Fish size={32} className="opacity-50" />
                                            <span className="text-xs font-medium">Tanpa Foto</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info Bawah */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="text-lg font-black text-gray-900 mb-4 group-hover:text-orange-600 transition-colors">
                                        {koi.koi_id}
                                    </h3>
                                    
                                    <div className="mt-auto flex items-center justify-between text-xs font-bold text-gray-500 pt-4 border-t border-gray-50">
                                        <span className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md">
                                            <Tag size={12} />
                                            {koi.variety || 'Tidak diketahui'}
                                        </span>
                                        <span className="flex items-center gap-1.5 bg-gray-50 text-gray-600 px-2.5 py-1 rounded-md">
                                            <Ruler size={12} />
                                            {koi.size ? `${koi.size} cm` : '-'}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
