'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, ArrowLeft, Fish, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import Navbar from "@/components/Navbar";
import { useWallet } from '@/context/WalletContext';

export default function VerifyKoiPage() {
  const { account } = useWallet();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) fetchRequests();
  }, [account]);

  const fetchRequests = async () => {
    setLoading(true);
    // Ambil data dari tabel certification_requests yang pending
    const { data, error } = await supabase
      .from('certification_requests')
      .select('*')
      .eq('status', 'pending');

    if (error) toast.error("Gagal ambil data koi");
    else setRequests(data || []);
    setLoading(false);
  };

  const updateRequest = async (id: string, newStatus: 'approved' | 'rejected') => {
    if (!confirm(newStatus === 'approved' ? "Setujui sertifikat ini?" : "Tolak sertifikat ini?")) return;

    const { error } = await supabase
      .from('certification_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) toast.error("Gagal update database");
    else {
      toast.success(newStatus === 'approved' ? "Sertifikat Disetujui!" : "Sertifikat Ditolak.");
      fetchRequests();
    }
  };

  if (!account) return <div className="p-10 text-center">Silakan Connect Wallet di Navbar dulu.</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <Toaster position="top-center" />

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
             <Link href="/admin" className="text-sm text-gray-500 hover:text-orange-600 flex items-center gap-1 mb-4">
                <ArrowLeft size={16} /> Kembali ke Admin Dashboard
            </Link>
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Fish className="text-blue-600" />
                Permintaan Sertifikasi Ikan Koi
            </h2>
            <p className="text-gray-500">Validasi data fisik ikan sebelum dicatat ke Blockchain.</p>
        </div>

        {loading ? (
            <div className="text-center py-10 text-gray-500 flex justify-center gap-2"><Loader2 className="animate-spin"/> Memuat data...</div>
        ) : requests.length === 0 ? (
            <div className="bg-white p-10 rounded-xl border border-gray-200 text-center shadow-sm">
                <p className="text-gray-500">Tidak ada pengajuan sertifikat baru.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-6">
                {requests.map((req) => (
                    <div key={req.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6">
                        
                        {/* Foto Ikan */}
                        <div className="w-full md:w-1/4">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Foto Ikan</p>
                            <div className="relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-100 aspect-square">
                                <a href={req.photo_url} target="_blank" rel="noreferrer">
                                    <img src={req.photo_url} alt="Koi" className="w-full h-full object-cover hover:scale-105 transition duration-500"/>
                                </a>
                            </div>
                        </div>

                        {/* Detail Ikan */}
                        <div className="flex-grow grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <p className="text-xs font-bold text-gray-400 uppercase">Nama Pemilik</p>
                                <p className="text-lg font-bold text-gray-900">{req.applicant_name}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Varietas</p>
                                <p className="font-medium text-gray-800">{req.koi_variety}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Pola Warna</p>
                                <p className="font-medium text-gray-800">{req.color_pattern}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs font-bold text-gray-400 uppercase">Tanggal Pengajuan</p>
                                <p className="text-sm text-gray-600">{new Date(req.created_at).toLocaleDateString('id-ID')}</p>
                            </div>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex flex-row md:flex-col justify-center gap-3 md:min-w-[150px]">
                            <button onClick={() => updateRequest(req.id, 'approved')} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-bold transition w-full shadow-sm">
                                <CheckCircle size={18} /> Setujui
                            </button>
                            <button onClick={() => updateRequest(req.id, 'rejected')} className="flex items-center justify-center gap-2 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 px-4 py-3 rounded-lg font-bold transition w-full">
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