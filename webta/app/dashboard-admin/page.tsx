'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { supabase } from '@/lib/supabase';
import { Wallet, Users, Send, Database, ArrowRight, ShieldAlert, Activity, Search, MessageSquareWarning, PenLine, BookOpen, Eye, Baby, Compass, Store, Newspaper, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Navbar from "@/components/Navbar";

export default function AdminDashboard() {
    const { account, connectWallet, isAdmin } = useWallet();
    const [pendingUsers, setPendingUsers] = useState(0);
    const [pendingReports, setPendingReports] = useState(0);

    useEffect(() => {
        if (!isAdmin) return;
        const fetchData = async () => {
            const { data: roleReqs } = await supabase
                .from('profiles')
                .select('id')
                .not('role_request', 'is', null)
                .eq('role', 'user');
            if (roleReqs) setPendingUsers(roleReqs.length);

            const { data: repReqs } = await supabase
                .from('reports')
                .select('id')
                .eq('status', 'pending');
            if (repReqs) setPendingReports(repReqs.length);
        };
        fetchData();
    }, [isAdmin]);

    // Proteksi: Tampilan jika User BUKAN Admin (atau belum connect)
    if (!account || !isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
                    <Navbar />

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
                            <button onClick={() => connectWallet()} className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white px-6 py-4 rounded-xl font-bold text-lg transition shadow-lg cursor-pointer relative z-10">
                                <Wallet size={24} /> Hubungkan Wallet
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
                <Navbar />

            <main className="max-w-6xl mx-auto px-4 py-12 relative z-0">
                {/* Header */}
                <div className="mb-10">
                        <p className="text-sm font-bold text-red-600 uppercase tracking-widest mb-1">DASHBOARD ADMIN</p>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Selamat datang, Admin 👋
                        </h1>
                    <p className="text-gray-500 mt-1">Kelola seluruh sistem dan operasional KoiChain dari sini.</p>
                    <p className="text-sm text-gray-400 mt-1">Wallet terhubung: <span className="font-mono bg-gray-200 px-2 py-0.5 rounded text-gray-600">{account}</span></p>
                </div>

                {/* BANNER NOTIFIKASI ADMIN */}
                {(pendingUsers > 0 || pendingReports > 0) && (
                    <div className="mb-10 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in-up">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                <AlertTriangle className="text-red-600 w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-red-800">Menunggu Tindakan Anda</h3>
                                <p className="text-red-600 text-sm mt-1 font-medium">
                                    Terdapat {pendingUsers > 0 ? `${pendingUsers} Pengajuan Mitra Baru ` : ''} 
                                    {pendingUsers > 0 && pendingReports > 0 ? 'dan ' : ''} 
                                    {pendingReports > 0 ? `${pendingReports} Laporan User ` : ''}
                                    yang perlu segera ditinjau.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto shrink-0">
                            {pendingUsers > 0 && (
                                <Link href="/dashboard-admin/users" className="flex-1 md:flex-none text-center bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition">
                                    Cek Pengajuan
                                </Link>
                            )}
                            {pendingReports > 0 && (
                                <Link href="/dashboard-admin/reports" className="flex-1 md:flex-none text-center bg-white border border-red-200 hover:bg-red-50 text-red-700 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition">
                                    Cek Laporan
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                {/* --- SEKSI 1: OPERASIONAL BLOCKCHAIN --- */}
                <div className="mb-10">
                    <div className="mb-6 border-b border-gray-200 pb-4">
                        <h2 className="text-xl font-bold text-gray-900">Operasional Blockchain</h2>
                        <p className="text-gray-500 text-sm mt-1">Aksi langsung ke jaringan Ethereum.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* MINTING BLOCKCHAIN */}
                        <Link href="/minting" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-100 rounded-full blur-3xl opacity-50 group-hover:bg-purple-200 transition"></div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <Database className="text-purple-600 w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3">Minting Blockchain</h3>
                                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Terbitkan sertifikat baru langsung ke jaringan Ethereum (Bypass).</p>
                                <div className="flex items-center text-purple-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                                    Mulai Minting <ArrowRight size={18} className="ml-2" />
                                </div>
                            </div>
                        </Link>

                        {/* MENU 2: UPDATE KONDISI KOI */}
                        <Link href="/update-koi" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-100 rounded-full blur-3xl opacity-50 group-hover:bg-cyan-200 transition"></div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <Activity className="text-cyan-600 w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3">Update Pertumbuhan</h3>
                                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Perbarui ukuran, umur, atau foto terkini dari ikan yang sudah terdaftar.</p>
                                <div className="flex items-center text-cyan-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                                    Mulai Update <ArrowRight size={18} className="ml-2" />
                                </div>
                            </div>
                        </Link>

                        {/* MENU 3: TRANSFER KEPEMILIKAN */}
                        <Link href="/transfer" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-green-100 rounded-full blur-3xl opacity-50 group-hover:bg-green-200 transition"></div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <Send className="text-green-600 w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3">Transfer Aset</h3>
                                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Pindahkan hak milik sertifikat ke wallet pembeli atau pemilik baru.</p>
                                <div className="flex items-center text-green-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                                    Mulai Transfer <ArrowRight size={18} className="ml-2" />
                                </div>
                            </div>
                        </Link>

                        {/* SESI PEMIJAHAN */}
                        <Link href="/minting/spawning" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-100 rounded-full blur-3xl opacity-50 group-hover:bg-orange-200 transition"></div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <Baby className="text-orange-600 w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3">Sesi Pemijahan</h3>
                                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Kelola sesi pemijahan dan batch mint anakan dari indukan terdaftar.</p>
                                <div className="flex items-center text-orange-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                                    Kelola Sesi <ArrowRight size={18} className="ml-2" />
                                </div>
                            </div>
                        </Link>

                    </div>
                </div>

                {/* --- SEKSI 2: EKSPLORASI & KATALOG --- */}
                <div className="mb-10">
                    <div className="mb-6 border-b border-gray-200 pb-4">
                        <h2 className="text-xl font-bold text-gray-900">Eksplorasi & Katalog</h2>
                        <p className="text-gray-500 text-sm mt-1">Lihat koleksi aset, jelajahi galeri publik, dan temukan mitra resmi.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* KOLEKSI KOI */}
                        <Link href="/dashboard-mitra/collection" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50 group-hover:bg-blue-200 transition"></div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <BookOpen className="text-blue-600 w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3">Koleksi Koi</h3>
                                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Lihat semua sertifikat koi yang telah Anda terbitkan di platform ini.</p>
                                <div className="flex items-center text-blue-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                                    Lihat Koleksi <ArrowRight size={18} className="ml-2" />
                                </div>
                            </div>
                        </Link>

                        {/* JELAJAHI KOLEKSI PUBLIK */}
                        <Link href="/koi" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-sky-100 rounded-full blur-3xl opacity-50 group-hover:bg-sky-200 transition"></div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-sky-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <Compass className="text-sky-600 w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3">Jelajahi Semua Koleksi</h3>
                                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Jelajahi galeri publik untuk melihat semua data sertifikat koi yang terdaftar di blockchain.</p>
                                <div className="flex items-center text-sky-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                                    Jelajahi Sekarang <ArrowRight size={18} className="ml-2" />
                                </div>
                            </div>
                        </Link>

                        {/* KATALOG MITRA */}
                        <Link href="/mitra" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-50 group-hover:bg-indigo-200 transition"></div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <Store className="text-indigo-600 w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3">Katalog Mitra</h3>
                                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Jelajahi daftar seluruh mitra (Breeder & Seller) resmi yang terdaftar di KoiChain.</p>
                                <div className="flex items-center text-indigo-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                                    Lihat Mitra <ArrowRight size={18} className="ml-2" />
                                </div>
                            </div>
                        </Link>

                    </div>
                </div>

                {/* --- SEKSI 3: MANAJEMEN PLATFORM --- */}
                <div className="mb-10">
                    <div className="mb-6 border-b border-gray-200 pb-4">
                        <h2 className="text-xl font-bold text-gray-900">Manajemen Platform</h2>
                        <p className="text-gray-500 text-sm mt-1">Kelola pengguna, verifikasi, dan laporan masuk.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* KELOLA PENGGUNA */}
                        <Link href="/dashboard-admin/users" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-pink-100 rounded-full blur-3xl opacity-50 group-hover:bg-pink-200 transition"></div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <Users className="text-pink-600 w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3">Kelola Pengguna</h3>
                                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Manajemen Mitra (Breeder/Seller), Verifikasi Request Role, dan Ban User.</p>
                                <div className="flex items-center text-pink-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                                    Buka Menu <ArrowRight size={18} className="ml-2" />
                                </div>
                            </div>
                        </Link>

                        {/* CEK & RIWAYAT */}
                        <Link href="/check" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-100 rounded-full blur-3xl opacity-50 group-hover:bg-teal-200 transition"></div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <Search className="text-teal-600 w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3">Cek & Riwayat</h3>
                                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Lihat sertifikat digital, keaslian, dan rekam jejak (traceability) ikan.</p>
                                <div className="flex items-center text-teal-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                                    Cek Sekarang <ArrowRight size={18} className="ml-2" />
                                </div>
                            </div>
                        </Link>

                        {/* LAPORAN USER */}
                        <Link href="/dashboard-admin/reports" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-100 rounded-full blur-3xl opacity-50 group-hover:bg-rose-200 transition"></div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-rose-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <MessageSquareWarning className="text-rose-600 w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3">Laporan User</h3>
                                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Cek pengaduan penipuan, bug, atau masalah lainnya dari pengguna.</p>
                                <div className="flex items-center text-rose-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                                    Cek Laporan <ArrowRight size={18} className="ml-2" />
                                </div>
                            </div>
                        </Link>

                    </div>
                </div>

                {/* --- SEKSI 4: MANAJEMEN BERITA --- */}
                <div className="mb-10">
                    <div className="mb-6 border-b border-gray-200 pb-4">
                        <h2 className="text-xl font-bold text-gray-900">Manajemen Berita</h2>
                        <p className="text-gray-500 text-sm mt-1">Kelola konten berita yang tampil di halaman publik.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* TULIS BERITA BARU */}
                        <Link href="/dashboard-author/news/create" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-100 rounded-full blur-3xl opacity-50 group-hover:bg-red-200 transition"></div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <PenLine className="text-red-600 w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3">Tulis Berita Baru</h3>
                                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Buat dan terbitkan artikel berita baru seputar dunia Koi, kontes, atau tips perawatan.</p>
                                <div className="flex items-center text-red-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                                    Mulai Menulis <ArrowRight size={18} className="ml-2" />
                                </div>
                            </div>
                        </Link>

                        {/* KELOLA BERITA */}
                        <Link href="/dashboard-author/news" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-yellow-100 rounded-full blur-3xl opacity-50 group-hover:bg-yellow-200 transition"></div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <BookOpen className="text-yellow-600 w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3">Kelola Berita</h3>
                                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Lihat, edit, atau hapus semua berita yang sudah diterbitkan di platform.</p>
                                <div className="flex items-center text-yellow-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                                    Lihat Semua <ArrowRight size={18} className="ml-2" />
                                </div>
                            </div>
                        </Link>

                        {/* LIHAT SEMUA BERITA */}
                        <Link href="/news" className="relative group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-100 rounded-full blur-3xl opacity-50 group-hover:bg-teal-200 transition"></div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <Newspaper className="text-teal-600 w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3">Lihat Semua Berita</h3>
                                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">Ikuti perkembangan terbaru, panduan perawatan, dan event seputar dunia KoiChain.</p>
                                <div className="flex items-center text-teal-600 font-bold text-sm group-hover:translate-x-2 transition mt-auto">
                                    Baca Berita <ArrowRight size={18} className="ml-2" />
                                </div>
                            </div>
                        </Link>

                    </div>
                </div>

            </main>
        </div>
    );
}