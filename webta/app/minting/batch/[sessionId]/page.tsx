'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contractConfig';
import { ethers } from 'ethers';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Fish, Loader2, CheckCircle, Upload, Baby } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface OffspringRow {
  id: string;
  variety: string;
  customVariety?: string;
  gender: string;
  age: string;
  size: string;
  condition: string;
  note: string;
  breederName: string;
  photo: File | null;
  status: 'pending' | 'minting' | 'done' | 'error';
  txHash?: string;
}

const emptyRow = (sessionCode: string, index: number, defaultBreeder: string = ''): OffspringRow => {
  // sessionCode format: SPAWN-2025-1234 → ID: KOI-2025-1234-001
  const parts = sessionCode.split('-'); // ['SPAWN', '2025', '1234']
  const shortCode = parts.length >= 3 ? `${parts[1]}-${parts[2]}` : sessionCode;
  return {
    id: `KOI-${shortCode}-${String(index).padStart(3, '0')}`,
    variety: '',
    customVariety: '',
    gender: 'Tidak Diketahui',
    age: '',
    size: '',
    condition: 'Sehat',
    note: '',
    breederName: defaultBreeder,
    photo: null,
    status: 'pending',
  };
};

export default function BatchMintPage() {
  const { account, connectWallet } = useWallet();
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OffspringRow[]>([]);
  const [mintedKois, setMintedKois] = useState<any[]>([]);
  const [minting, setMinting] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  const { user: authUser } = useRequireAuth();

  useEffect(() => {
    if (!authUser) return;
    const init = async () => {

      const { data: s } = await supabase
        .from('spawning_sessions')
        .select('*, spawning_fathers(father_koi_id)')
        .eq('id', sessionId)
        .single();

      if (!s || s.breeder_id !== authUser.id) {
        toast.error('Sesi tidak ditemukan.');
        router.replace('/minting/spawning');
        return;
      }

      // Fetch history ikan yang sudah di-minting untuk sesi ini
      // Gunakan OR agar ikan lama (sebelum ada kolom spawning_session_id) tetap terdeteksi dari pola ID-nya
      const prefix = s.session_code.split('-').length >= 3 ? `KOI-${s.session_code.split('-')[1]}-${s.session_code.split('-')[2]}-%` : 'none';
      const { data: minted } = await supabase
        .from('koi_certificates')
        .select('*')
        .or(`spawning_session_id.eq.${sessionId},koi_id.ilike.${prefix}`)
        .order('minted_at', { ascending: false });

      if (minted) setMintedKois(minted);

      setSession(s);
      // Ambil nama breeder dari profiles untuk default breederName
      const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', authUser.id).single();
      const defaultBreeder = prof?.full_name || '';

      // Hitung start index dari jumlah anakan sebelumnya
      const initIdx = (s.offspring_count || 0) + 1;
      setRows([emptyRow(s.session_code, initIdx, defaultBreeder)]);
      setLoading(false);
    };
    init();
  }, [authUser, sessionId, router]);

  const addRow = () => {
    if (!session) return;
    setRows(prev => {
      const maxInRows = prev.length > 0
        ? Math.max(...prev.map(r => parseInt(r.id.split('-').pop() || '0')))
        : (session.offspring_count || 0);
      return [...prev, emptyRow(session.session_code, maxInRows + 1, prev[0]?.breederName || '')];
    });
  };

  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i));

  const updateRow = (i: number, field: keyof OffspringRow, value: any) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };

  const uploadPhoto = async (file: File): Promise<{ publicUrl: string, fileName: string }> => {
    const ext = file.name.split('.').pop();
    const fileName = `photos/${Date.now()}-${Math.random()}.${ext}`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'koi-assets');
    formData.append('fileName', fileName);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const upData = await res.json();
    if (!res.ok) throw new Error(upData.error || 'Gagal upload file');
    return { publicUrl: upData.publicUrl, fileName };
  };

  const handleBatchMint = async () => {
    const pending = rows.filter(r => r.status === 'pending');
    if (pending.length === 0) return toast.error('Tidak ada anakan untuk di-mint.');
    if (!account) return toast.error('Hubungkan Wallet terlebih dahulu!');

    const invalid = rows.findIndex(r => r.status === 'pending' && ((r.variety === 'Lainnya' ? !r.customVariety?.trim() : !r.variety.trim()) || !r.size));
    if (invalid !== -1) { toast.error(`Baris ${invalid + 1}: Varietas dan Ukuran wajib diisi.`); return; }

    if (!confirm(`Mint ${pending.length} anakan ke Blockchain? Proses ini tidak dapat dibatalkan.`)) return;

    setMinting(true);

    // [BARU] Otomatis mendaftarkan dompet (Lazy Granting)
    try {
      const grantRes = await fetch('/api/web3/grant-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: account })
      });
      const grantData = await grantRes.json();
      if (!grantRes.ok) {
        throw new Error(grantData.error || 'Gagal memberikan izin Minting');
      }
      if (grantData.granted) {
        toast.success("Dompet berhasil didaftarkan sebagai Minter!");
      }
    } catch (err: any) {
      toast.error(err.message);
      setMinting(false);
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const fatherIds = session.spawning_fathers?.map((f: any) => f.father_koi_id).join(',') || '';

    let successCount = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.status !== 'pending') continue;

      updateRow(i, 'status', 'minting');
      let uploadedFileName = "";
      try {
        const finalVariety = row.variety === 'Lainnya' ? (row.customVariety || 'Lainnya') : row.variety;
        let photoUrl = "";
        if (row.photo) {
          const upRes = await uploadPhoto(row.photo);
          photoUrl = upRes.publicUrl;
          uploadedFileName = upRes.fileName;
        }

        // Parameter order: id, variety, breeder, gender, age, size, condition, photo, cert, contest, fatherId, motherId, note
        const tx = await contract.mintCertificate(
          row.id,
          finalVariety,
          row.breederName,
          row.gender,
          row.age,                       // umur anakan
          parseInt(row.size),
          row.condition,
          photoUrl,
          '',                            // cert
          '',                            // contest
          fatherIds,                     // fatherId
          session.mother_koi_id || '',   // motherId
          (row.condition ? `Kondisi: ${row.condition} | ` : "") + (row.note || "Hasil Batch Minting") // note
        );
        await tx.wait();
        updateRow(i, 'status', 'done');
        updateRow(i, 'txHash', tx.hash);
        // Simpan ke koi_certificates via API (gunakan photoUrl yang sama)
        await fetch('/api/sync-minting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            koiId: row.id,
            breederIdOverride: session.breeder_id,
            walletAddress: account,
            variety: finalVariety,
            size: row.size,
            photoUrl: photoUrl,
            spawningSessionId: session.id
          })
        });
        successCount++;
        setDoneCount(d => d + 1);
      } catch (err: any) {
        if (uploadedFileName) {
          await fetch('/api/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bucket: 'koi-assets', fileNames: [uploadedFileName] })
          });
        }
        updateRow(i, 'status', 'error');
        toast.error(`Gagal mint ${row.id}: ${err.reason || err.message}`);
      }
    }

    // Update offspring_count di sesi via API
    await fetch('/api/sync-spawning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_count',
        payload: { session_id: session.id, successCount }
      })
    });

    setMinting(false);
    if (successCount > 0) {
      toast.success(`${successCount} anakan berhasil di-mint! 🎉`);
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'done') return <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">✅ Done</span>;
    if (status === 'minting') return <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Minting...</span>;
    if (status === 'error') return <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">❌ Gagal</span>;
    return <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">Pending</span>;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-300" size={32} /></div>;

  const allDone = rows.length > 0 && rows.every(r => r.status === 'done');

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <Link href="/minting/spawning" className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition mb-6 w-fit group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Sesi Pemijahan
        </Link>

        {/* Info Sesi */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="font-black text-xl font-mono text-orange-600">{session.session_code}</span>
                <span className="text-sm text-gray-400">{new Date(session.spawn_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5"><Fish size={14} className="text-blue-400" /> Ibu: <strong className="font-mono">{session.mother_koi_id || '-'}</strong></span>
                <span className="flex items-center gap-1.5"><Fish size={14} className="text-green-400" />
                  Ayah: {session.spawning_fathers?.length > 0
                    ? session.spawning_fathers.map((f: any) => <strong key={f.father_koi_id} className="font-mono ml-1 bg-green-50 border border-green-100 px-1.5 rounded">{f.father_koi_id}</strong>)
                    : '-'}
                </span>
                {session.location && <span className="flex items-center gap-1.5">📍 {session.location}</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-black text-orange-600">{doneCount + (session.offspring_count || 0)}</div>
              <div className="text-xs text-gray-400">Total Anakan</div>
            </div>
          </div>
        </div>

        {/* Wallet Warning */}
        {!account && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
            <p className="text-amber-700 text-sm font-medium">⚠️ Hubungkan wallet untuk mulai mencetak sertifikat.</p>
            <button onClick={() => connectWallet()} className="px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 transition shrink-0">Connect Wallet</button>
          </div>
        )}

        {/* Progress Bar */}
        {minting && (
          <div className="bg-white border border-orange-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-bold text-orange-700">Minting berjalan...</span>
              <span className="text-gray-500">{doneCount} / {rows.filter(r => r.status !== 'error').length}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${(doneCount / rows.length) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Tabel Anakan */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><Baby size={18} className="text-orange-500" /> Daftar Anakan ({rows.length})</h2>
            <button onClick={addRow} disabled={minting} className="flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:text-orange-700 disabled:opacity-50">
              <Plus size={15} /> Tambah Baris
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-600 whitespace-nowrap">ID Koi</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Varietas *</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Breeder *</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Gender</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Umur</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Ukuran (cm)*</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Kondisi</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Catatan</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Foto</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row, i) => (
                  <tr key={i} className={`${row.status === 'done' ? 'bg-green-50/50' : row.status === 'error' ? 'bg-red-50/50' : row.status === 'minting' ? 'bg-orange-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <input value={row.id} onChange={e => updateRow(i, 'id', e.target.value)} disabled={row.status !== 'pending'}
                        className="w-36 px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-400 disabled:bg-gray-50 disabled:text-gray-400" />
                    </td>
                    <td className="px-4 py-3">
                      <select value={row.variety} onChange={e => updateRow(i, 'variety', e.target.value)} disabled={row.status !== 'pending'}
                        className="w-32 px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-400 disabled:bg-gray-50 disabled:text-gray-400">
                        <option value="">Pilih Varietas...</option>
                        <option value="Kohaku">Kohaku</option>
                        <option value="Taisho Sanke">Taisho Sanke</option>
                        <option value="Showa Sanshoku">Showa Sanshoku</option>
                        <option value="Shiro Utsuri">Shiro Utsuri</option>
                        <option value="Hi Utsuri">Hi Utsuri</option>
                        <option value="Utsurimono">Utsurimono (Lainnya)</option>
                        <option value="Asagi">Asagi</option>
                        <option value="Shusui">Shusui</option>
                        <option value="Koromo">Koromo</option>
                        <option value="Goshiki">Goshiki</option>
                        <option value="Kawarimono">Kawarimono</option>
                        <option value="Hikarimono">Hikarimono / Ogon</option>
                        <option value="Hikari Moyo">Hikari Moyo</option>
                        <option value="Hikari Utsuri">Hikari Utsuri</option>
                        <option value="Kinginrin">Kinginrin</option>
                        <option value="Tancho">Tancho</option>
                        <option value="Doitsu">Doitsu</option>
                        <option value="Lainnya">Lainnya (Ketik Sendiri)</option>
                      </select>
                      {row.variety === 'Lainnya' && (
                        <input value={row.customVariety || ''} onChange={e => updateRow(i, 'customVariety', e.target.value)} placeholder="Ketik jenis baru..." disabled={row.status !== 'pending'}
                          className="w-32 mt-2 px-2 py-1.5 border border-orange-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-400" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input value={row.breederName} onChange={e => updateRow(i, 'breederName', e.target.value)} placeholder="Nama breeder..." disabled={row.status !== 'pending'}
                        className="w-32 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-400 disabled:bg-gray-50 disabled:text-gray-400" />
                    </td>
                    <td className="px-4 py-3">
                      <select value={row.gender} onChange={e => updateRow(i, 'gender', e.target.value)} disabled={row.status !== 'pending'}
                        className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-400 disabled:bg-gray-50">
                        <option>Tidak Diketahui</option>
                        <option>Jantan</option>
                        <option>Betina</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input value={row.age} onChange={e => updateRow(i, 'age', e.target.value)} placeholder="Tosai, Nisai..." disabled={row.status !== 'pending'}
                        className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-400 disabled:bg-gray-50 disabled:text-gray-400" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" value={row.size} onChange={e => updateRow(i, 'size', e.target.value)} placeholder="cm" disabled={row.status !== 'pending'}
                        className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-400 disabled:bg-gray-50 disabled:text-gray-400" />
                    </td>
                    <td className="px-4 py-3">
                      <input value={row.condition} onChange={e => updateRow(i, 'condition', e.target.value)} placeholder="Sehat, Bulky..." disabled={row.status !== 'pending'}
                        className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-400 disabled:bg-gray-50 disabled:text-gray-400" />
                    </td>
                    <td className="px-4 py-3">
                      <input value={row.note} onChange={e => updateRow(i, 'note', e.target.value)} placeholder="Catatan tambahan..." disabled={row.status !== 'pending'}
                        className="w-32 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-400 disabled:bg-gray-50 disabled:text-gray-400" />
                    </td>
                    <td className="px-4 py-3">
                      {row.status === 'pending' ? (
                        <label className="cursor-pointer flex items-center gap-1 text-xs text-orange-600 font-bold hover:text-orange-700">
                          <Upload size={13} />
                          {row.photo ? <span className="text-green-600 truncate max-w-[80px]">{row.photo.name}</span> : 'Upload'}
                          <input type="file" accept="image/*" className="hidden" onChange={e => updateRow(i, 'photo', e.target.files?.[0] || null)} />
                        </label>
                      ) : row.photo ? <span className="text-green-600 text-xs">✅</span> : <span className="text-gray-300 text-xs">-</span>}
                    </td>
                    <td className="px-4 py-3">{statusBadge(row.status)}</td>
                    <td className="px-4 py-3">
                      {row.status === 'pending' && rows.length > 1 && (
                        <button onClick={() => removeRow(i)} className="p-1 text-red-400 hover:text-red-600 transition"><Trash2 size={14} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-gray-400">* Field wajib diisi. Foto bisa diupdate nanti.</p>
          {allDone ? (
            <div className="flex items-center gap-2 text-green-600 font-bold">
              <CheckCircle size={20} /> Semua berhasil di-mint!
            </div>
          ) : (
            <button onClick={handleBatchMint} disabled={minting || !account}
              className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition shadow-lg">
              {minting ? <><Loader2 size={18} className="animate-spin" /> Minting {doneCount}/{rows.length}...</> : <><Baby size={18} /> Mint Semua Anakan</>}
            </button>
          )}
        </div>

        {/* RIWAYAT ANAKAN (YANG SUDAH DI-MINT) */}
        {mintedKois.length > 0 && (
          <div className="mt-10 bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden mb-6">
            <div className="flex items-center px-6 py-4 border-b border-green-100 bg-green-50">
              <h2 className="font-bold text-green-900 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600" /> Riwayat Anakan di Sesi Ini ({mintedKois.length})
              </h2>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left whitespace-nowrap relative">
                <thead className="bg-white sticky top-0 z-10 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 border-b border-gray-100">ID Koi</th>
                    <th className="px-6 py-4 border-b border-gray-100">Varietas</th>
                    <th className="px-6 py-4 border-b border-gray-100">Ukuran</th>
                    <th className="px-6 py-4 border-b border-gray-100">Waktu Minting</th>
                    <th className="px-6 py-4 border-b border-gray-100 text-center">Foto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {mintedKois.map((koi, i) => (
                    <tr key={i} className="hover:bg-green-50/50 transition">
                      <td className="px-6 py-4 text-sm font-bold font-mono text-gray-900">
                        <Link href={`/koi/${koi.koi_id}`} className="hover:text-green-600 hover:underline">{koi.koi_id}</Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{koi.variety}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{koi.size} cm</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(koi.minted_at || koi.updated_at).toLocaleString('id-ID', {day: 'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</td>
                      <td className="px-6 py-4 text-center">
                        {koi.photo_url ? (
                          <a href={koi.photo_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg">Lihat</a>
                        ) : <span className="text-gray-300">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
