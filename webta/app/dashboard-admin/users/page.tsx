'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Search, Loader2, ArrowLeft, ArrowRight, ShieldCheck, Ban, UserX, UserCheck, Trash2, Mail, Users, Filter, CheckCircle2, AlertTriangle, Briefcase, Store, Phone, Instagram, Clock, ShieldOff, X, Check, User, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import toast, { Toaster } from 'react-hot-toast';

type Tab = 'all' | 'requests' | 'partners';

const BAN_DURATIONS = [
  { label: '1 Hari', days: 1 },
  { label: '7 Hari', days: 7 },
  { label: '1 Bulan', days: 30 },
  { label: '3 Bulan', days: 90 },
  { label: '6 Bulan', days: 180 },
  { label: '1 Tahun', days: 365 },
  { label: 'Permanen', days: 0 },
];

function getRoleBadge(role: string) {
  const map: Record<string, string> = {
    admin: 'bg-red-100 text-red-700 border-red-200',
    author: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    breeder: 'bg-blue-100 text-blue-700 border-blue-200',
    seller: 'bg-purple-100 text-purple-700 border-purple-200',
    user: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return map[role] || map.user;
}

function isBanActive(profile: any): boolean {
  if (!profile.is_banned) return false;
  if (!profile.ban_until) return true; // permanen
  return new Date(profile.ban_until) > new Date();
}

function formatBanUntil(ban_until: string | null): string {
  if (!ban_until) return 'Permanen';
  return new Date(ban_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [banTarget, setBanTarget] = useState<any>(null);
  const [banDays, setBanDays] = useState(30);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [selectedKyc, setSelectedKyc] = useState<any>(null);

  // Demote States
  const [demoteTarget, setDemoteTarget] = useState<any>(null);
  const [demoteReason, setDemoteReason] = useState('');
  
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    // Tarik data secara paralel
    const [resAll, resReqs, resParts] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').not('requested_role', 'is', null).order('updated_at', { ascending: false }),
      supabase.from('profiles').select('*').order('full_name', { ascending: true }),
    ]);

    // Debugging RLS: Jika ada error, akan muncul di console inspect element
    if (resAll.error) console.error("Error Fetch All Users:", resAll.error.message);
    if (resReqs.error) console.error("Error Fetch Requests:", resReqs.error.message);

    let currentAllUsers = resAll.data || [];

    // FIX INFINITE LOOP: Logika Auto-Unban dipindah ke sini (hanya dijalankan saat fetch data pertama/manual)
    const expired = currentAllUsers.filter(u => u.is_banned && u.ban_until && new Date(u.ban_until) <= new Date());
    if (expired.length > 0) {
      console.log("Mencabut ban yang sudah kedaluwarsa...");
      for (const u of expired) {
        await supabase.from('profiles').update({ is_banned: false, ban_until: null }).eq('id', u.id);
      }
      // Ambil data terbaru setelah auto-unban
      const freshRes = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      currentAllUsers = freshRes.data || [];
    }

    setAllUsers(currentAllUsers);
    setRequests(resReqs.data || []);

    // Filter mitra: breeder, seller, atau seller,breeder (gabungan)
    const partnerData = (resParts.data || []).filter((u: any) =>
      u.role === 'breeder' || u.role === 'seller' || (u.role && u.role.includes('breeder') && u.role.includes('seller'))
    );
    setPartners(partnerData);

    setLoading(false);
  };

  // Hanya jalankan fetchData sekali saat halaman dimuat
  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: string, requestedRole: string, currentRole: string) => {
    let finalRole = requestedRole;
    if (currentRole === 'seller' && requestedRole === 'breeder') finalRole = 'seller,breeder';
    if (currentRole === 'breeder' && requestedRole === 'seller') finalRole = 'seller,breeder';

    const { error } = await supabase.from('profiles').update({ role: finalRole, requested_role: null, verification_status: 'verified' }).eq('id', id);
    if (!error) {
      await supabase.from('notifications').insert({
        user_id: id,
        title: 'Verifikasi Disetujui! 🎉',
        message: `Selamat! Pengajuan Anda sebagai ${requestedRole === 'breeder' ? 'Breeder' : 'Seller'} telah disetujui oleh Admin.`,
      });
      toast.success(`User di-ACC sebagai ${finalRole}!`);
      fetchData(); // Refresh data
    } else {
      toast.error(error.message);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Tolak pengajuan ini?')) return;
    const { error } = await supabase.from('profiles').update({ requested_role: null, verification_status: 'rejected' }).eq('id', id);
    if (!error) {
      await supabase.from('notifications').insert({
        user_id: id,
        title: 'Verifikasi Ditolak',
        message: 'Mohon maaf, pengajuan role Anda belum dapat disetujui saat ini. Silakan hubungi admin untuk info lebih lanjut.',
      });
      toast.success('Pengajuan ditolak.');
      fetchData();
    }
  };

  const handleDowngrade = (id: string, name: string) => {
    setDemoteTarget({ id, name });
    setDemoteReason(''); // reset
  };

  const executeDowngrade = async () => {
    if (!demoteTarget) return;
    const { error } = await supabase.from('profiles').update({ role: 'user' }).eq('id', demoteTarget.id);
    if (!error) {
      const msg = demoteReason.trim()
        ? `Mohon maaf, status mitra resmi Anda telah kami cabut. Alasan: ${demoteReason}`
        : `Mohon maaf, status mitra resmi Anda telah kami cabut.`;

      await supabase.from('notifications').insert({
        user_id: demoteTarget.id,
        title: '⚠️ Status Kemitraan Dicabut',
        message: msg,
      });

      toast.success(`Jabatan ${demoteTarget.name} berhasil dicopot.`);
      setDemoteTarget(null);
      setDemoteReason('');
      fetchData();
    } else {
      toast.error(error.message);
    }
  };

  const handleRoleChange = async (id: string, newRole: string, name: string) => {
    if (!confirm(`Ubah role ${name} menjadi "${newRole}"?`)) return;
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    if (!error) { toast.success(`Role ${name} diubah ke ${newRole}.`); fetchData(); }
    else toast.error(error.message);
  };

  const handleBan = async () => {
    if (!banTarget) return;
    const ban_until = banDays === 0 ? null : new Date(Date.now() + banDays * 86400000).toISOString();
    const { error } = await supabase.from('profiles').update({ is_banned: true, ban_until }).eq('id', banTarget.id);
    if (!error) {
      await supabase.from('notifications').insert({
        user_id: banTarget.id,
        title: 'Akun Dibekukan ⚠️',
        message: `Akun Anda telah dibekukan oleh Admin ${banDays === 0 ? 'secara permanen' : `selama ${banDays} hari`}.`,
      });
      toast.success(`${banTarget.full_name} di-ban ${banDays === 0 ? 'permanen' : `${banDays} hari`}.`);
      setBanTarget(null);
      fetchData();
    } else toast.error(error.message);
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`PERINGATAN KRITIS: Apakah Anda yakin ingin menghapus permanen akun "${name}"?\nTindakan ini TIDAK BISA dibatalkan!`)) return;
    if (!confirm(`Tunggu!\nApakah Anda sudah menghapus data Ikan Koi dan Dompet milik akun ini?\nJika belum, penghapusan ini akan digagalkan oleh sistem keamanan database (Foreign Key). Lanjutkan?`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus pengguna');
      
      toast.success(`Akun ${name} berhasil dihapus permanen!`);
      setSelectedPartner(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menghapus user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUnban = async (id: string, name: string) => {
    if (!confirm(`Unban ${name}?`)) return;
    const { error } = await supabase.from('profiles').update({ is_banned: false, ban_until: null }).eq('id', id);
    if (!error) {
      await supabase.from('notifications').insert({
        user_id: id,
        title: 'Akun Dipulihkan ✅',
        message: 'Pembekuan akun Anda telah dicabut oleh Admin. Anda dapat menggunakan fitur platform kembali.',
      });
      toast.success(`${name} berhasil di-unban.`);
      fetchData();
    }
  };

  const filtered = allUsers.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <Toaster position="top-center" />
      <main className="max-w-6xl mx-auto px-4 py-10">

        <BackButton />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Kelola Pengguna</h1>
            <p className="text-gray-500 mt-1">Manajemen semua user, verifikasi mitra, dan moderasi akun.</p>
          </div>
          <div className="bg-white p-1 rounded-xl border border-gray-200 inline-flex shadow-sm gap-1">
            {([['all', Users, 'Semua User'], ['requests', Briefcase, 'Permintaan'], ['partners', Store, 'Daftar Mitra']] as const).map(([tab, Icon, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === tab ? 'bg-red-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Icon size={15} /> {label}
                {tab === 'requests' && requests.length > 0 && <span className="bg-white text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-black">{requests.length}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* TAB: SEMUA USER */}
        {activeTab === 'all' && (
          <div>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau role..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-4 font-bold text-gray-700">Pengguna</th>
                    <th className="px-5 py-4 font-bold text-gray-700">Role</th>
                    <th className="px-5 py-4 font-bold text-gray-700">Status</th>
                    <th className="px-5 py-4 font-bold text-gray-700">Ban Berakhir</th>
                    <th className="px-5 py-4 font-bold text-gray-700 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && <tr><td colSpan={5} className="p-8 text-center text-gray-400">Memuat data...</td></tr>}
                  {!loading && filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">Tidak ada user ditemukan.</td></tr>}
                  {filtered.map(u => {
                    const banned = isBanActive(u);
                    return (
                      <tr key={u.id} className="hover:bg-blue-50 transition cursor-pointer" onClick={() => setSelectedPartner(u)}>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-blue-700 hover:underline">{u.full_name || 'Tanpa Nama'}</div>
                          <div className="text-xs text-gray-400 font-mono">{u.id.slice(0, 12)}...</div>
                        </td>
                        <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                          <select
                            value={u.role || 'user'}
                            onChange={e => handleRoleChange(u.id, e.target.value, u.full_name)}
                            className={`px-2 py-1 rounded text-xs font-bold uppercase border cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-300 ${getRoleBadge(u.role)}`}
                          >
                            <option value="user">user</option>
                            <option value="author">author</option>
                            <option value="breeder">breeder</option>
                            <option value="seller">seller</option>
                            <option value="seller,breeder">seller,breeder</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="px-5 py-3">
                          {banned
                            ? <span className="flex items-center gap-1 text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded border border-red-100 w-fit"><Ban size={11} /> BANNED</span>
                            : <span className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded border border-green-100 w-fit"><CheckCircle size={11} /> Aktif</span>}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                          {banned ? formatBanUntil(u.ban_until) : '-'}
                        </td>
                        <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            {banned
                              ? <button onClick={() => handleUnban(u.id, u.full_name)} className="px-3 py-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-600 hover:text-white transition">Unban</button>
                              : <button onClick={() => { setBanTarget(u); setBanDays(30); }} className="px-3 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-600 hover:text-white transition">Ban</button>}
                            <button onClick={() => handleDeleteUser(u.id, u.full_name)} disabled={isDeleting} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition disabled:opacity-50" title="Hapus Permanen">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: PERMINTAAN BARU */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {loading && <div className="text-center py-10 text-gray-400">Memuat permintaan...</div>}
            {!loading && requests.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">
                <Briefcase className="mx-auto h-12 w-12 text-gray-200 mb-3" />
                Tidak ada permintaan upgrade akun saat ini.
              </div>
            )}
            {requests.map(req => (
              <div key={req.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-red-300 transition cursor-pointer group" onClick={() => setSelectedKyc(req)}>
                <div>
                   <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900 mb-1">{req.full_name || 'Tanpa Nama'} <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">Ingin: {req.requested_role}</span></h3>
                   <p className="text-sm text-gray-500">{req.store_name} • {req.contact_email}</p>
                </div>
                <button className="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-600 hover:text-white transition shadow-sm border border-red-100 group-hover:border-red-600 whitespace-nowrap">
                    Tinjau KYC
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAB: DAFTAR MITRA */}
        {activeTab === 'partners' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-4 font-bold text-gray-700">Nama & Bisnis</th>
                  <th className="px-5 py-4 font-bold text-gray-700">Kontak</th>
                  <th className="px-5 py-4 font-bold text-gray-700">Role</th>
                  <th className="px-5 py-4 font-bold text-gray-700">Status</th>
                  <th className="px-5 py-4 font-bold text-gray-700 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && <tr><td colSpan={5} className="p-10 text-center text-gray-400">Memuat data mitra...</td></tr>}
                {!loading && partners.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-gray-400">Belum ada mitra terdaftar.</td></tr>}
                {partners.map(p => {
                  const banned = isBanActive(p);
                  return (
                    <tr key={p.id} className="hover:bg-blue-50 transition cursor-pointer" onClick={() => setSelectedPartner(p)}>
                      <td className="px-5 py-3"><div className="font-semibold text-blue-700 hover:underline">{p.full_name || 'Tanpa Nama'}</div><div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Store size={10} />{p.store_name || '-'}</div></td>
                      <td className="px-5 py-3 text-xs text-gray-600"><div className="flex items-center gap-1"><Phone size={10} />{p.contact_phone || '-'}</div>{p.instagram && <div className="flex items-center gap-1 text-blue-600 mt-0.5"><Instagram size={10} />{p.instagram}</div>}</td>
                      <td className="px-5 py-3"><span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${getRoleBadge(p.role)}`}>{p.role}</span></td>
                      <td className="px-5 py-3">
                        {banned
                          ? <div><span className="flex items-center gap-1 text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded border border-red-100 w-fit"><Ban size={11} /> BANNED</span><div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Clock size={9} />{formatBanUntil(p.ban_until)}</div></div>
                          : <span className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded border border-green-100 w-fit"><CheckCircle size={11} /> Aktif</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                          <button onClick={() => handleDowngrade(p.id, p.full_name || 'Tanpa Nama')} title="Copot Jabatan" className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50 border border-transparent hover:border-orange-200 transition"><ShieldOff size={16} /></button>
                          {banned
                            ? <button onClick={() => handleUnban(p.id, p.full_name)} className="px-3 py-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-600 hover:text-white transition">Unban</button>
                            : <button onClick={() => { setBanTarget(p); setBanDays(30); }} className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-600 hover:text-white transition">Ban</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* MODAL BAN */}
      {banTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-lg text-gray-900">Ban Pengguna</h2>
              <button onClick={() => setBanTarget(null)} className="p-1.5 rounded-full hover:bg-gray-100 transition"><X size={18} /></button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-5">Pilih durasi ban untuk <span className="font-bold text-gray-900">{banTarget.full_name}</span>:</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {BAN_DURATIONS.map(d => (
                  <button key={d.days} onClick={() => setBanDays(d.days)}
                    className={`py-2.5 rounded-xl text-sm font-bold border transition ${banDays === d.days ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600'}`}>
                    {d.label}
                  </button>
                ))}
              </div>
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-700 mb-5">
                <span className="font-bold">Ban berakhir: </span>
                {banDays === 0 ? 'Permanen (tidak ada batas waktu)' : `${new Date(Date.now() + banDays * 86400000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setBanTarget(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition">Batal</button>
                <button onClick={handleBan} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition flex items-center justify-center gap-2"><Ban size={16} /> Terapkan Ban</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENCABUTAN JABATAN (DEMOTE) */}
      {demoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-orange-50/50 rounded-t-2xl">
              <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2"><ShieldOff size={20} className="text-orange-500"/> Copot Jabatan</h2>
              <button onClick={() => setDemoteTarget(null)} className="p-1.5 rounded-full hover:bg-gray-200 transition"><X size={18} /></button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4 text-sm">
                Anda akan menurunkan jabatan <span className="font-bold text-gray-900">{demoteTarget.name}</span> menjadi Regular User. Pengguna ini akan kehilangan lencana Mitra Resmi dan akses dashboard khusus.
              </p>
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Alasan (Opsional)</label>
                <textarea 
                  rows={3} 
                  placeholder="Ketikkan alasan pencabutan jabatan di sini (misal: Melanggar aturan)..."
                  value={demoteReason}
                  onChange={(e) => setDemoteReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
                />
                <p className="text-xs text-gray-400 mt-2">Alasan ini akan dikirimkan langsung ke Notifikasi pengguna tersebut.</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setDemoteTarget(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition">Batal</button>
                <button onClick={executeDowngrade} className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition flex items-center justify-center gap-2">Copot Jabatan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL MITRA */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedPartner(null)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gray-50 px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-200 border-4 border-white shadow overflow-hidden flex items-center justify-center">
                  {selectedPartner.avatar_url ? <img src={selectedPartner.avatar_url} className="w-full h-full object-cover" alt="Avatar" /> : <User size={22} className="text-gray-400" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedPartner.full_name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${getRoleBadge(selectedPartner.role)}`}>{selectedPartner.role}</span>
                    {isBanActive(selectedPartner) && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">BANNED</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedPartner(null)} className="p-2 rounded-full hover:bg-gray-200 transition text-gray-500"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              
              {/* DATA PRIBADI (PEMILIK) */}
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Data Pribadi / Akun</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Nama Lengkap</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-2"><User size={14} className="text-gray-500" />{selectedPartner.full_name || '-'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">No. HP Pribadi</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-2"><Phone size={14} className="text-gray-500" />{selectedPartner.phone || '-'}</p>
                  </div>
                  <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Alamat Domisili</p>
                    <p className="font-medium text-gray-800 text-sm flex items-start gap-2"><MapPin size={14} className="text-gray-500 mt-0.5 shrink-0" />{selectedPartner.address || '-'}</p>
                  </div>
                </div>
              </div>

              {/* DATA BISNIS (TOKO/FARM) */}
              <div>
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-wider mb-3 mt-2">Data Toko / Bisnis</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-400 font-bold uppercase mb-1">Nama Bisnis</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-2"><Store size={14} className="text-blue-500" />{selectedPartner.store_name || '-'}</p>
                  </div>
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-400 font-bold uppercase mb-1">Email Kontak</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-2"><Mail size={14} className="text-blue-500" />{selectedPartner.contact_email || '-'}</p>
                  </div>
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-400 font-bold uppercase mb-1">No. Telepon / WA Toko</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-2"><Phone size={14} className="text-blue-500" />{selectedPartner.contact_phone || '-'}</p>
                  </div>
                  {selectedPartner.instagram && (
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <p className="text-xs text-blue-400 font-bold uppercase mb-1">Instagram</p>
                      <p className="font-semibold text-blue-600 flex items-center gap-2"><Instagram size={14} />{selectedPartner.instagram}</p>
                    </div>
                  )}
                  <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-400 font-bold uppercase mb-1">Alamat Toko</p>
                    <p className="font-medium text-gray-800 text-sm flex items-start gap-2"><MapPin size={14} className="text-blue-500 mt-0.5 shrink-0" />{selectedPartner.store_address || '-'}</p>
                  </div>
                  <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-400 font-bold uppercase mb-1">Deskripsi Bisnis</p>
                    <p className="italic text-gray-600 text-sm">{selectedPartner.store_description || 'Tidak ada deskripsi.'}</p>
                  </div>
                </div>
              </div>
              {/* DOKUMEN KYC */}
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 mt-4 border-t border-gray-100 pt-5">Dokumen Verifikasi (KYC)</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                    <p className="text-xs font-bold text-gray-500 mb-2">KTP Asli</p>
                    {selectedPartner.ktp_url ? (
                      <a href={selectedPartner.ktp_url} target="_blank" rel="noreferrer" className="block relative aspect-video rounded-lg overflow-hidden group border border-gray-200 shadow-sm">
                        <img src={selectedPartner.ktp_url} alt="KTP" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition text-white text-[10px] font-bold">Perbesar</div>
                      </a>
                    ) : (
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 border border-gray-200 border-dashed">Tidak ada file</div>
                    )}
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                    <p className="text-xs font-bold text-gray-500 mb-2">Selfie dengan KTP</p>
                    {selectedPartner.ktp_selfie_url ? (
                      <a href={selectedPartner.ktp_selfie_url} target="_blank" rel="noreferrer" className="block relative aspect-video rounded-lg overflow-hidden group border border-gray-200 shadow-sm">
                        <img src={selectedPartner.ktp_selfie_url} alt="Selfie KTP" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition text-white text-[10px] font-bold">Perbesar</div>
                      </a>
                    ) : (
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 border border-gray-200 border-dashed">Tidak ada file</div>
                    )}
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                    <p className="text-xs font-bold text-gray-500 mb-2">Foto Toko/Farm</p>
                    {selectedPartner.farm_photo_url ? (
                      <a href={selectedPartner.farm_photo_url} target="_blank" rel="noreferrer" className="block relative aspect-video rounded-lg overflow-hidden group border border-gray-200 shadow-sm">
                        <img src={selectedPartner.farm_photo_url} alt="Foto Farm" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition text-white text-[10px] font-bold">Perbesar</div>
                      </a>
                    ) : (
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 border border-gray-200 border-dashed">Tidak ada file</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => handleDeleteUser(selectedPartner.id, selectedPartner.full_name)} disabled={isDeleting} className="px-4 py-2 text-sm font-bold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition flex items-center gap-2 disabled:opacity-50"><Trash2 size={14} /> Hapus</button>
              <button onClick={() => { setBanTarget(selectedPartner); setBanDays(30); setSelectedPartner(null); }} className="px-4 py-2 text-sm font-bold text-orange-600 border border-orange-200 rounded-xl hover:bg-orange-50 transition flex items-center gap-2"><Ban size={14} /> Ban</button>
              <button onClick={() => setSelectedPartner(null)} className="px-5 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition">Tutup</button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL KYC VERIFICATION */}
      {selectedKyc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl my-8 relative flex flex-col max-h-[90vh]">
            <button onClick={() => setSelectedKyc(null)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 bg-gray-100 p-2 rounded-full transition z-10"><X size={24}/></button>
            
            <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50 shrink-0 rounded-t-[2rem]">
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2"><UserCheck className="text-red-600" /> Tinjau Pengajuan Mitra</h2>
                <p className="text-gray-500 mt-1">Lakukan verifikasi KYC dengan saksama sebelum menyetujui hak Minting atau Kepemilikan.</p>
            </div>

            <div className="p-8 space-y-10 overflow-y-auto flex-grow custom-scrollbar">
                {/* IDENTITAS PENGGUNA */}
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                    <div>
                        <h3 className="text-3xl font-black text-gray-900">{selectedKyc.full_name || 'Tanpa Nama'}</h3>
                        <p className="text-gray-500 font-mono text-sm mt-1">{selectedKyc.id}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Mengajukan Role</p>
                        <span className="bg-red-600 text-white px-5 py-2 rounded-xl font-black text-lg uppercase tracking-wide shadow-md inline-block">{selectedKyc.requested_role}</span>
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* 1. SPLIT SCREEN KTP */}
                <div>
                    <h4 className="text-sm font-black text-red-600 uppercase mb-4 flex items-center gap-2">1. Verifikasi Wajah & Identitas</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm">
                            <p className="text-center font-bold text-sm text-gray-700 mb-3">Foto KTP Asli</p>
                            {selectedKyc.ktp_url ? (
                                <a href={selectedKyc.ktp_url} target="_blank" rel="noreferrer" className="block relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm group">
                                    <img src={selectedKyc.ktp_url} alt="KTP" className="w-full h-full object-cover group-hover:scale-105 transition" />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><span className="bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full">Buka Penuh</span></div>
                                </a>
                            ) : <div className="aspect-[4/3] bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm">Tidak ada foto KTP</div>}
                        </div>
                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm">
                            <p className="text-center font-bold text-sm text-gray-700 mb-3">Selfie Pegang KTP</p>
                            {selectedKyc.ktp_selfie_url ? (
                                <a href={selectedKyc.ktp_selfie_url} target="_blank" rel="noreferrer" className="block relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm group">
                                    <img src={selectedKyc.ktp_selfie_url} alt="Selfie KTP" className="w-full h-full object-cover group-hover:scale-105 transition" />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><span className="bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full">Buka Penuh</span></div>
                                </a>
                            ) : <div className="aspect-[4/3] bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm font-medium">⚠️ User ini tidak mengunggah Selfie KTP</div>}
                        </div>
                    </div>
                </div>

                {/* 2. DATA BISNIS & KONTAK */}
                <div>
                    <h4 className="text-sm font-black text-red-600 uppercase mb-4 flex items-center gap-2">2. Validasi Bisnis & Komunikasi</h4>
                    <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 grid md:grid-cols-2 gap-8 shadow-inner">
                        <div>
                            <p className="text-xs font-bold text-orange-500 uppercase mb-1">Nama Usaha</p>
                            <p className="font-black text-gray-900 text-xl">{selectedKyc.store_name}</p>
                            
                            <p className="text-xs font-bold text-orange-500 uppercase mt-5 mb-1">Alamat Lengkap</p>
                            <p className="text-gray-800 leading-relaxed font-medium">{selectedKyc.store_address}</p>
                            
                            <p className="text-xs font-bold text-orange-500 uppercase mt-5 mb-1">Deskripsi</p>
                            <p className="text-gray-600 italic">{selectedKyc.store_description || '-'}</p>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl border border-orange-100">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Kontak Email</p>
                                <p className="font-bold text-gray-800 flex items-center gap-2"><Mail size={16} className="text-orange-500" /> {selectedKyc.contact_email}</p>
                            </div>
                            
                            <div className="pt-2">
                                <a href={`https://wa.me/${(selectedKyc.contact_phone || '').replace(/^0/, '62')}?text=${encodeURIComponent(`Halo ${selectedKyc.full_name}, kami dari Admin KoiChain. Mohon kerjasamanya untuk Video Call 1 menit guna memverifikasi Kolam / Toko Anda sebelum pendaftaran mitra kami setujui.`)}`} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-4 rounded-xl font-black hover:bg-[#20bd5a] transition shadow-lg shadow-[#25D366]/30 hover:-translate-y-1">
                                    <Phone size={20} /> INTERVIEW VIA WHATSAPP
                                </a>
                            </div>
                            <div>
                                {selectedKyc.instagram ? (
                                    <a href={`https://instagram.com/${selectedKyc.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold hover:opacity-90 transition shadow-md">
                                        <Instagram size={18} /> Cek Instagram Usaha
                                    </a>
                                ) : (
                                    <div className="w-full text-center py-3 bg-white border border-gray-200 text-gray-400 rounded-xl font-bold text-sm">Tidak Melampirkan Instagram</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. BUKTI FISIK KOLAM */}
                <div>
                    <h4 className="text-sm font-black text-red-600 uppercase mb-4 flex items-center gap-2">3. Bukti Fisik Operasional</h4>
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm">
                        {selectedKyc.farm_photo_url ? (
                            <a href={selectedKyc.farm_photo_url} target="_blank" rel="noreferrer" className="block relative h-64 md:h-96 w-full rounded-xl overflow-hidden shadow-sm group">
                                <img src={selectedKyc.farm_photo_url} alt="Foto Kolam/Toko" className="w-full h-full object-cover group-hover:scale-105 transition" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><span className="bg-white text-gray-900 text-sm font-bold px-4 py-2 rounded-full">Lihat Resolusi Penuh</span></div>
                            </a>
                        ) : <div className="h-40 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm font-medium">⚠️ User ini tidak mengunggah Foto Lokasi</div>}
                    </div>
                </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="p-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-4 justify-end shrink-0 rounded-b-[2rem] shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)]">
                <button onClick={() => { handleReject(selectedKyc.id); setSelectedKyc(null); }} className="px-8 py-4 rounded-xl font-bold text-red-600 bg-white border-2 border-red-200 hover:bg-red-50 flex items-center justify-center gap-2 transition"><XCircle size={20} /> Tolak Pengajuan</button>
                <button onClick={() => { handleApprove(selectedKyc.id, selectedKyc.requested_role, selectedKyc.role); setSelectedKyc(null); }} className="px-10 py-4 rounded-xl font-black text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/30 flex items-center justify-center gap-2 transition transform hover:-translate-y-1"><CheckCircle2 size={22} /> VERIFIKASI & BERI HAK</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}