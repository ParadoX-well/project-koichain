'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText, AlertTriangle, Wallet, Scale } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-200">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Syarat dan Ketentuan</h1>
          <p className="text-gray-500 mb-8">Berlaku mulai: {new Date().toLocaleDateString('id-ID')}</p>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="text-orange-600 w-5 h-5" /> 1. Pendahuluan
              </h2>
              <p>
                Selamat datang di WebKoi. Dengan mengakses atau menggunakan platform ini, Anda setuju untuk terikat oleh syarat dan ketentuan berikut. Platform ini dikembangkan sebagai purwarupa (prototype) untuk keperluan Tugas Akhir Akademik.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Wallet className="text-orange-600 w-5 h-5" /> 2. Penggunaan Blockchain & Wallet
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Tanggung Jawab Kunci Pribadi:</strong> Anda bertanggung jawab penuh atas keamanan Dompet Digital (Wallet) Anda (seperti MetaMask). Kehilangan akses ke wallet Anda berarti kehilangan akses ke aset digital Anda di platform ini.</li>
                <li><strong>Transaksi Tidak Dapat Dibatalkan:</strong> Segala transaksi yang telah dikonfirmasi di blockchain (Minting, Transfer) bersifat final dan tidak dapat dibatalkan atau dihapus oleh Admin.</li>
                <li><strong>Gas Fee:</strong> Anda bertanggung jawab atas biaya transaksi (Gas Fee) yang diperlukan oleh jaringan blockchain untuk memproses aktivitas Anda.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="text-orange-600 w-5 h-5" /> 3. Konten Pengguna
              </h2>
              <p>
                Saat mengunggah data sertifikat ikan koi:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Anda menjamin bahwa data (foto, ukuran, jenis) adalah akurat dan benar.</li>
                <li>Dilarang mengunggah konten yang melanggar hak cipta, bersifat penipuan, atau ilegal.</li>
                <li>WebKoi berhak menonaktifkan akses akun yang terbukti melakukan pemalsuan data sertifikat.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Scale className="text-orange-600 w-5 h-5" /> 4. Batasan Tanggung Jawab
              </h2>
              <p>
                WebKoi disediakan "sebagaimana adanya" (as is). Sebagai proyek akademik, kami tidak menjamin ketersediaan layanan 24/7 atau bebas dari kesalahan (bug). Kami tidak bertanggung jawab atas kerugian finansial yang mungkin timbul akibat penggunaan platform ini, termasuk fluktuasi nilai aset atau kesalahan transaksi pengguna.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}