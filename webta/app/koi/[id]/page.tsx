'use client';

import { useState, useEffect, use } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contractConfig';
import { ShieldCheck, Calendar, Ruler, Activity, User, Tag, ArrowLeft, AlertCircle, History, ExternalLink, ImageIcon, X, ZoomIn, GitMerge } from 'lucide-react';
import Navbar from "@/components/Navbar";
import Link from 'next/link';
import QRCode from 'react-qr-code';

// Helper format tanggal
const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    try {
        const date = new Date(Number(timestamp) * 1000);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return '-'; }
};

// Helper format angka
const formatNumber = (val: any) => {
    if (val === undefined || val === null || val === '') return '-';
    const num = Number(val);
    return (isNaN(num) || num === 0) ? '-' : num;
};

export default function KoiDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // 1. UNWRAP PARAMS (Wajib di Next.js 15)
    const unwrappedParams = use(params);
    const koiId = decodeURIComponent(unwrappedParams.id);

    const [koiData, setKoiData] = useState<any>(null);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State untuk Modal History & Preview Image
    const [selectedHistory, setSelectedHistory] = useState<any>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                if (!koiId) return;

                // Koneksi Blockchain Read-Only
                // Menggunakan Localhost Hardhat RPC
                const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545/");
                const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

                // 1. DATA UTAMA
                const data = await contract.getKoi(koiId);

                // Cek apakah data valid (ID tidak kosong)
                if (!data || !data.id) {
                    setError(`Data "${koiId}" tidak ditemukan.`);
                    setLoading(false);
                    return;
                }

                // --- FUNGSI EKSTRAKSI DATA ARRAY (ANTI-GAGAL) ---
                const extractArray = (input: any) => {
                    let arr: any[] = [];

                    // Cek null/undefined
                    if (!input) return [];

                    // Ethers v6 Result (Proxy Object) -> Convert ke Array JS
                    if (typeof input.toArray === 'function') {
                        arr = input.toArray();
                    }
                    else if (Array.isArray(input)) {
                        arr = input;
                    }
                    // Fallback: Jika Ethers mengembalikan object dengan index (0, 1, length)
                    else if (typeof input === 'object' && input.length !== undefined) {
                        arr = Array.from(input);
                    }
                    // Fallback: Data lama (String tunggal)
                    else if (typeof input === 'string') {
                        arr = [input];
                    }

                    // Filter sampah (string kosong atau tanda strip '-')
                    return arr.filter(item =>
                        typeof item === 'string' &&
                        item.length > 5 &&
                        item !== '-'
                    );
                };

                // Ambil data dengan fallback index (jika nama properti gagal)
                // Index 8 = certUrls, Index 9 = contestUrls (berdasarkan urutan struct di smart contract)
                const rawCertUrls = data.certUrls || data[8];
                const rawContestUrls = data.contestUrls || data[9];

                const cleanData = {
                    id: data.id,
                    variety: data.variety,
                    breeder: data.breeder,
                    gender: data.gender,
                    age: data.age,
                    size: data.size,
                    condition: data.condition,
                    photoUrl: data.photoUrl,
                    certUrls: extractArray(rawCertUrls),
                    contestUrls: extractArray(rawContestUrls),
                    timestamp: data.timestamp,
                    issuer: data.issuer,
                    currentOwner: data.currentOwner,
                    fatherId: data.fatherId || data[13] || "", // Index 13
                    motherId: data.motherId || data[14] || ""  // Index 14
                };

                setKoiData(cleanData);

                // 2. DATA RIWAYAT
                const history = await contract.getKoiHistory(koiId);
                setHistoryData([...history].reverse());

            } catch (err: any) {
                console.error("Fetch Error:", err);
                // Cek pesan error umum
                if (err.code === 'NETWORK_ERROR' || err.message.includes('could not detect network')) {
                    setError("Gagal terhubung ke Blockchain Lokal. Pastikan terminal 'npx hardhat node' menyala.");
                } else {
                    setError("Terjadi kesalahan saat membaca Smart Contract.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [koiId]);

    if (loading) return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white flex-col gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
            <p>Memverifikasi Keaslian Aset...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
            <Navbar />
            <div className="mt-10 bg-white p-10 rounded-3xl shadow-xl text-center max-w-md border border-red-100">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Gagal Verifikasi</h2>
                <p className="text-gray-500 mb-6">{error}</p>
                <div className="flex flex-col gap-3">
                    <Link href="/check" className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition block">
                        Cari ID Lain
                    </Link>
                    <Link href="/" className="text-gray-500 hover:text-orange-600 text-sm font-medium">
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 py-10">

                {/* Breadcrumb */}
                <div className="flex items-center justify-between mb-6">
                    <Link href="/check" className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-600 transition">
                        <ArrowLeft size={18} /> Kembali
                    </Link>
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-200 uppercase tracking-wide">
                        <ShieldCheck size={14} /> Terverifikasi Blockchain
                    </div>
                </div>

                {/* --- BAGIAN 1: DETAIL SERTIFIKAT UTAMA (DATA TERKINI) --- */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200 flex flex-col lg:flex-row mb-8">

                    <div className="lg:w-1/2 bg-gray-100 relative group">
                        <div className="w-full aspect-square relative bg-gray-200 overflow-hidden">
                            {koiData.photoUrl && koiData.photoUrl.length > 5 ? (
                                <img
                                    src={koiData.photoUrl}
                                    alt={koiData.variety}
                                    className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                            )}
                        </div>
                        <div className="absolute bottom-6 left-6 bg-white p-3 rounded-2xl shadow-xl border border-gray-100">
                            <QRCode value={typeof window !== 'undefined' ? window.location.href : ''} size={80} />
                        </div>
                    </div>

                    <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col">
                        <div className="mb-8 border-b border-gray-100 pb-6">
                            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{koiData.variety}</h1>
                            <div className="flex items-center gap-3">
                                <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">ID Asset</span>
                                <p className="text-xl text-gray-500 font-mono tracking-wide">{koiData.id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-8 gap-x-4 flex-grow mb-8">
                            <div><p className="text-xs text-gray-400 uppercase font-bold mb-1"><User size={12} /> Breeder</p><p className="text-lg font-semibold text-gray-900">{koiData.breeder}</p></div>
                            <div><p className="text-xs text-gray-400 uppercase font-bold mb-1"><Activity size={12} /> Gender</p><p className="text-lg font-semibold text-gray-900">{koiData.gender}</p></div>
                            <div><p className="text-xs text-gray-400 uppercase font-bold mb-1"><Calendar size={12} /> Umur</p><p className="text-lg font-semibold text-gray-900">{koiData.age}</p></div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold mb-1"><Ruler size={12} /> Ukuran</p>
                                {/* SAFE NUMBER RENDER */}
                                <p className="text-lg font-semibold text-gray-900">{formatNumber(koiData.size)} cm</p>
                            </div>
                            <div className="col-span-2"><p className="text-xs text-gray-400 uppercase font-bold mb-1">Kondisi Fisik</p><p className="text-lg font-semibold text-gray-900">{koiData.condition}</p></div>
                        </div>

                        {/* DOKUMEN PENDUKUNG */}
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-gray-400 uppercase">Dokumen Pendukung</p>
                            <div className="flex flex-wrap gap-3">
                                {/* Sertifikat Asli */}
                                {koiData.certUrls && koiData.certUrls.length > 0 ? (
                                    koiData.certUrls.map((url: string, idx: number) => (
                                        <a
                                            key={`cert-${idx}`}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:border-orange-500 hover:text-orange-600 transition shadow-sm"
                                        >
                                            <Tag size={16} /> {idx === 0 ? "Sertifikat Asli" : `Dokumen #${idx + 1}`}
                                        </a>
                                    ))
                                ) : (
                                    <span className="text-gray-400 text-sm italic bg-gray-50 px-3 py-2 rounded border border-dashed">Tidak ada sertifikat asli</span>
                                )}

                                {/* Sertifikat Lomba */}
                                {koiData.contestUrls && koiData.contestUrls.length > 0 ? (
                                    koiData.contestUrls.map((url: string, idx: number) => (
                                        <a
                                            key={`contest-${idx}`}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:border-blue-500 hover:text-blue-600 transition shadow-sm"
                                        >
                                            <Tag size={16} /> {idx === 0 ? "Sertifikat Lomba" : `Juara #${idx + 1}`}
                                        </a>
                                    ))
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- SILSILAH (LINEAGE) --- */}
                {(koiData.fatherId || koiData.motherId) && (
                    <div className="bg-orange-50 rounded-2xl border border-orange-100 p-8 mb-12">
                        <h3 className="text-xl font-bold text-orange-900 mb-6 flex items-center gap-2"><GitMerge /> Silsilah Keluarga (Lineage)</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            {koiData.fatherId && (
                                <Link href={`/koi/${koiData.fatherId}`} className="bg-white p-4 rounded-xl border border-orange-200 hover:shadow-md transition flex items-center justify-between group">
                                    <div><p className="text-xs font-bold text-orange-400 uppercase">Indukan Jantan (Bapak)</p><p className="font-mono text-lg font-bold text-gray-800">{koiData.fatherId}</p></div>
                                    <ArrowLeft className="rotate-180 text-orange-300 group-hover:text-orange-600 transition" />
                                </Link>
                            )}
                            {koiData.motherId && (
                                <Link href={`/koi/${koiData.motherId}`} className="bg-white p-4 rounded-xl border border-orange-200 hover:shadow-md transition flex items-center justify-between group">
                                    <div><p className="text-xs font-bold text-orange-400 uppercase">Indukan Betina (Ibu)</p><p className="font-mono text-lg font-bold text-gray-800">{koiData.motherId}</p></div>
                                    <ArrowLeft className="rotate-180 text-orange-300 group-hover:text-orange-600 transition" />
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                {/* --- TRACEABILITY (CLICKABLE) --- */}
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                        <History className="text-orange-600" />
                        Jejak Rekam (Traceability)
                    </h2>

                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 pb-10">
                        {historyData.map((item, index) => (
                            <div key={index} className="relative pl-10 group">
                                <div className={`absolute -left-[9px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm ${index === 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>

                                {/* KARTU BISA DIKLIK UNTUK LIHAT DETAIL */}
                                <div
                                    onClick={() => setSelectedHistory(item)}
                                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-orange-300 transition cursor-pointer relative"
                                >
                                    <div className="absolute top-4 right-4 text-gray-300 group-hover:text-orange-500 transition">
                                        <ZoomIn size={20} />
                                    </div>

                                    <div className="mb-2 pr-8">
                                        <span className="font-bold text-gray-800 text-lg block">
                                            {index === historyData.length - 1 ? "🎉 Minting (Pencatatan Awal)" : (item.note || "Update Data")}
                                        </span>
                                        <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-200 inline-block mt-1">
                                            {formatDate(item.timestamp)}
                                        </span>
                                    </div>

                                    {/* Mini Preview Data */}
                                    <div className="flex gap-4 items-center mt-4">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                                            {item.photoUrl && item.photoUrl.length > 5 ? <img src={item.photoUrl} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-300"><ImageIcon size={16} /></div>}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            <p><span className="font-bold">Size:</span> {formatNumber(item.size)} cm</p>
                                            <p><span className="font-bold">Age:</span> {item.age || '-'}</p>
                                        </div>
                                    </div>

                                    {/* DETAIL PEMILIK DI CARD */}
                                    <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-gray-50 pt-2 mt-3">
                                        <User size={12} />
                                        <span className="font-bold text-gray-800">{item.ownerName || "Tidak Diketahui"}</span>
                                        <span className="font-mono text-gray-400 text-[10px] ml-1 truncate max-w-[100px]">{item.owner}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- MODAL DETAIL HISTORY (SNAPSHOT) --- */}
                {selectedHistory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[90vh]">

                            {/* Tombol Close */}
                            <button
                                onClick={() => setSelectedHistory(null)}
                                className="absolute top-4 right-4 bg-white/80 p-2 rounded-full hover:bg-white text-gray-600 hover:text-red-500 z-10 transition shadow-sm"
                            >
                                <X size={24} />
                            </button>

                            {/* Kiri: Foto Besar */}
                            <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center p-4">
                                {selectedHistory.photoUrl && selectedHistory.photoUrl.length > 5 ? (
                                    <img src={selectedHistory.photoUrl} className="max-w-full max-h-[50vh] md:max-h-full object-contain rounded-lg shadow-lg" alt="Snapshot" />
                                ) : (
                                    <div className="text-gray-400 flex flex-col items-center">
                                        <ImageIcon size={48} />
                                        <span className="mt-2">Tidak ada foto</span>
                                    </div>
                                )}
                            </div>

                            {/* Kanan: Detail Data Snapshot */}
                            <div className="w-full md:w-1/2 p-8 overflow-y-auto">
                                <div className="mb-6 border-b pb-4">
                                    <span className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Historical Snapshot</span>
                                    <h2 className="text-2xl font-bold text-gray-900 mt-2">{selectedHistory.note || "Catatan Riwayat"}</h2>
                                    <p className="text-gray-500 text-sm mt-1">{formatDate(selectedHistory.timestamp)}</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                            <p className="text-xs text-gray-400 uppercase font-bold">Ukuran Saat Itu</p>
                                            <p className="text-lg font-semibold text-gray-800">{formatNumber(selectedHistory.size)} cm</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                            <p className="text-xs text-gray-400 uppercase font-bold">Umur Saat Itu</p>
                                            <p className="text-lg font-semibold text-gray-800">{selectedHistory.age || '-'}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Pemilik Pada Saat Itu</p>
                                        <div className="flex flex-col gap-1 bg-blue-50 p-3 rounded-xl text-blue-800 border border-blue-100">
                                            <span className="font-bold text-sm flex items-center gap-2"><User size={16} /> {selectedHistory.ownerName || "Tidak Diketahui"}</span>
                                            <span className="font-mono text-xs text-blue-600 break-all">{selectedHistory.owner}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 mt-4 border-t text-center">
                                        <a
                                            href={`https://etherscan.io/address/${selectedHistory.owner}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-blue-600 transition"
                                        >
                                            <ExternalLink size={14} /> Cek Transaksi di Explorer
                                        </a>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* Modal Preview Foto Sejarah (Double click protection) */}
                {previewImage && (
                    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-fade-in" onClick={() => setPreviewImage(null)}>
                        <img src={previewImage} className="max-w-full max-h-[95vh] rounded-xl shadow-2xl" alt="Preview" />
                    </div>
                )}
            </main>
        </div>
    );
}