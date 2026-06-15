'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Caught by Global Error Boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-red-100 max-w-md w-full animate-fade-in-up">
          <div className="bg-red-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertOctagon className="text-red-500 w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4">Waduh! Terjadi Kesalahan</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Sistem kami mengalami gangguan tidak terduga atau koneksi jaringan terputus. Jangan panik, data Anda aman.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => reset()}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition shadow-lg"
            >
              <RotateCcw size={20} />
              Coba Lagi
            </button>
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
