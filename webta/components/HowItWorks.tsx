'use client';

import { UserPlus, Image as ImageIcon, ShieldCheck, QrCode } from 'lucide-react';

export default function HowItWorks() {
    const steps = [
        {
            id: 1,
            title: "Daftar Akun Mitra",
            description: "Daftar sebagai pemilik (owner) atau breeder terpercaya untuk memulai proses sertifikasi.",
            icon: <UserPlus className="w-8 h-8 text-orange-500" />,
            color: "bg-orange-100"
        },
        {
            id: 2,
            title: "Upload & Minting",
            description: "Unggah foto dan detail koi. Sistem akan mengunci data tersebut ke dalam teknologi Web3 (Blockchain).",
            icon: <ImageIcon className="w-8 h-8 text-pink-500" />,
            color: "bg-pink-100"
        },
        {
            id: 3,
            title: "Sertifikat Digital",
            description: "Dapatkan sertifikat digital anti-palsu yang dijamin oleh smart contract tanpa bisa dimanipulasi.",
            icon: <ShieldCheck className="w-8 h-8 text-purple-500" />,
            color: "bg-purple-100"
        },
        {
            id: 4,
            title: "Scan & Verifikasi",
            description: "Pembeli cukup memindai QR Code untuk membuktikan keaslian dan melihat silsilah koi secara transparan.",
            icon: <QrCode className="w-8 h-8 text-blue-500" />,
            color: "bg-blue-100"
        }
    ];

    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-6">
                        Bagaimana <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600">KoiChain</span> Bekerja?
                    </h2>
                    <p className="text-lg text-gray-500">
                        Proses sertifikasi aset ikan Koi yang dulunya rumit dan rawan penipuan, kini menjadi sangat aman, transparan, dan semudah membalikkan telapak tangan berkat teknologi Blockchain.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                    {/* Garis penghubung di background untuk desktop */}
                    <div className="hidden lg:block absolute top-12 left-1/8 right-1/8 h-1 bg-gradient-to-r from-orange-200 via-pink-200 to-blue-200 -z-10 rounded-full"></div>

                    {steps.map((step) => (
                        <div key={step.id} className="relative group">
                            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 h-full flex flex-col items-center text-center">
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${step.color} mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
                                    {step.icon}
                                </div>
                                <div className="absolute top-8 right-8 text-6xl font-black text-gray-50 opacity-50 group-hover:text-gray-100 transition-colors pointer-events-none">
                                    {step.id}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
