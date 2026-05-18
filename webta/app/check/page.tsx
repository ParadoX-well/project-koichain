'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, QrCode } from 'lucide-react';
import Navbar from "@/components/Navbar";

export default function CheckCertificatePage() {
  const router = useRouter();
  const [searchId, setSearchId] = useState('');

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      // Langsung arahkan ke halaman detail dinamis
      // Di halaman itulah data + traceability akan ditampilkan
      router.push(`/koi/${encodeURIComponent(searchId.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center text-center">
        
        <div className="bg-white p-6 rounded-full bg-orange-100 mb-6">
            <QrCode size={48} className="text-orange-600" />
        </div>

        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Cek Keaslian & Traceability</h1>
        <p className="text-gray-500 mb-10 max-w-lg">
          Masukkan ID Koi atau Hash Transaksi untuk melihat sertifikat digital dan rekam jejak kepemilikan di Blockchain.
        </p>

        <form onSubmit={handleCheck} className="w-full max-w-lg relative">
            <input 
                type="text" 
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Masukkan ID Koi (Contoh: KOI-2025-888)" 
                className="w-full pl-6 pr-14 py-5 rounded-full border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none text-lg shadow-sm transition"
            />
            <button 
                type="submit"
                className="absolute right-2 top-2 bottom-2 bg-orange-600 text-white px-6 rounded-full hover:bg-orange-700 transition shadow-md font-bold"
            >
                Cek
            </button>
        </form>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">1. Input ID</h3>
                <p className="text-sm text-gray-500">Ketik kode unik yang tertera pada sertifikat fisik atau scan QR Code.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">2. Validasi Blockchain</h3>
                <p className="text-sm text-gray-500">Sistem akan mencari data di jaringan Ethereum Localhost secara real-time.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">3. Lihat Riwayat</h3>
                <p className="text-sm text-gray-500">Cek spesifikasi ikan dan sejarah perpindahan kepemilikannya.</p>
            </div>
        </div>

      </main>
    </div>
  );
}