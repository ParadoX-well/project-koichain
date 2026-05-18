'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, ArrowLeft, FileText, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import Navbar from "@/components/Navbar";
import { useWallet } from '@/context/WalletContext';

export default function VerifyKtpPage() {
  const { account } = useWallet();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Ambil Data saat load
  useEffect(() => {
    if (account) fetchPendingUsers();
  }, [account]);

  const fetchPendingUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('verification_status', 'pending');

    if (error) toast.error("Gagal ambil data");
    else setCandidates(data || []);
    setLoading(false);
  };

  const updateStatus = async (userId: string, newStatus: 'verified' | 'rejected') => {
    if (!confirm(newStatus === 'verified' ? "Terima user ini?" : "Tolak user ini?")) return;

    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: newStatus })
      .eq('id', userId);

    if (error) toast.error("Gagal update");
    else {
      toast.success(newStatus === 'verified' ? "User Di-ACC!" : "User Ditolak.");
      fetchPendingUsers();
    }
  };

  if (!account) return <div className="p-10 text-center">Silakan Connect Wallet di Navbar dulu.</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <Toaster position="top-center" />

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
             <Link href="/admin" className="text-sm text-gray-500 hover:text-orange-600 flex items-center gap-1 mb-4">
                <ArrowLeft size={16} /> Kembali ke Admin Dashboard
            </Link>
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="text-orange-600" />
                Permintaan Verifikasi KTP
            </h2>
            <p className="text-gray-500">Daftar user yang menunggu validasi identitas.</p>
        </div>

        {loading ? (
            <div className="text-center py-10 text-gray-500 flex justify-center gap-2"><Loader2 className="animate-spin"/> Memuat data...</div>
        ) : candidates.length === 0 ? (
            <div className="bg-white p-10 rounded-xl border border-gray-200 text-center shadow-sm">
                <p className="text-gray-500">Tidak ada permintaan verifikasi baru.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-6">
                {candidates.map((user) => (
                    <div key={user.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6">
                        {/* Kolom Kiri: Foto KTP */}
                        <div className="w-full md:w-1/3">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Foto KTP</p>
                            <div className="relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-100 aspect-video">
                                <a href={user.ktp_url} target="_blank" rel="noreferrer">
                                    <img src={user.ktp_url} alt="KTP" className="w-full h-full object-cover hover:scale-105 transition duration-500"/>
                                </a>
                            </div>
                        </div>
                        {/* Kolom Tengah: Data */}
                        <div className="flex-grow space-y-3">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Nama Lengkap</p>
                                <p className="text-lg font-bold text-gray-900">{user.full_name}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Status</p>
                                <span className="inline-block mt-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200">
                                    {user.verification_status}
                                </span>
                            </div>
                        </div>
                        {/* Kolom Kanan: Aksi */}
                        <div className="flex flex-row md:flex-col justify-center gap-3 pt-4 md:pt-0">
                            <button onClick={() => updateStatus(user.id, 'verified')} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-bold transition w-full">
                                <CheckCircle size={18} /> Terima
                            </button>
                            <button onClick={() => updateStatus(user.id, 'rejected')} className="flex items-center justify-center gap-2 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 px-5 py-3 rounded-lg font-bold transition w-full">
                                <XCircle size={18} /> Tolak
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
}