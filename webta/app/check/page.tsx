'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, QrCode, Camera, X } from 'lucide-react';
import Navbar from "@/components/Navbar";
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function CheckCertificatePage() {
  const router = useRouter();
  const [searchId, setSearchId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
      let html5QrcodeScanner: Html5QrcodeScanner | null = null;
      let isMounted = true;

      if (isScanning) {
          // Initialize scanner
          html5QrcodeScanner = new Html5QrcodeScanner(
              "qr-reader", 
              { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }, 
              false
          );
          
          const onScanSuccess = (decodedText: string) => {
              if (html5QrcodeScanner) {
                  html5QrcodeScanner.clear().catch(console.error);
              }
              setIsScanning(false);
              
              if (decodedText.includes('/koi/')) {
                  const parts = decodedText.split('/koi/');
                  const id = parts[parts.length - 1];
                  if (id) {
                      router.push(`/koi/${id}`);
                      return;
                  }
              }
              
              setSearchId(decodedText);
              router.push(`/koi/${encodeURIComponent(decodedText)}`);
          };

          const onScanFailure = (error: any) => {
              // Ignore failure
          };

          // Render scanner only if mounted
          if (isMounted) {
            html5QrcodeScanner.render(onScanSuccess, onScanFailure);
          }
      } 
      
      return () => {
          isMounted = false;
          if (html5QrcodeScanner) {
              html5QrcodeScanner.clear().catch(console.error);
          }
      };
  }, [isScanning, router]);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      // Langsung arahkan ke halaman detail dinamis
      // Di halaman itulah data + traceability akan ditampilkan
      router.push(`/koi/${encodeURIComponent(searchId.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center text-center">
        
        <div className="bg-white p-6 rounded-full bg-orange-100 mb-6">
            <QrCode size={48} className="text-orange-600" />
        </div>

        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Cek Keaslian & Traceability</h1>
        <p className="text-gray-500 mb-10 max-w-lg">
          Masukkan ID Koi atau Hash Transaksi untuk melihat sertifikat digital dan rekam jejak kepemilikan di Blockchain.
        </p>

        <form onSubmit={handleCheck} className="w-full max-w-lg relative z-10">
            <input 
                type="text" 
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Masukkan ID Koi (Contoh: KOI-2025-888)" 
                className="w-full pl-6 pr-32 py-5 rounded-full border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none text-lg shadow-sm transition"
            />
            
            <div className="absolute right-2 top-2 bottom-2 flex gap-2">
                <button 
                    type="button"
                    onClick={() => setIsScanning(true)}
                    className="bg-gray-100 text-gray-700 px-4 rounded-full hover:bg-gray-200 transition shadow-sm font-bold flex items-center justify-center border border-gray-200"
                    title="Scan QR Code"
                >
                    <Camera size={20} />
                </button>
                <button 
                    type="submit"
                    className="bg-orange-600 text-white px-6 rounded-full hover:bg-orange-700 transition shadow-md font-bold"
                >
                    Cek
                </button>
            </div>
        </form>

        {/* --- MODAL SCANNER --- */}
        {isScanning && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
                    <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
                        <h3 className="font-bold flex items-center gap-2"><QrCode size={18} /> Arahkan ke QR Code</h3>
                        <button onClick={() => setIsScanning(false)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-4 bg-gray-50 flex flex-col items-center">
                        {/* STYLE INLINE UNTUK TOMBOL HTML5-QRCODE SUPAYA LEBIH BAGUS */}
                        <style dangerouslySetInnerHTML={{__html: `
                            #qr-reader { border: none !important; }
                            #qr-reader__dashboard_section_csr button {
                                background-color: #ea580c !important; 
                                color: white !important; 
                                border: none !important; 
                                padding: 8px 16px !important; 
                                border-radius: 8px !important;
                                font-weight: bold !important;
                                cursor: pointer !important;
                            }
                            #qr-reader__dashboard_section_swaplink {
                                color: #ea580c !important;
                                text-decoration: none !important;
                                margin-top: 10px !important;
                                display: inline-block !important;
                            }
                        `}} />
                        <div id="qr-reader" className="w-full max-w-[300px] mx-auto rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white min-h-[250px]"></div>
                        <p className="text-sm text-gray-500 mt-4 text-center">Pastikan QR Code berada di dalam kotak area pemindaian. Hasil akan otomatis terbaca.</p>
                    </div>
                </div>
            </div>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">1. Input ID</h3>
                <p className="text-sm text-gray-500">Ketik kode unik yang tertera pada sertifikat fisik atau scan QR Code.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">2. Validasi Blockchain</h3>
                <p className="text-sm text-gray-500">Sistem akan mencari data di jaringan Ethereum Localhost secara real-time.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">3. Lihat Riwayat</h3>
                <p className="text-sm text-gray-500">Cek spesifikasi ikan dan sejarah perpindahan kepemilikannya.</p>
            </div>
        </div>

      </main>
    </div>
  );
}