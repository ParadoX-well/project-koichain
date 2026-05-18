'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, XCircle, FileText, Mail, CheckCircle, Clock, AlertTriangle, Filter } from 'lucide-react';
import Navbar from "@/components/Navbar";
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null); // Untuk modal detail
  const [filterStatus, setFilterStatus] = useState<string>('all'); // State untuk filter

  // Fetch Reports
  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Gagal mengambil data laporan.");
    } else {
      setReports(data || []);
      setFilteredReports(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Filter Effect
  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter(r => r.status === filterStatus));
    }
  }, [filterStatus, reports]);

  // Update Status Laporan
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    // 1. Update Optimistic (Ubah tampilan dulu biar cepat)
    const previousReports = [...reports];
    
    // Update state lokal list utama
    const updatedReports = reports.map(r => r.id === id ? { ...r, status: newStatus } : r);
    setReports(updatedReports);
    
    // Update state lokal modal (jika sedang dibuka)
    if (selectedReport && selectedReport.id === id) {
        setSelectedReport({ ...selectedReport, status: newStatus });
    }

    // 2. Kirim ke Database
    const { error } = await supabase
      .from('reports')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      // Jika gagal, kembalikan ke status awal (Rollback)
      console.error(error);
      toast.error("Gagal update status di database: " + error.message);
      setReports(previousReports);
    } else {
      toast.success(`Status berhasil diubah menjadi ${newStatus}`);
    }
  };

  // Helper Warna Status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200 flex items-center gap-1 w-fit"><CheckCircle size={12}/> Selesai</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200 flex items-center gap-1 w-fit"><XCircle size={12}/> Ditolak</span>;
      case 'in_progress': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-200 flex items-center gap-1 w-fit"><Clock size={12}/> Diproses</span>;
      default: return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold border border-yellow-200 flex items-center gap-1 w-fit"><AlertTriangle size={12}/> Baru</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <Toaster position="top-center" />

      <main className="max-w-6xl mx-auto px-4 py-10">
        
        <Link href="/admin" className="flex items-center gap-2 text-gray-500 mb-6 hover:text-orange-600 transition w-fit">
            <ArrowLeft size={18}/> Kembali ke Dashboard
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Pusat Laporan & Pengaduan</h1>
                <p className="text-gray-500">Kelola laporan yang masuk dari pengguna.</p>
            </div>
            
            {/* Filter Buttons */}
            <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex flex-wrap gap-1">
                <button 
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${filterStatus === 'all' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Semua
                </button>
                <button 
                    onClick={() => setFilterStatus('open')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${filterStatus === 'open' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <AlertTriangle size={12}/> Baru
                </button>
                <button 
                    onClick={() => setFilterStatus('in_progress')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${filterStatus === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Clock size={12}/> Diproses
                </button>
                <button 
                    onClick={() => setFilterStatus('resolved')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${filterStatus === 'resolved' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <CheckCircle size={12}/> Selesai
                </button>
                <button 
                    onClick={() => setFilterStatus('rejected')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${filterStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <XCircle size={12}/> Ditolak
                </button>
            </div>
        </div>

        {/* TABEL LAPORAN */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4 font-bold">Tanggal</th>
                            <th className="px-6 py-4 font-bold">Pelapor</th>
                            <th className="px-6 py-4 font-bold">Masalah</th>
                            <th className="px-6 py-4 font-bold">Status</th>
                            <th className="px-6 py-4 font-bold text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-10 text-center text-gray-400">Memuat data...</td></tr>
                        ) : filteredReports.length === 0 ? (
                            <tr><td colSpan={5} className="p-10 text-center text-gray-400">Tidak ada laporan dengan status ini.</td></tr>
                        ) : (
                            filteredReports.map((report) => (
                                <tr key={report.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => setSelectedReport(report)}>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                        {new Date(report.created_at).toLocaleDateString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 flex items-center gap-1"><Mail size={12}/> {report.contact_info}</span>
                                            <span className="text-xs text-gray-400">ID: {report.user_id ? report.user_id.slice(0,6)+'...' : 'Guest'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800 line-clamp-1">{report.title}</div>
                                        <span className="text-xs text-gray-500 capitalize">{report.category}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(report.status)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-blue-600 hover:text-blue-800 font-bold text-xs underline">Detail</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </main>

      {/* MODAL DETAIL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative border border-gray-200 max-h-[90vh] flex flex-col">
                
                {/* Header Modal */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Detail Laporan</h3>
                        <p className="text-xs text-gray-500">ID: {selectedReport.id}</p>
                    </div>
                    <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-600 transition hover:bg-gray-200 p-1 rounded-full"><XCircle size={24}/></button>
                </div>

                {/* Isi Modal */}
                <div className="p-6 overflow-y-auto space-y-6">
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-gray-400 text-xs font-bold uppercase mb-1">Kategori</span>
                            <span className="font-medium capitalize">{selectedReport.category}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-gray-400 text-xs font-bold uppercase mb-1">Status Saat Ini</span>
                            {getStatusBadge(selectedReport.status)}
                        </div>
                        <div className="col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                             <span className="block text-gray-400 text-xs font-bold uppercase mb-1">Kontak Pelapor</span>
                             <span className="font-mono text-blue-600 text-base">{selectedReport.contact_info}</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-2 border-b pb-2">Judul: {selectedReport.title}</h4>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                            {selectedReport.description}
                        </div>
                    </div>

                    {selectedReport.evidence_url && (
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><FileText size={16}/> Bukti Lampiran</h4>
                            <a href={selectedReport.evidence_url} target="_blank" className="block relative h-64 bg-gray-100 rounded-xl overflow-hidden border border-gray-300 group">
                                <img src={selectedReport.evidence_url} className="w-full h-full object-contain" alt="Bukti" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 transition cursor-pointer">
                                    Klik untuk Memperbesar Gambar
                                </div>
                            </a>
                        </div>
                    )}

                </div>

                {/* Footer Modal (Aksi) */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 flex-wrap">
                    <button 
                        onClick={() => handleUpdateStatus(selectedReport.id, 'in_progress')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition shadow-sm"
                    >
                        Tandai Diproses
                    </button>
                    <button 
                        onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition shadow-sm"
                    >
                        Selesai
                    </button>
                    <button 
                        onClick={() => handleUpdateStatus(selectedReport.id, 'rejected')}
                        className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-50 transition shadow-sm"
                    >
                        Tolak Laporan
                    </button>
                </div>

            </div>
        </div>
      )}

    </div>
  );
}