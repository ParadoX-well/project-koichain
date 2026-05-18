'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, Tag } from 'lucide-react';

// Data Berita Dummy (Nanti bisa diganti dari Database)
const NEWS_DATA = [
  {
    id: 1,
    title: "Grand Champion: Kohaku 90cm Menang Telak di All Japan Koi Show 2024",
    category: "Kontes Internasional",
    date: "28 Des 2024",
    image: "https://images.unsplash.com/photo-1516666992695-1b0728c467e2?q=80&w=800&auto=format&fit=crop",
    link: "#",
    isMain: true // Berita Utama (Besar)
  },
  {
    id: 2,
    title: "Tips Menjaga Kualitas Air Kolam Saat Musim Hujan Ekstrem",
    category: "Tips Perawatan",
    date: "25 Des 2024",
    image: "https://images.unsplash.com/photo-1544558635-667480601430?q=80&w=800&auto=format&fit=crop",
    link: "#",
    isMain: false
  },
  {
    id: 3,
    title: "Mengenal Jenis Showa Sanshoku: Keindahan Hitam yang Elegan",
    category: "Ensiklopedia",
    date: "20 Des 2024",
    image: "https://images.unsplash.com/photo-1502083921-67858c279a61?q=80&w=800&auto=format&fit=crop",
    link: "#",
    isMain: false
  },
  {
    id: 4,
    title: "Pasar Koi Lokal Mulai Menggeliat, Ekspor ke Eropa Meningkat",
    category: "Berita Industri",
    date: "15 Des 2024",
    image: "https://images.unsplash.com/photo-1524704796725-9fc304ae1582?q=80&w=800&auto=format&fit=crop",
    link: "#",
    isMain: false
  }
];

export default function NewsSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        
        {/* Header Section */}
        <div className="flex justify-between items-end mb-10 border-b-4 border-red-600 pb-4">
            <div>
                <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight uppercase italic">
                    Koi News <span className="text-red-600">Feed</span>
                </h2>
                <p className="text-gray-500 mt-2">Update terbaru seputar dunia Koi, kontes, dan tips perawatan.</p>
            </div>
            <Link href="#" className="hidden md:flex items-center gap-2 font-bold text-red-600 hover:text-red-800 transition">
                Lihat Semua Berita <ArrowRight size={20} />
            </Link>
        </div>

        {/* Grid Layout ala F1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* BERITA UTAMA (KIRI - BESAR) */}
            {NEWS_DATA.filter(n => n.isMain).map((news) => (
                <Link href={news.link} key={news.id} className="group relative block h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-xl">
                    <img 
                        src={news.image} 
                        alt={news.title} 
                        className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                    
                    <div className="absolute bottom-0 left-0 p-8 w-full">
                        <span className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-wider mb-3">
                            {news.category}
                        </span>
                        <h3 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4 group-hover:underline decoration-red-600 decoration-4 underline-offset-4">
                            {news.title}
                        </h3>
                        <div className="flex items-center gap-4 text-gray-300 text-sm font-medium">
                            <span className="flex items-center gap-1"><Calendar size={14}/> {news.date}</span>
                            <span className="flex items-center gap-1 group-hover:text-white transition">Baca Selengkapnya <ArrowRight size={14}/></span>
                        </div>
                    </div>
                </Link>
            ))}

            {/* BERITA SAMPING (KANAN - LIST VERTIKAL) */}
            <div className="flex flex-col gap-6">
                {NEWS_DATA.filter(n => !n.isMain).map((news) => (
                    <Link href={news.link} key={news.id} className="group flex flex-col md:flex-row gap-6 bg-white p-4 rounded-xl shadow-sm hover:shadow-md border border-gray-100 transition h-full">
                        <div className="w-full md:w-48 h-48 md:h-full rounded-lg overflow-hidden flex-shrink-0 relative">
                            <img 
                                src={news.image} 
                                alt={news.title} 
                                className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                            />
                             <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                {news.category}
                            </div>
                        </div>
                        <div className="flex flex-col justify-center py-2 pr-4">
                            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mb-2 uppercase tracking-wide">
                                <Tag size={12} className="text-red-500"/> {news.category} 
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span> 
                                <Calendar size={12}/> {news.date}
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-3 leading-snug group-hover:text-red-600 transition">
                                {news.title}
                            </h4>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                                Klik untuk membaca artikel lengkap tentang topik ini. Dapatkan wawasan mendalam seputar dunia koi.
                            </p>
                            <span className="text-red-600 text-sm font-bold flex items-center gap-1 group-hover:translate-x-2 transition duration-300">
                                Baca <ArrowRight size={14}/>
                            </span>
                        </div>
                    </Link>
                ))}
            </div>

        </div>

        {/* Tombol Mobile */}
        <div className="mt-8 text-center md:hidden">
            <Link href="#" className="inline-flex items-center gap-2 font-bold text-red-600 border-2 border-red-600 px-6 py-3 rounded-full hover:bg-red-600 hover:text-white transition">
                Lihat Semua Berita <ArrowRight size={20} />
            </Link>
        </div>

      </div>
    </section>
  );
}