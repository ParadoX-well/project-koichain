import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function BannedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navbar />

      <div className="flex-grow flex flex-col items-center justify-center p-4 text-center z-0">
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-200 max-w-md">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="text-red-600 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Akun Ditangguhkan</h1>
          <p className="text-gray-500 mb-8">
            Mohon maaf, akses akun Anda telah ditangguhkan sementara waktu atau secara permanen karena adanya indikasi pelanggaran kebijakan kami.
          </p>
          <Link href="/report" className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white px-6 py-4 rounded-xl font-bold text-lg transition shadow-lg relative z-10">
            Hubungi Dukungan
          </Link>
        </div>
      </div>
    </div>
  );
}
