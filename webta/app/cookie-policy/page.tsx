'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Cookie, Settings, Shield } from "lucide-react";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-200">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Kebijakan Cookie</h1>
          <p className="text-gray-500 mb-8">Efektif sejak: {new Date().toLocaleDateString('id-ID')}</p>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Cookie className="text-orange-600 w-5 h-5" /> 1. Apa itu Cookie?
              </h2>
              <p>
                Cookie adalah file teks kecil yang disimpan di perangkat Anda (komputer atau ponsel) saat Anda mengunjungi situs web kami. Cookie membantu kami mengenali perangkat Anda dan mengingat preferensi Anda untuk meningkatkan pengalaman pengguna.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="text-orange-600 w-5 h-5" /> 2. Cookie yang Kami Gunakan
              </h2>
              <p className="mb-2">WebKoi menggunakan jenis cookie berikut:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Cookie Esensial (Wajib):</strong> Cookie ini sangat penting agar website dapat berfungsi dengan baik. Contohnya: Cookie sesi dari Supabase yang menjaga Anda tetap login saat berpindah halaman. Tanpa cookie ini, fitur login tidak dapat digunakan.
                </li>
                <li>
                  <strong>Cookie Fungsional:</strong> Cookie ini mengingat pilihan yang Anda buat (seperti preferensi bahasa atau tema) untuk memberikan pengalaman yang lebih personal.
                </li>
              </ul>
              <p className="mt-4 bg-gray-50 p-4 rounded-lg text-sm italic border border-gray-100">
                Catatan: Karena ini adalah proyek Tugas Akhir, kami tidak menggunakan cookie pelacakan pihak ketiga untuk iklan (Advertising Cookies) atau analitik komersial yang agresif.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="text-orange-600 w-5 h-5" /> 3. Mengelola Cookie
              </h2>
              <p>
                Sebagian besar browser secara otomatis menerima cookie, tetapi Anda dapat mengubah pengaturan browser Anda untuk menolak cookie jika diinginkan. Harap dicatat bahwa jika Anda menonaktifkan cookie esensial, beberapa bagian dari WebKoi (terutama Login dan Dashboard) mungkin tidak berfungsi dengan semestinya.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}