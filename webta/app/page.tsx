'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewsSection from "@/components/NewsSection"; // Import Berita F1
import Link from "next/link";
import { ShieldCheck, Search, Database, ArrowRight, Activity, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <Navbar />

      <main className="flex-grow">
        
        {/* --- HERO SECTION --- */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-white -z-10" />
          
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-orange-200 animate-fade-in-up">
              <ShieldCheck size={16} />
              <span>Teknologi Blockchain Ethereum</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
              Keaslian Digital untuk <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Ikan Koi Juara</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Platform Web3 untuk menerbitkan dan memverifikasi sertifikat keaslian Ikan Koi. 
              Dicatat secara permanen, aman, dan transparan di Blockchain.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* Tombol ke Halaman Cek */}
              <Link 
                href="/check" 
                className="group flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-800 transition shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                <Search className="w-5 h-5" />
                Mulai Verifikasi
              </Link>

              {/* Tombol Login/Daftar */}
              <Link 
                href="/login" 
                className="flex items-center gap-3 bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-full font-bold text-lg hover:border-orange-200 hover:text-orange-600 transition shadow-sm hover:bg-orange-50"
              >
                Gabung Mitra
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Statistik Singkat */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-gray-200 pt-8 max-w-4xl mx-auto">
              <div>
                <p className="text-3xl font-bold text-gray-900">100%</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Immutable Data</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">24/7</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Verifikasi Online</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">Web3</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Smart Contract</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">QR</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Akses Mudah</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* --- NEWS SECTION (F1 STYLE) --- */}
        <NewsSection />

        {/* --- FEATURE SECTION --- */}
        <section className="py-20 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Mengapa WebKoi?</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Solusi modern untuk mengatasi pemalsuan sertifikat dan menjaga nilai aset hobi Anda.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-orange-200 transition hover:shadow-lg group">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                  <Database className="text-orange-600 w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Data Abadi</h3>
                <p className="text-gray-500 leading-relaxed">
                  Data sertifikat disimpan di Blockchain Ethereum. Tidak dapat dihapus, diedit, atau dipalsukan oleh siapapun.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition hover:shadow-lg group">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                  <Activity className="text-blue-600 w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Traceability</h3>
                <p className="text-gray-500 leading-relaxed">
                  Lacak sejarah kepemilikan dan pertumbuhan ikan dari masa ke masa secara transparan.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-green-200 transition hover:shadow-lg group">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                  <Globe className="text-green-600 w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Akses Global</h3>
                <p className="text-gray-500 leading-relaxed">
                  Verifikasi dapat dilakukan dari mana saja di dunia hanya dengan memindai QR Code.
                </p>
              </div>
            </div>
          </div>
        </section>



      </main>

      {/* --- FOOTER COMPONENT --- */}
      <Footer />
    </div>
  );
}