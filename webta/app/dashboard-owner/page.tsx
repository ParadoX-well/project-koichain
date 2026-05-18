'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Database, Send, Activity, ShieldAlert, Wallet, ArrowRight, Ban } from 'lucide-react';
import Link from 'next/link';
import Navbar from "@/components/Navbar";
import { Toaster } from 'react-hot-toast';

export default function OwnerDashboard() {
  const { account, connectWallet } = useWallet();
  const router = useRouter();
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false); // State baru untuk status Ban

  // Cek Role & Status Ban
  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_banned') // Ambil kolom is_banned juga
        .eq('id', user.id)
        .single();

      if (profile) {
        // Cek apakah User di-Ban?
        if (profile.is_banned) {
            setIsBanned(true);
            setLoading(false);
            return;
        }

        // Jika user biasa coba masuk sini, tendang ke profil
        if (profile.role === 'user') {
            router.replace('/dashboard-user');
        } else {
            setRole(profile.role);
        }
      }
      setLoading(false);
    };

    checkRole();
  }, [router]);

  // Tampilan Loading
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Memeriksa Status Akun...</div>;

  // --- TAMPILAN JIKA TERKENA BAN ---
  if (isBanned) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
        <div className="relative z-50"><Navbar /></div>
        <div className="flex-grow flex flex-col items-center justify-center p-4 text-center z-0">
            <div className="bg-red-50 p-10 rounded-2xl shadow-xl border border-red-200 max-w-md animate-fade-in-up">
                <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Ban className="text-red-600 w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold text-red-700 mb-2">Akun Dibekukan</h1>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    Maaf, akun Anda telah dinonaktifkan oleh Administrator karena pelanggaran kebijakan. Anda tidak dapat mengakses fitur Minting atau Transfer.
                </p>
                
                <div className="bg-white p-4 rounded-xl border border-red-100 text-sm text-left mb-6">
                    <p className="font-bold text-red-800 mb-1">Apa yang harus saya lakukan?</p>
                    <p className="text-gray-500">Silakan hubungi admin melalui halaman laporan atau email untuk mengajukan banding.</p>
                </div>

                <Link href="/report" className="w-full block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-lg transition shadow-lg">
                    Hubungi Admin
                </Link>
            </div>
        </div>
      </div>
    );
  }

  // Tampilan Belum Connect Wallet
  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
        <div className="relative z-50"><Navbar /></div>
        <div className="flex-grow flex flex-col items-center justify-center p-4 text-center z-0">
            <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-200 max-w-md">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="text-orange-600 w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Mitra</h1>
                <p className="text-gray-500 mb-8">
                    Halo {role ? <span className="uppercase font-bold text-orange-600">{role}</span> : 'Mitra'}! <br/>
                    Silakan hubungkan Wallet untuk mengelola aset Ikan Koi Anda.
                </p>
                <button onClick={connectWallet} className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white px-6 py-4 rounded-xl font-bold text-lg transition shadow-lg relative z-10">
                    <Wallet size={24} /> Hubungkan Wallet
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <div className="relative z-50"><Navbar /></div>
      <Toaster position="top-center" />

      <main className="max-w-6xl mx-auto px-4 py-12 relative z-0">
        <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 capitalize">Dashboard {role}</h1>
            <p className="text-gray-500">Kelola sertifikat digital dan aset Koi Anda di sini.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
             {/* MENU 1: MINTING (UPLOAD) */}
             <Link href="/minting" className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-purple-200 transition duration-300">
                <div className="bg-purple-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition">
                    <Database className="text-purple-600 w-7 h-7 group-hover:text-white transition" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Ikan Baru</h3>
                <p className="text-gray-500 text-sm mb-6">Terbitkan sertifikat digital (Minting) untuk ikan koi baru ke Blockchain.</p>
                <div className="flex items-center text-purple-600 font-bold text-sm group-hover:translate-x-2 transition">
                    Mulai Upload <ArrowRight size={16} className="ml-2" />
                </div>
            </Link>

            {/* MENU 2: TRANSFER KEPEMILIKAN */}
            <Link href="/admin/transfer" className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-green-200 transition duration-300">
                <div className="bg-green-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition">
                    <Send className="text-green-600 w-7 h-7 group-hover:text-white transition" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Transfer Kepemilikan</h3>
                <p className="text-gray-500 text-sm mb-6">Jual atau pindahkan hak milik sertifikat ikan ke pembeli lain.</p>
                <div className="flex items-center text-green-600 font-bold text-sm group-hover:translate-x-2 transition">
                    Kirim Aset <ArrowRight size={16} className="ml-2" />
                </div>
            </Link>

            {/* MENU 3: UPDATE PERTUMBUHAN */}
            <Link href="/admin/update-koi" className="group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-cyan-200 transition duration-300">
                <div className="bg-cyan-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cyan-600 transition">
                    <Activity className="text-cyan-600 w-7 h-7 group-hover:text-white transition" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Update Data</h3>
                <p className="text-gray-500 text-sm mb-6">Perbarui ukuran, umur, atau foto terkini dari ikan yang Anda miliki.</p>
                <div className="flex items-center text-cyan-600 font-bold text-sm group-hover:translate-x-2 transition">
                    Update Sekarang <ArrowRight size={16} className="ml-2" />
                </div>
            </Link>

        </div>
      </main>
    </div>
  );
}