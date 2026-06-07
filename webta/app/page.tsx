'use client';

import { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewsSection from "@/components/NewsSection";
import PartnerShowcase from "@/components/PartnerShowcase";
import HowItWorks from "@/components/HowItWorks";
import LiveShowcase from "@/components/LiveShowcase";
import CallToAction from "@/components/CallToAction";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, Search, Database, ArrowRight, Activity, Globe, CheckCircle2, X } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string, desc: string, actionText?: string, actionUrl?: string }>({ title: '', desc: '' });

  const handleGabungMitra = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      router.push('/login');
      return;
    }

    const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    const role = data?.role || 'user';

    if (role.includes('seller') && role.includes('breeder')) {
      setModalContent({
        title: 'Status: Lengkap!',
        desc: 'Anda sudah terdaftar sebagai Seller sekaligus Breeder. Tidak ada pengajuan kemitraan lain yang tersedia.'
      });
      setShowModal(true);
    } else if (role.includes('seller')) {
      setModalContent({
        title: 'Anda adalah Seller',
        desc: 'Akun Anda sudah terdaftar sebagai Seller. Ingin memperluas jangkauan dengan mengajukan diri sebagai Breeder?',
        actionText: 'Ajukan sebagai Breeder',
        actionUrl: '/profile-setting/verification?upgrade=breeder'
      });
      setShowModal(true);
    } else if (role.includes('breeder')) {
      setModalContent({
        title: 'Anda adalah Breeder',
        desc: 'Akun Anda sudah terdaftar sebagai Breeder. Ingin mulai berjualan dengan mengajukan diri sebagai Seller?',
        actionText: 'Ajukan sebagai Seller',
        actionUrl: '/profile-setting/verification?upgrade=seller'
      });
      setShowModal(true);
    } else {
      router.push('/profile-setting/verification');
    }
  };
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col relative">
      {/* --- MODAL POPUP --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full p-1 transition"><X size={20} /></button>
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><ShieldCheck size={32} /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{modalContent.title}</h3>
            <p className="text-gray-500 mb-8">{modalContent.desc}</p>
            {modalContent.actionText && modalContent.actionUrl ? (
              <div className="flex flex-col gap-3">
                <button onClick={() => router.push(modalContent.actionUrl!)} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition">{modalContent.actionText}</button>
                <button onClick={() => setShowModal(false)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-xl transition">Nanti Saja</button>
              </div>
            ) : (
              <button onClick={() => setShowModal(false)} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition">Tutup</button>
            )}
          </div>
        </div>
      )}

      {/* --- CSS ANIMATIONS KHUSUS LANDING PAGE --- */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(2deg); }
          50% { transform: translateY(-20px) rotate(-1deg); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 7s ease-in-out infinite; }
        .animate-blob { animation: blob 7s infinite; }
        .animate-fade-up { animation: fade-in-up 0.8s ease-out forwards; opacity: 0; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
      `}} />

      <Navbar />

      <main className="flex-grow overflow-x-hidden">

        {/* --- HERO SECTION 2 KOLOM --- */}
        <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden">
          {/* Efek Glow Background (Glassmorphism blobs) */}
          <div className="absolute top-0 -left-4 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-red-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

          <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

            {/* Kiri: Teks */}
            <div className="w-full lg:w-1/2 text-center lg:text-left animate-fade-up">
              <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-5 py-2 rounded-full text-sm font-bold mb-8 border border-orange-200 shadow-sm">
                <ShieldCheck size={16} />
                <span>Teknologi Web3 Ethereum</span>
              </div>

              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight">
                Standar Emas untuk <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-red-500 to-orange-500">Ikan Koi Juara</span>
              </h1>

              <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Platform digital untuk menerbitkan dan memverifikasi sertifikat keaslian Ikan Koi.
                Silsilah, riwayat pindah tangan, dan piala dicatat abadi di Blockchain.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/check"
                  className="group flex items-center justify-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                >
                  <Search className="w-5 h-5 text-orange-400" />
                  Mulai Verifikasi
                </Link>

                <button
                  onClick={handleGabungMitra}
                  className="flex items-center justify-center gap-3 bg-white text-gray-900 border-2 border-gray-100 px-8 py-4 rounded-2xl font-bold text-lg hover:border-orange-200 hover:text-orange-600 transition-all hover:bg-orange-50"
                >
                  Gabung Mitra
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Kanan: Visual Asset (Floating Certificate Mockup) */}
            <div className="w-full lg:w-1/2 relative min-h-[400px] lg:min-h-[500px] flex items-center justify-center animate-fade-up delay-200">

              {/* Kartu Sertifikat Kaca */}
              <div className="absolute w-[300px] sm:w-[350px] bg-white/60 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-6 animate-float z-20">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                    <img src="/logo-koichain2-notulisan-black.png" alt="Logo" className="w-8 h-8 object-contain rounded-full" />
                    <span className="font-bold text-gray-800">KoiChain ID</span>
                  </div>
                  <ShieldCheck className="text-green-500 w-6 h-6" />
                </div>

                <div className="bg-gray-100 w-full h-32 rounded-xl mb-4 overflow-hidden relative">
                  {/* Placeholder Koi Image (Atau ilustrasi) */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-400 to-red-400 opacity-20"></div>
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl">🐟</span>
                  </div>
                </div>

                <h3 className="font-black text-xl text-gray-900">Showa Sanshoku</h3>
                <p className="text-xs text-gray-400 font-mono mt-1">ID: KOI-2025-001</p>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">A</div>
                    <div className="w-8 h-8 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-xs">B</div>
                  </div>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Terverifikasi</div>
                </div>
              </div>

              {/* Elemen Dekoratif Mengambang */}
              <div className="absolute top-10 right-10 bg-white p-3 rounded-2xl shadow-xl animate-float-reverse z-30 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><Activity size={20} /></div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Status Data</p>
                  <p className="text-sm font-bold text-gray-900">Immutable</p>
                </div>
              </div>

              <div className="absolute bottom-10 left-5 bg-white p-3 rounded-2xl shadow-xl animate-float delay-300 z-30 flex items-center gap-3 border border-orange-50">
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center"><CheckCircle2 size={20} /></div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Smart Contract</p>
                  <p className="text-sm font-bold text-gray-900">Aktif</p>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* --- STATISTIK --- */}
        <section className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 py-12 relative z-20 shadow-inner">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/20">
            <div>
              <p className="text-4xl font-black text-white">100%</p>
              <p className="text-xs text-white/80 uppercase tracking-widest mt-2 font-medium">Anti Pemalsuan</p>
            </div>
            <div>
              <p className="text-4xl font-black text-white">24/7</p>
              <p className="text-xs text-white/80 uppercase tracking-widest mt-2 font-medium">Verifikasi Online</p>
            </div>
            <div>
              <p className="text-4xl font-black text-white">Web3</p>
              <p className="text-xs text-white/80 uppercase tracking-widest mt-2 font-medium">Smart Contract</p>
            </div>
            <div>
              <p className="text-4xl font-black text-white">QR</p>
              <p className="text-xs text-white/80 uppercase tracking-widest mt-2 font-medium">Akses Instan</p>
            </div>
          </div>
        </section>

        {/* --- LIVE SHOWCASE SECTION --- */}
        <LiveShowcase />

        {/* --- PARTNER SHOWCASE SECTION --- */}
        <PartnerShowcase />

        {/* --- HOW IT WORKS SECTION --- */}
        <HowItWorks />

        {/* --- FEATURE SECTION --- */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16 animate-fade-up">
              <h2 className="text-4xl font-black text-gray-900 mb-4">Mengapa Memilih KoiChain ID?</h2>
              <p className="text-gray-500 max-w-xl mx-auto text-lg">Solusi modern untuk mengatasi pemalsuan sertifikat dan menjaga nilai investasi aset hobi Anda.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-[2rem] bg-white border border-gray-100 hover:border-orange-300 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(234,88,12,0.15)] group animate-fade-up delay-100">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 group-hover:rotate-3">
                  <Database className="text-orange-600 w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Data Abadi (Immutable)</h3>
                <p className="text-gray-500 leading-relaxed">
                  Semua data sertifikat disimpan secara terdistribusi di Blockchain Ethereum. Tidak dapat dihapus, diedit, atau dipalsukan oleh siapapun.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-[2rem] bg-white border border-gray-100 hover:border-red-300 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(239,68,68,0.15)] group animate-fade-up delay-200">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 group-hover:-rotate-3">
                  <Activity className="text-blue-600 w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Traceability Penuh</h3>
                <p className="text-gray-500 leading-relaxed">
                  Lacak sejarah silsilah keturunan, perpindahan tangan dari breeder ke kolektor, hingga riwayat kemenangan kontes dari masa ke masa.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-[2rem] bg-white border border-gray-100 hover:border-pink-300 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(236,72,153,0.15)] group animate-fade-up delay-300">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 group-hover:rotate-3">
                  <Globe className="text-green-600 w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Akses Global & Cepat</h3>
                <p className="text-gray-500 leading-relaxed">
                  Siapapun dari belahan dunia manapun bisa melakukan verifikasi instan hanya dengan memindai QR Code di sertifikat fisik atau digital.
                </p>
              </div>
            </div>
          </div>
        </section>



        {/* --- NEWS SECTION --- */}
        <div className="bg-gray-50 border-t border-gray-100">
          <NewsSection />
        </div>

        {/* --- CALL TO ACTION --- */}
        <CallToAction />

      </main>

      {/* --- FOOTER COMPONENT --- */}
      <Footer />
    </div>
  );
}
