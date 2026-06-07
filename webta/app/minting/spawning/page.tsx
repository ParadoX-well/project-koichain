'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ArrowLeft, Plus, Trash2, Fish, Calendar, MapPin, X, ChevronRight, Loader2, Baby } from 'lucide-react';

export default function SpawningPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    motherId: '',
    spawnDate: new Date().toISOString().split('T')[0],
    location: '',
    notes: '',
  });
  const [fathers, setFathers] = useState<string[]>(['']);

  const { user: authUser } = useRequireAuth();

  useEffect(() => {
    if (!authUser) return;
    const init = async () => {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', authUser.id).single();
      const canAccess = profile && (profile.role === 'breeder' || profile.role === 'admin' ||
        (typeof profile.role === 'string' && profile.role.includes('breeder')));
      if (!canAccess) {
        toast.error('Hanya Breeder yang dapat mengakses halaman ini.');
        router.replace('/dashboard-mitra');
        return;
      }
      setUserId(authUser.id);
      fetchSessions(authUser.id);
    };
    init();
  }, [authUser, router]);

  const fetchSessions = async (uid: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('spawning_sessions')
      .select('*, spawning_fathers(father_koi_id), profiles(full_name)')
      .eq('breeder_id', uid)
      .order('spawn_date', { ascending: false });
    setSessions(data || []);
    setLoading(false);
  };

  const generateCode = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return `SPAWN-${year}-${rand}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validFathers = fathers.filter(f => f.trim() !== '');
    if (!form.motherId.trim()) { toast.error('ID Induk Betina wajib diisi.'); return; }

    setSaving(true);
    const code = generateCode();

    const { data: session, error } = await supabase
      .from('spawning_sessions')
      .insert({
        breeder_id: userId,
        session_code: code,
        mother_koi_id: form.motherId.trim(),
        spawn_date: form.spawnDate,
        location: form.location,
        notes: form.notes,
      })
      .select()
      .single();

    if (error) { toast.error(error.message); setSaving(false); return; }

    if (validFathers.length > 0) {
      await supabase.from('spawning_fathers').insert(
        validFathers.map(f => ({ session_id: session.id, father_koi_id: f.trim() }))
      );
    }

    toast.success(`Sesi ${code} berhasil dibuat!`);
    setShowForm(false);
    setForm({ motherId: '', spawnDate: new Date().toISOString().split('T')[0], location: '', notes: '' });
    setFathers(['']);
    fetchSessions(userId);
    setSaving(false);
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Hapus sesi ${code}? Semua data ayah pada sesi ini akan ikut terhapus.`)) return;
    await supabase.from('spawning_sessions').delete().eq('id', id);
    toast.success('Sesi dihapus.');
    fetchSessions(userId);
  };

  const addFather = () => setFathers([...fathers, '']);
  const removeFather = (i: number) => setFathers(fathers.filter((_, idx) => idx !== i));
  const setFather = (i: number, val: string) => setFathers(fathers.map((f, idx) => idx === i ? val : f));

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <Toaster position="top-center" />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <BackButton />

        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sesi Pemijahan</h1>
            <p className="text-gray-500 mt-1">Kelola sesi pemijahan dan batch minting anakan Koi.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-700 transition shadow-lg shadow-orange-100"
          >
            <Plus size={16} /> Sesi Baru
          </button>
        </div>

        {/* List Sesi */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-gray-300" size={32} /></div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
            <Baby size={48} className="mx-auto mb-3 text-gray-200" />
            <p className="font-semibold">Belum ada sesi pemijahan.</p>
            <p className="text-sm mt-1">Klik "Sesi Baru" untuk memulai.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row gap-4 hover:border-orange-200 transition">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="font-black text-lg text-gray-900 font-mono">{s.session_code}</span>
                    <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full border border-orange-200">
                      {s.spawning_fathers?.length || 0} Ayah · {s.offspring_count} Anakan
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><Fish size={14} className="text-blue-400" /> Ibu: <span className="font-mono font-bold">{s.mother_koi_id || '-'}</span></div>
                    <div className="flex items-center gap-2"><Calendar size={14} className="text-orange-400" /> {new Date(s.spawn_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    {s.location && <div className="flex items-center gap-2"><MapPin size={14} className="text-red-400" /> {s.location}</div>}
                    {s.spawning_fathers?.length > 0 && (
                      <div className="flex items-start gap-2 col-span-2">
                        <Fish size={14} className="text-green-400 mt-0.5 shrink-0" />
                        <span>Ayah: {s.spawning_fathers.map((f: any) => <span key={f.father_koi_id} className="font-mono font-bold bg-green-50 border border-green-100 px-1.5 py-0.5 rounded text-xs mr-1">{f.father_koi_id}</span>)}</span>
                      </div>
                    )}
                    {s.notes && <div className="col-span-2 italic text-gray-400 text-xs mt-1">📝 {s.notes}</div>}
                  </div>
                </div>
                <div className="flex md:flex-col gap-2 items-center md:items-end justify-end shrink-0">
                  <Link
                    href={`/minting/batch/${s.id}`}
                    className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-700 transition whitespace-nowrap"
                  >
                    <Baby size={15} /> Batch Mint <ChevronRight size={14} />
                  </Link>
                  <button
                    onClick={() => handleDelete(s.id, s.session_code)}
                    className="p-2.5 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 hover:border-red-200 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL FORM SESI BARU */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-lg">Buat Sesi Pemijahan Baru</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-full hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold mb-1.5">ID Induk Betina (Ibu) <span className="text-red-500">*</span></label>
                <input value={form.motherId} onChange={e => setForm({ ...form, motherId: e.target.value })} placeholder="Contoh: KOI-2023-F01"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono" required />
                <p className="text-xs text-gray-400 mt-1">Masukkan ID Koi betina yang sudah bersertifikat.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-bold">ID Induk Jantan (Ayah)</label>
                  <button type="button" onClick={addFather} className="text-xs text-orange-600 font-bold hover:underline flex items-center gap-1">
                    <Plus size={12} /> Tambah Ayah
                  </button>
                </div>
                <div className="space-y-2">
                  {fathers.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={f} onChange={e => setFather(i, e.target.value)} placeholder={`ID Ayah ${i + 1} (Opsional)`}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono" />
                      {fathers.length > 1 && (
                        <button type="button" onClick={() => removeFather(i)} className="p-2.5 rounded-xl border border-red-100 text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold mb-1.5">Tanggal Pemijahan</label>
                  <input type="date" value={form.spawnDate} onChange={e => setForm({ ...form, spawnDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5">Lokasi Kolam</label>
                  <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Kolam A, Kandang 3..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5">Catatan</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan tentang sesi pemijahan ini..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {saving ? 'Menyimpan...' : 'Buat Sesi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
