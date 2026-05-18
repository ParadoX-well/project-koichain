import { MapPin, Phone, Facebook, Instagram, Youtube, Mail, ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      {/* Bagian Utama Footer */}
      <div className="container mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Kolom 1: Brand & Deskripsi */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              {/* LOGO PERUSAHAAN (Tanpa Kotak) */}
              <img 
                src="/logokoi.png" 
                alt="Logo WebKoi" 
                className="w-8 h-8 object-contain filter brightness-0 invert" 
              />
              <span className="text-2xl font-bold text-white tracking-tight">WebKoi</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Platform sertifikasi digital terpercaya untuk ikan Koi juara. 
              Menjamin keaslian dan transparansi sejarah kepemilikan menggunakan teknologi Blockchain Ethereum.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300 group">
                <Facebook size={18} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-full hover:bg-pink-600 hover:text-white transition-all duration-300 group">
                <Instagram size={18} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-full hover:bg-red-600 hover:text-white transition-all duration-300 group">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Kolom 2: Tautan Cepat */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 relative inline-block">
              Menu Utama
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-orange-500 rounded-full"></span>
            </h3>
            <ul className="space-y-4 text-sm">
              <li>
                <Link href="/" className="flex items-center gap-2 hover:text-orange-500 transition-colors group">
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-orange-500 transition-colors" />
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/check" className="flex items-center gap-2 hover:text-orange-500 transition-colors group">
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-orange-500 transition-colors" />
                  Cek Sertifikat
                </Link>
              </li>
              <li>
                <Link href="/dashboard-user/verification" className="flex items-center gap-2 hover:text-orange-500 transition-colors group">
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-orange-500 transition-colors" />
                  Login Mitra
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center gap-2 hover:text-orange-500 transition-colors group">
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-orange-500 transition-colors" />
                  Tentang Kami
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Layanan */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 relative inline-block">
              Layanan
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-orange-500 rounded-full"></span>
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-2 text-gray-400">
                <div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                Sertifikasi Digital
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                Verifikasi Kepemilikan
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                Jejak Rekam (Traceability)
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                Transfer Aset
              </li>
            </ul>
          </div>

          {/* Kolom 4: Kontak Kami / Bantuan */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 relative inline-block">
              Bantuan
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-orange-500 rounded-full"></span>
            </h3>
            <ul className="space-y-5 text-sm">
              <li className="flex items-start gap-4">
                <div className="p-2 bg-gray-800 rounded-lg text-orange-500 shrink-0">
                  <MapPin size={18} />
                </div>
                <span className="leading-relaxed">Jl. Koi Juara No. 123, <br/>Kota Serang, Banten 42111</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="p-2 bg-gray-800 rounded-lg text-orange-500 shrink-0">
                  <Phone size={18} />
                </div>
                <span>(0254) 123 4567</span>
              </li>
              <li className="flex items-center gap-4">
                 <div className="p-2 bg-gray-800 rounded-lg text-orange-500 shrink-0">
                  <Mail size={18} />
                </div>
                <a href="mailto:info@webkoi.com" className="hover:text-orange-500 transition-colors">info@webkoi.com</a>
              </li>
              
              {/* ITEM KE-4: FORMULIR PENGADUAN (Dengan Icon) */}
              <li className="flex items-center gap-4">
                 <div className="p-2 bg-gray-800 rounded-lg text-orange-500 shrink-0">
                  <FileText size={18} />
                </div>
                <Link href="/report" className="hover:text-orange-500 transition-colors">
                    Formulir Pengaduan
                </Link>
              </li>

            </ul>
          </div>

        </div>
      </div>

      {/* Bagian Copyright */}
      <div className="border-t border-gray-800 bg-gray-950">
        <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>&copy; {currentYear} WebKoi. Dibuat oleh <span className="text-gray-400 font-medium">Andika Attar Fizrah</span>.</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}