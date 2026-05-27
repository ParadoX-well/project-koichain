'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ArrowLeft, Fish, Search, Loader2, ExternalLink, Baby, Calendar, Ruler, Filter, Send, Edit } from 'lucide-react';

export default function CollectionPage() {
  const router = useRouter();
  const [kois, setKois] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState<'all' | 'manual' | 'spawning'>('all');
  const [role, setRole] = useState('');

  const { user: authUser } = useRequireAuth();

  useEffect(() => {
    if (!authUser) return;
    const init = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_banned')
        .eq('id', authUser.id)
        .single();

      if (!profile || profile.is_banned) {
        router.replace('/dashboard-user');
        return;
      }
      // Izinkan: breeder, seller, admin, atau kombinasi seller,breeder
      const allowedRoles = ['breeder', 'seller', 'admin'];
      const hasAccess = allowedRoles.includes(profile.role) ||
        (typeof profile.role === 'string' && (profile.role.includes('breeder') || profile.role.includes('seller')));
      if (!hasAccess) {
        router.replace('/dashboard-user');
        return;
      }
      setRole(profile.role);

      const { data: certs } = await supabase
        .from('koi_certificates')
        .select('*, spawning_sessions(session_code, spawn_date)')
        .eq('breeder_id', authUser.id)
        .order('minted_at', { ascending: false });

      setKois(certs || []);
      setFiltered(certs || []);
      setLoading(false);
    };
    init();
  }, [authUser, router]);

  useEffect(() => {
    let result = kois;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(k =>
        k.koi_id?.toLowerCase().includes(q) ||
        k.variety?.toLowerCase().includes(q)
      );
    }

    if (filterSource === 'manual') result = result.filter(k => !k.spawning_session_id);
    if (filterSource === 'spawning') result = result.filter(k => !!k.spawning_session_id);

    setFiltered(result);
  }, [search, filterSource, kois]);

  const totalKois = kois.length;
  const fromSpawning = kois.filter(k => k.spawning_session_id).length;
  const fromManual = kois.filter(k => !k.spawning_session_id).length;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-10">

        {/* Back + Header */}
        <Link href="/dashboard-owner" className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition mb-6 w-fit group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Koleksi Koi Saya</h1>
            <p className="text-gray-500 mt-1 capitalize">
              Semua sertifikat yang diterbitkan oleh akun <strong>{role}</strong> ini.
            </p>
          </div>
          <Link href={role === 'breeder' || role === 'admin' ? '/minting' : '#'}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-lg ${role === 'seller' ? 'hidden' : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-100'}`}>
            <Fish size={16} /> Mint Koi Baru
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Koi', value: totalKois, color: 'text-gray-900', bg: 'bg-white' },
            { label: 'Dari Pemijahan', value: fromSpawning, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Mint Manual', value: fromManual, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl border border-gray-200 p-5 text-center shadow-sm`}>
              <div className={`text-4xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari ID Koi atau Varietas..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-400 shrink-0" />
            {(['all', 'spawning', 'manual'] as const).map(f => (
              <button key={f} onClick={() => setFilterSource(f)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition border ${filterSource === f ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300'}`}>
                {f === 'all' ? 'Semua' : f === 'spawning' ? '🍼 Pemijahan' : '⚡ Manual'}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Koi */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-gray-300" size={36} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
            <Fish size={52} className="mx-auto mb-4 text-gray-200" />
            <p className="font-semibold text-lg">{search ? 'Tidak ada hasil pencarian.' : 'Belum ada koi yang diterbitkan.'}</p>
            <p className="text-sm mt-1">
              {!search && (role !== 'seller'
                ? <Link href="/minting" className="text-orange-600 hover:underline font-medium">Mint koi pertama Anda →</Link>
                : 'Hubungi breeder untuk mendapatkan koi.'
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(koi => (
              <div key={koi.koi_id} 
                className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-orange-200 transition duration-300 overflow-hidden flex flex-col">

                {/* Bagian Atas: Link ke Sertifikat */}
                <Link href={`/koi/${encodeURIComponent(koi.koi_id)}`} className="flex flex-col flex-1 cursor-pointer">
                  {/* Foto */}
                  <div className="aspect-square bg-gray-100 overflow-hidden relative">
                    {koi.photo_url ? (
                      <img src={koi.photo_url} alt={koi.variety} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 flex-col gap-2">
                        <Fish size={40} />
                        <span className="text-xs">Belum ada foto</span>
                      </div>
                    )}
                    {/* Badge sumber */}
                    <div className="absolute top-2 left-2">
                      {koi.spawning_session_id
                        ? <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">🍼 Pemijahan</span>
                        : <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">⚡ Manual</span>
                      }
                    </div>
                  </div>

                  {/* Info Utama */}
                  <div className="p-4 pb-2 flex flex-col flex-1">
                    <div className="mb-2">
                      <p className="font-black text-gray-900 text-base leading-tight group-hover:text-orange-600 transition">{koi.variety || 'Varietas -'}</p>
                      <p className="text-xs font-mono text-gray-400 mt-0.5">{koi.koi_id}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-gray-100 text-xs text-gray-500">
                      {koi.size && (
                        <span className="flex items-center gap-1"><Ruler size={11} /> {koi.size} cm</span>
                      )}
                      {koi.spawning_sessions?.session_code && (
                        <span className="flex items-center gap-1"><Baby size={11} /> {koi.spawning_sessions.session_code}</span>
                      )}
                      <span className="flex items-center gap-1 ml-auto">
                        <Calendar size={11} />
                        {new Date(koi.minted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Bagian Bawah: Aksi Cepat */}
                <div className="px-4 pb-4 pt-2 mt-auto bg-gray-50/50 flex items-center justify-between gap-2 border-t border-gray-100">
                   <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => router.push(`/admin/transfer?id=${encodeURIComponent(koi.koi_id)}`)}
                        className="bg-green-100 text-green-700 hover:bg-green-600 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1"
                      >
                         <Send size={12} /> Transfer
                      </button>
                      <button 
                        onClick={() => router.push(`/admin/update-koi?id=${encodeURIComponent(koi.koi_id)}`)}
                        className="bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1"
                      >
                         <Edit size={12} /> Update
                      </button>
                   </div>
                   
                   <Link href={`/koi/${encodeURIComponent(koi.koi_id)}`} className="text-orange-500 hover:text-orange-700 flex items-center justify-center p-1.5 bg-orange-50 rounded-lg transition" title="Lihat Sertifikat">
                     <ExternalLink size={14} />
                   </Link>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <p className="text-center text-sm text-gray-400 mt-8">
            Menampilkan {filtered.length} dari {totalKois} sertifikat
          </p>
        )}
      </main>
    </div>
  );
}
