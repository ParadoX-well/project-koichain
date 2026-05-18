'use client';

import { useWallet } from '@/context/WalletContext';
import { Wallet, Users, Send, Database, ArrowRight, ShieldAlert, Activity, Search, MessageSquareWarning } from 'lucide-react';
import Link from 'next/link';
import Navbar from "@/components/Navbar";

export default function AdminDashboard() {
  const { account, connectWallet, isAdmin } = useWallet();

  // Proteksi: Tampilan jika User BUKAN Admin (atau belum connect)
  if (!account || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
        <div className="relative z-50">
            <Navbar /> 
        </div>
        
        <div className="flex-grow flex flex-col items-center justify-center p-4 text-center z-0">
            <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-200 max-w-md">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="text-red-600 w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Dibatasi</h1>
                <p className="text-gray-500 mb-8">
                    {account ? "Wallet terhubung tapi bukan Admin." : "Khusus Administrator. Silakan hubungkan Wallet Admin Anda."}
                </p>
                {!account && (
                    <button onClick={connectWallet} className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white px-6 py-4 rounded-xl font-bold text-lg transition shadow-lg cursor-pointer relative z-10">
                        <Wallet size={24} /> Hubungkan Wallet
                    </button>
                )}
            </div>
        </div>
      </div>
    );
  }

  // Tampilan Dashboard (Jika Admin)
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <div className="relative z-50">
        <Navbar />
      </div>

      <main className="max-w-6xl mx-auto px-4 py-12 relative z-0">
        <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500">Halo Admin, wallet terhubung: <span className="font-mono bg-gray-200 px-2 py-1 rounded text-sm text-gray-700">{account}</span></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 1. KELOLA PENGGUNA */}
            <Link href="/admin/users" className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-pink-200 transition duration-300">
                <div className="bg-pink-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-pink-600 transition">
                    <Users className="text-pink-600 w-7 h-7 group-hover:text-white transition" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Kelola Pengguna</h3>
                <p className="text-gray-500 text-sm mb-6">Manajemen Mitra (Breeder/Seller), Verifikasi Request Role, dan Ban User.</p>
                <div className="flex items-center text-pink-600 font-bold text-sm group-hover:translate-x-2 transition">
                    Buka Menu <ArrowRight size={16} className="ml-2" />
                </div>
            </Link>

             {/* 2. MINTING BLOCKCHAIN */}
             <Link href="/minting" className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-purple-200 transition duration-300">
                <div className="bg-purple-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition">
                    <Database className="text-purple-600 w-7 h-7 group-hover:text-white transition" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Minting Blockchain</h3>
                <p className="text-gray-500 text-sm mb-6">Terbitkan sertifikat baru langsung ke jaringan Ethereum (Bypass).</p>
                <div className="flex items-center text-purple-600 font-bold text-sm group-hover:translate-x-2 transition">
                    Mulai Minting <ArrowRight size={16} className="ml-2" />
                </div>
            </Link>

            {/* 3. TRANSFER ASET */}
            <Link href="/admin/transfer" className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-green-200 transition duration-300">
                <div className="bg-green-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition">
                    <Send className="text-green-600 w-7 h-7 group-hover:text-white transition" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Transfer Aset</h3>
                <p className="text-gray-500 text-sm mb-6">Pindahkan hak milik sertifikat ke wallet pembeli atau pemilik baru.</p>
                <div className="flex items-center text-green-600 font-bold text-sm group-hover:translate-x-2 transition">
                    Mulai Transfer <ArrowRight size={16} className="ml-2" />
                </div>
            </Link>

            {/* 4. UPDATE PERTUMBUHAN */}
            <Link href="/admin/update-koi" className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-cyan-200 transition duration-300">
                <div className="bg-cyan-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cyan-600 transition">
                    <Activity className="text-cyan-600 w-7 h-7 group-hover:text-white transition" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Update Pertumbuhan</h3>
                <p className="text-gray-500 text-sm mb-6">Perbarui ukuran, umur, atau foto terkini dari ikan yang sudah terdaftar.</p>
                <div className="flex items-center text-cyan-600 font-bold text-sm group-hover:translate-x-2 transition">
                    Mulai Update <ArrowRight size={16} className="ml-2" />
                </div>
            </Link>

            {/* 5. CEK VALIDITAS */}
            <Link href="/check" className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-teal-200 transition duration-300">
                <div className="bg-teal-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-teal-600 transition">
                    <Search className="text-teal-600 w-7 h-7 group-hover:text-white transition" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Cek & Riwayat</h3>
                <p className="text-gray-500 text-sm mb-6">Lihat sertifikat digital, keaslian, dan rekam jejak (traceability) ikan.</p>
                <div className="flex items-center text-teal-600 font-bold text-sm group-hover:translate-x-2 transition">
                    Cek Sekarang <ArrowRight size={16} className="ml-2" />
                </div>
            </Link>

            {/* 6. MANAJEMEN LAPORAN (BARU) */}
            <Link href="/admin/reports" className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-orange-200 transition duration-300">
                <div className="bg-orange-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-600 transition">
                    <MessageSquareWarning className="text-orange-600 w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Laporan User</h3>
                <p className="text-gray-500 text-sm mb-6">Cek pengaduan penipuan, bug, atau masalah lainnya dari pengguna.</p>
                <div className="flex items-center text-orange-600 font-bold text-sm group-hover:translate-x-2 transition">
                    Cek Laporan <ArrowRight size={16} className="ml-2" />
                </div>
            </Link>

        </div>
      </main>
    </div>
  );
}