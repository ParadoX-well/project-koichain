'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Store, MapPin, BadgeCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function PartnerShowcase() {
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPartners() {

            const { data: profiles } = await supabase
                .from('profiles')
                .select(`
                    id, full_name, store_name, store_address, role, avatar_url, total_transfers,
                    user_wallets ( wallet_address )
                `)
                .eq('is_banned', false)
                .in('role', ['breeder', 'seller', 'seller,breeder']);

            if (profiles) {
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

                const partnersWithCount = profiles.map(p => {
                    let totalKoi = 0;
                    if (p.user_wallets && Array.isArray(p.user_wallets)) {
                        p.user_wallets.forEach((w: any) => {
                            if (w.wallet_address) {
                                totalKoi += countByWallet[w.wallet_address.toLowerCase()] || 0;
                            }
                        });
                    }
                    // Hitung total poin gabungan (minting + transfer) sebagai penentu Top Rank
                    const mintCount = countByBreeder[p.id] || 0;
                    const transferCount = p.total_transfers || 0;
                    const totalScore = mintCount + transferCount;

                    return { ...p, koi_count: totalKoi, mint_count: mintCount, total_score: totalScore };
                });

                // Urutkan berdasarkan total score tertinggi dan ambil 4 teratas
                const topPartners = partnersWithCount
                    .sort((a, b) => b.total_score - a.total_score)
                    .slice(0, 4);

                setPartners(topPartners);
            }
            setLoading(false);
        };

        fetchPartners();
    }, []);

    if (loading || partners.length === 0) return null;

    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0 transform translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16 animate-fade-up">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 mb-6 shadow-lg shadow-orange-600/20">
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 mb-4">Top Breeder & Top Seller</h2>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                        Pemegang puncak klasemen Mitra terbaik yang mencetak dan memperdagangkan koi unggulan di ekosistem KoiChain.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {partners.map((p, idx) => (
                        <Link 
                            href={`/user/${p.id}`}
                            key={p.id} 
                            className="group bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full animate-fade-up block"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full overflow-hidden flex items-center justify-center font-bold text-gray-500 text-xl shadow-inner border border-white">
                                    {p.avatar_url ? (
                                        <img src={p.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                                    ) : (
                                        p.store_name ? p.store_name.charAt(0).toUpperCase() : p.full_name?.charAt(0).toUpperCase() || '?'
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{p.store_name || p.full_name}</h3>
                                        <BadgeCheck className="text-blue-500 shrink-0" size={18} />
                                    </div>
                                    <p className="text-xs text-gray-500">{p.full_name}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {p.role?.includes('breeder') && (
                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">Breeder</span>
                                )}
                                {p.role?.includes('seller') && (
                                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold border border-purple-100">Seller</span>
                                )}
                            </div>

                            <div className="mt-auto space-y-2 pt-4 border-t border-gray-50">
                                {p.store_address && (
                                    <div className="flex items-start gap-2 text-sm text-gray-500">
                                        <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                                        <span className="line-clamp-2">{p.store_address}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-xs font-bold pt-2">
                                    <div className="text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                        {p.mint_count || 0} Minting
                                    </div>
                                    <div className="text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                                        {p.total_transfers || 0} Transfer
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <Link 
                        href="/mitra" 
                        className="inline-flex items-center justify-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                    >
                        Lihat Semua Mitra <ArrowRight size={20} className="text-orange-400" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
