import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldCheck, Link as LinkIcon, Cpu, Gem, Users, Target } from "lucide-react";
import Link from "next/link";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-orange-500 selection:text-white flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex items-center justify-center min-h-[60vh]">
          {/* Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-orange-400/20 to-pink-500/20 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3 mix-blend-multiply"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-400/20 to-teal-400/20 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3 mix-blend-multiply"></div>
          </div>

          <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-md border border-white/50 text-orange-600 font-bold text-sm mb-6 animate-fade-in-up">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
              Tentang Kami
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Masa Depan Sertifikasi <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600">
                Koi Digital
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              KoiChain ID mengintegrasikan seni memelihara ikan Koi dengan keamanan mutlak dari teknologi Web3 Blockchain Ethereum.
            </p>
          </div>
        </section>

        {/* VISI MISI SECTION */}
        <section className="py-20 bg-white relative z-10">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
              <div className="space-y-8">
                <div>
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                    <Target className="w-8 h-8 text-orange-600" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-4">Visi Kami</h2>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    Menjadi platform standar global untuk otentikasi dan pelacakan silsilah (traceability) ikan Koi menggunakan teknologi terdesentralisasi yang transparan dan aman.
                  </p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                    <Users className="w-8 h-8 text-pink-600" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-4">Misi Kami</h2>
                  <ul className="space-y-4 text-gray-600 text-lg">
                    <li className="flex gap-3">
                      <span className="text-pink-500 font-bold">1.</span>
                      Mencegah pemalsuan sertifikat ikan Koi.
                    </li>
                    <li className="flex gap-3">
                      <span className="text-pink-500 font-bold">2.</span>
                      Membangun ekosistem terpercaya antara Breeder, Seller, dan kolektor.
                    </li>
                    <li className="flex gap-3">
                      <span className="text-pink-500 font-bold">3.</span>
                      Menghadirkan jejak rekam sejarah juara dan mutasi secara abadi.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Dekorasi Visual */}
              <div className="relative group perspective-1000">
                <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-white/40 backdrop-blur-3xl border border-white/60 p-8 rounded-[2rem] shadow-2xl transform transition-transform duration-700 group-hover:rotate-1">
                  <img 
                    src="/logo-koichain2-notulisan-black.png" 
                    alt="Logo Big" 
                    className="w-full max-w-sm mx-auto drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* KEUNGGULAN (MENGAPA MEMILIH KAMI) */}
        <section className="py-24 bg-gray-50 relative">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Mengapa KoiChain?</h2>
              <p className="text-gray-500 text-lg">Kami memadukan tradisi dengan teknologi mutakhir untuk memberikan nilai tambah terbaik pada koleksi Anda.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-100 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheck className="text-blue-600 w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Anti-Pemalsuan Mutlak</h3>
                <p className="text-gray-500 leading-relaxed">
                  Data sertifikat disimpan dalam blockchain immutable. Tidak ada satu pihak pun yang bisa memanipulasi data ukuran, umur, atau silsilah secara diam-diam.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-100 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
                  <LinkIcon className="text-purple-600 w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Jejak Silsilah Transparan</h3>
                <p className="text-gray-500 leading-relaxed">
                  Semua perpindahan kepemilikan tercatat rapi secara publik. Pembeli baru bisa melacak dari breeder mana ikan tersebut berasal.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-100 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
                  <Gem className="text-emerald-600 w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Nilai Eksklusivitas</h3>
                <p className="text-gray-500 leading-relaxed">
                  Sertifikat digital NFT meningkatkan prestise koleksi ikan Anda, membuatnya lebih bernilai dan mudah divalidasi dalam kontes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TIM / KREATOR SECTION */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6 text-center">
            <div className="inline-block p-4 bg-gray-50 rounded-[2rem] border border-gray-100">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Cpu className="text-white w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Andika Attar Fizrah</h3>
              <p className="text-orange-600 font-medium text-sm mt-1 mb-4">Founder & Lead Developer</p>
              <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
                Dikembangkan dengan dedikasi penuh untuk memajukan industri perikanan lokal ke ranah teknologi digital Web3.
              </p>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-20 bg-gray-900 text-center relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-full blur-[80px]"></div>
          </div>
          <div className="container mx-auto px-6 relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Siap Menjadi Bagian dari Sejarah?</h2>
            <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Jadilah pionir yang menggunakan sertifikat digital berbasis blockchain untuk koleksi ikan Koi Anda.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/koi" className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-1">
                Eksplorasi Galeri
              </Link>
              <Link href="/profile-setting/verification" className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold rounded-xl border border-white/20 transition-all hover:-translate-y-1">
                Daftar Jadi Mitra
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
