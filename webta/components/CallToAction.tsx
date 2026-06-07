'use client';

import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function CallToAction() {
    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-6">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                    
                    {/* Latar Belakang Gradasi Glowing */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-pink-600 to-purple-700"></div>
                    
                    {/* Pattern Overlay Abstrak */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-black/10"></div>
                    
                    {/* Lingkaran Pendar Cahaya (Glows) */}
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-white opacity-20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-300 opacity-20 rounded-full blur-3xl"></div>

                    {/* Konten */}
                    <div className="relative z-10 p-12 md:p-20 text-center max-w-4xl mx-auto flex flex-col items-center">
                        <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full p-4 mb-8 shadow-inner inline-flex">
                            <ShieldCheck className="w-12 h-12 text-white" />
                        </div>
                        
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-6 drop-shadow-md">
                            Siap Melindungi Aset Koi Anda dari Pemalsuan?
                        </h2>
                        
                        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl leading-relaxed drop-shadow-sm font-medium">
                            Bergabunglah dengan ratusan Breeder profesional lainnya. Amankan keaslian dan silsilah Ikan Koi Anda dengan teknologi Blockchain yang transparan dan tak terbantahkan.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <Link 
                                href="/profile-setting" 
                                className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 font-black px-8 py-4 rounded-full text-lg hover:bg-orange-50 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300"
                            >
                                Daftar Sekarang Gratis <ArrowRight size={20} />
                            </Link>
                            <Link 
                                href="/search" 
                                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/50 text-white font-bold px-8 py-4 rounded-full text-lg hover:bg-white/20 transition-all duration-300"
                            >
                                Cek Keaslian Sertifikat
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
