'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldCheck, Lock, Eye, Database } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-200">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Kebijakan Privasi</h1>
          <p className="text-gray-500 mb-8">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}</p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
            <p className="text-sm text-blue-700">
              <strong>Catatan Tugas Akhir:</strong> Dokumen ini dibuat sebagai bagian dari simulasi proyek Tugas Akhir dan bukan merupakan dokumen hukum yang mengikat secara komersial.
            </p>
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Database className="text-orange-600 w-5 h-5" /> 1. Informasi yang Kami Kumpulkan
              </h2>
              <p className="mb-4">
                Untuk memberikan layanan sertifikasi digital, WebKoi mengumpulkan beberapa jenis informasi dari Anda:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Informasi Akun:</strong> Nama lengkap, alamat email, dan nomor telepon yang Anda berikan saat mendaftar.</li>
                <li><strong>Data Verifikasi (KYC):</strong> Foto Kartu Tanda Penduduk (KTP) dan data usaha (Nama Farm/Toko) untuk keperluan verifikasi mitra (Breeder/Penjual).</li>
                <li><strong>Data Blockchain:</strong> Alamat Dompet (Wallet Address) Ethereum Anda dan riwayat transaksi yang terkait dengan Smart Contract WebKoi.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="text-orange-600 w-5 h-5" /> 2. Penggunaan Informasi
              </h2>
              <p>Kami menggunakan data Anda untuk:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Memverifikasi identitas Anda sebelum memberikan akses fitur Minting (penerbitan sertifikat).</li>
                <li>Mencatat kepemilikan aset digital secara permanen di Blockchain.</li>
                <li>Menghubungi Anda terkait status akun atau pembaruan layanan.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="text-orange-600 w-5 h-5" /> 3. Data Blockchain & Transparansi
              </h2>
              <p>
                Harap dipahami bahwa WebKoi beroperasi di atas jaringan Blockchain (Ethereum/Hardhat). Sifat dasar teknologi ini adalah <strong>transparan dan tidak dapat diubah (immutable)</strong>.
              </p>
              <p className="mt-2">
                Setiap transaksi yang Anda lakukan (Minting, Transfer, Update) akan tercatat selamanya di buku besar publik. Meskipun kami melindungi data pribadi off-chain Anda (seperti foto KTP), data on-chain (seperti riwayat kepemilikan aset) dapat dilihat oleh publik.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="text-orange-600 w-5 h-5" /> 4. Keamanan Data
              </h2>
              <p>
                Kami menggunakan penyimpanan terenkripsi (Supabase Storage) dengan kebijakan keamanan (Row Level Security) untuk melindungi dokumen sensitif seperti KTP Anda. Akses ke dokumen ini dibatasi hanya untuk Administrator sistem demi keperluan verifikasi.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">5. Kontak Kami</h2>
              <p>
                Jika Anda memiliki pertanyaan mengenai kebijakan privasi ini, silakan hubungi kami melalui email di <a href="mailto:privacy@webkoi.com" className="text-blue-600 hover:underline">privacy@webkoi.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}