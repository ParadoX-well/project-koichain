'use client';

import { useState, useEffect, use } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contractConfig';
import { ShieldCheck, Calendar, Ruler, Activity, User, Tag, ArrowLeft, AlertCircle, History, ExternalLink, ImageIcon, X, ZoomIn, GitMerge, Baby, MapPin, Download, FileDown, Printer } from 'lucide-react';
import Navbar from "@/components/Navbar";
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { supabase } from '@/lib/supabase';
import BackButton from '@/components/BackButton';
import { jsPDF } from 'jspdf';
import ImageLightbox from '@/components/ImageLightbox';
import Image from 'next/image';

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
    const [spawningSession, setSpawningSession] = useState<any>(null);
    
    // State untuk Modal History & Preview Image
    const [walletNames, setWalletNames] = useState<Record<string, string>>({});
    const [walletUserIds, setWalletUserIds] = useState<Record<string, string>>({});
    const [selectedHistory, setSelectedHistory] = useState<any>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [ownerProfile, setOwnerProfile] = useState<{ full_name: string, role: string, user_id?: string } | null>(null);
    const [breederProfile, setBreederProfile] = useState<{ full_name: string, role: string, user_id?: string } | null>(null);
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                if (!koiId) return;

                // Koneksi Blockchain Read-Only
                // Coba MetaMask dulu, fallback ke Hardhat localhost
                let provider: ethers.Provider;
                if (typeof window !== 'undefined' && window.ethereum) {
                    provider = new ethers.BrowserProvider(window.ethereum);
                } else {
                    // Fallback untuk browser HP atau tanpa MetaMask
                    provider = new ethers.JsonRpcProvider("https://sepolia.drpc.org");
                }
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

                // 2. DATA RIWAYAT + WALLET LOOKUP
                const rawHistory = await contract.getKoiHistory(koiId);
                const histArr = [...rawHistory].reverse();
                const wallets = [...new Set(histArr.map((h: any) => h.owner?.toLowerCase()).filter(Boolean))] as string[];
                if (wallets.length > 0) {
                    const { data: walletData } = await supabase
                        .from('user_wallets')
                        .select('wallet_address, user_id, profiles(full_name, role)')
                        .in('wallet_address', wallets);
                    if (walletData) {
                        const nameMap: Record<string, string> = {};
                        const idMap: Record<string, string> = {};
                        walletData.forEach((w: any) => {
                            if (w.wallet_address) {
                                if (w.profiles) {
                                    const profData = Array.isArray(w.profiles) ? w.profiles[0] : w.profiles;
                                    nameMap[w.wallet_address.toLowerCase()] = profData?.full_name;
                                }
                                if (w.user_id) {
                                    idMap[w.wallet_address.toLowerCase()] = w.user_id;
                                }
                            }
                        });
                        setWalletNames(nameMap);
                        setWalletUserIds(idMap);

                        // Cari profil pemilik SAAT INI (currentOwner dari blockchain)
                        const currentOwnerLower = cleanData.currentOwner?.toLowerCase();
                        const ownerW = walletData.find((w: any) => w.wallet_address?.toLowerCase() === currentOwnerLower);
                        
                        if (ownerW && ownerW.profiles) {
                            const profData = Array.isArray(ownerW.profiles) ? ownerW.profiles[0] : ownerW.profiles;
                            if (profData) {
                                setOwnerProfile({
                                    full_name: profData.full_name,
                                    role: profData.role,
                                    user_id: ownerW.user_id
                                });
                            }
                        }
                    }
                }
                setHistoryData(histArr);

                // 3. FETCH SPAWNING SESSION & BREEDER PROFILE dari Supabase
                const { data: cert } = await supabase
                    .from('koi_certificates')
                    .select('breeder_id')
                    .eq('koi_id', koiId)
                    .maybeSingle();

                if (cert && cert.breeder_id) {
                    const { data: bProf } = await supabase
                        .from('profiles')
                        .select('full_name, role')
                        .eq('id', cert.breeder_id)
                        .maybeSingle();
                    if (bProf) {
                        setBreederProfile({
                            full_name: bProf.full_name,
                            role: bProf.role,
                            user_id: cert.breeder_id
                        });
                    }
                }

                // 4. FETCH SPAWNING SESSION dari Supabase
                // Format ID anakan: KOI-YYYY-XXXX-NNN → session_code: KOI-YYYY-XXXX atau SPAWN-YYYY-XXXX
                const parts = koiId.split('-');
                if (parts.length >= 4 && parts[0] === 'KOI') {
                    const sessionCodeNew = `KOI-${parts[1]}-${parts[2]}`;
                    const sessionCodeOld = `SPAWN-${parts[1]}-${parts[2]}`;
                    const { data: sessionData, error: sessionErr } = await supabase
                        .from('spawning_sessions')
                        .select('*, spawning_fathers(father_koi_id), profiles(full_name)')
                        .or(`session_code.eq.${sessionCodeNew},session_code.eq.${sessionCodeOld}`)
                        .maybeSingle();
                        
                    if (sessionData && !sessionErr) {
                        setSpawningSession(sessionData);
                    }
                }

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

    // CEK APAKAH USER YANG LOGIN ADALAH PEMILIK SAAT INI
    useEffect(() => {
        const checkOwnership = async () => {
            if (!koiData?.currentOwner) return;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setIsOwner(false); return; }

            // METODE 1: Cek dari tabel user_wallets
            const { data: wallets } = await supabase
                .from('user_wallets')
                .select('wallet_address')
                .eq('user_id', user.id);
            if (wallets && wallets.some(
                (w: any) => w.wallet_address?.toLowerCase() === koiData.currentOwner?.toLowerCase()
            )) {
                setIsOwner(true);
                return;
            }

            // METODE 2: Cek dari tabel koi_certificates (diisi saat minting)
            const { data: cert } = await supabase
                .from('koi_certificates')
                .select('breeder_id, wallet_address')
                .eq('koi_id', koiId)
                .maybeSingle();
            if (cert) {
                // Cocokkan breeder_id (user_id) ATAU wallet_address
                if (cert.breeder_id === user.id ||
                    cert.wallet_address?.toLowerCase() === koiData.currentOwner?.toLowerCase()) {
                    setIsOwner(true);
                    return;
                }
            }

            // METODE 3: Cek MetaMask yang aktif saat ini
            if (typeof window !== 'undefined' && (window as any).ethereum) {
                try {
                    const provider = new ethers.BrowserProvider((window as any).ethereum);
                    const signer = await provider.getSigner();
                    const address = await signer.getAddress();
                    if (address.toLowerCase() === koiData.currentOwner?.toLowerCase()) {
                        setIsOwner(true);
                        return;
                    }
                } catch { /* MetaMask tidak terhubung, skip */ }
            }

            setIsOwner(false);
        };
        checkOwnership();
    }, [koiData, koiId]);

    const downloadQRCode = () => {
        const svg = document.getElementById("QRCode");
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement("a");
        downloadLink.href = url;
        downloadLink.download = `QR-${koiId}.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    // GENERATE SERTIFIKAT PDF
    const generateCertificatePDF = async () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const W = 297, H = 210;

        // Background putih + border emas
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, W, H, 'F');
        // Border luar
        doc.setDrawColor(180, 140, 60);
        doc.setLineWidth(2);
        doc.rect(8, 8, W - 16, H - 16);
        // Border dalam
        doc.setLineWidth(0.5);
        doc.rect(12, 12, W - 24, H - 24);

        // HEADER
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        doc.setTextColor(180, 140, 60);
        doc.text('SERTIFIKAT KEASLIAN', W / 2, 35, { align: 'center' });
        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text('Certificate of Authenticity — KoiChain Blockchain', W / 2, 44, { align: 'center' });

        // Garis dekoratif
        doc.setDrawColor(180, 140, 60);
        doc.setLineWidth(0.8);
        doc.line(40, 50, W - 40, 50);

        // DATA IKAN - Kolom Kiri
        const startY = 62;
        const leftX = 30;
        doc.setFontSize(10);
        doc.setTextColor(130, 130, 130);
        doc.setFont('helvetica', 'normal');

        const fields = [
            ['ID Asset', koiData.id],
            ['Varietas', koiData.variety],
            ['Breeder', breederProfile?.full_name || koiData.breeder],
            ['Gender', koiData.gender],
            ['Umur', koiData.age || '-'],
            ['Ukuran', koiData.size ? `${koiData.size} cm` : '-'],
            ['Catatan', koiData.condition || '-'],
            ['Pemilik Sah', ownerProfile?.full_name || '-'],
            ['Tanggal Terbit', formatDate(koiData.timestamp)],
        ];

        fields.forEach(([label, value], i) => {
            const y = startY + (i * 11);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            doc.text(String(label), leftX, y);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(40, 40, 40);
            doc.text(String(value || '-'), leftX + 45, y);
        });

        // QR CODE - render SVG ke canvas lalu ke PDF
        const svgEl = document.getElementById('QRCode');
        if (svgEl) {
            const svgData = new XMLSerializer().serializeToString(svgEl);
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 400;
            const ctx = canvas.getContext('2d');
            const img = new window.Image();
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
            await new Promise<void>((resolve) => {
                img.onload = () => {
                    ctx?.drawImage(img, 0, 0, 400, 400);
                    resolve();
                };
            });
            const qrDataUrl = canvas.toDataURL('image/png');
            doc.addImage(qrDataUrl, 'PNG', W - 85, 60, 55, 55);
            doc.setFontSize(8);
            doc.setTextColor(130, 130, 130);
            doc.setFont('helvetica', 'normal');
            doc.text('Scan untuk verifikasi', W - 57.5, 120, { align: 'center' });
        }

        // FOTO IKAN - coba embed
        if (koiData.photoUrl && koiData.photoUrl.length > 5) {
            try {
                const response = await fetch(koiData.photoUrl);
                const blob = await response.blob();
                const dataUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
                doc.addImage(dataUrl, 'JPEG', W - 85, 125, 55, 55);
            } catch { /* skip jika CORS */ }
        }

        // FOOTER
        doc.setDrawColor(180, 140, 60);
        doc.setLineWidth(0.5);
        doc.line(40, H - 35, W - 40, H - 35);
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        doc.setFont('helvetica', 'italic');
        doc.text('Dokumen ini diterbitkan secara otomatis oleh sistem KoiChain dan diverifikasi melalui Smart Contract Blockchain.', W / 2, H - 28, { align: 'center' });
        doc.text(`Issuer Wallet: ${koiData.issuer}`, W / 2, H - 23, { align: 'center' });
        doc.text(`Owner Wallet: ${koiData.currentOwner}`, W / 2, H - 18, { align: 'center' });

        doc.save(`Sertifikat-${koiData.id}.pdf`);
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white flex-col gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
            <p>Memverifikasi Keaslian Aset...</p>
        </div>
    );

    // Ekstrak Catatan Terkini dari history terakhir (menghilangkan prefix Kondisi: ... |)
    const latestHistory = historyData.length > 0 ? historyData[0] : null;
    let catatanTerkini = "-";
    if (latestHistory && latestHistory.note) {
        if (latestHistory.note.includes(" | ")) {
            const parts = latestHistory.note.split(" | ");
            catatanTerkini = parts.slice(1).join(" | ");
        } else if (!latestHistory.note.startsWith("Kondisi: ")) {
            catatanTerkini = latestHistory.note;
        }
    }

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Navbar />
            <div className="flex-grow flex flex-col items-center justify-center p-4">
                <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md border border-red-100">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Gagal Verifikasi</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <div className="flex flex-col gap-3">
                        <Link href="/check" className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition block mb-2">
                            Cari ID Lain
                        </Link>
                        <BackButton />
                    </div>
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
                    <BackButton />
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-200 uppercase tracking-wide">
                        <ShieldCheck size={14} /> Terverifikasi Blockchain
                    </div>
                </div>

                {/* --- BAGIAN 1: DETAIL SERTIFIKAT UTAMA (DATA TERKINI) --- */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200 flex flex-col lg:flex-row mb-8">

                    <div className="lg:w-1/2 bg-gray-100 relative group">
                        <div className="w-full aspect-square relative bg-gray-200 overflow-hidden">
                            {koiData.photoUrl && koiData.photoUrl.length > 5 ? (
                                <ImageLightbox
                                    src={koiData.photoUrl}
                                    alt={koiData.variety}
                                    fill={true}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                            )}
                        </div>
                        <div className="absolute bottom-6 left-6 bg-white p-3 rounded-2xl shadow-xl border border-gray-100 group/qr">
                            <QRCode id="QRCode" value={typeof window !== 'undefined' ? window.location.href : ''} size={160} />
                            
                            {/* Tombol Download QR (HANYA OWNER) */}
                            {isOwner && (
                                <button 
                                    onClick={downloadQRCode}
                                    className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover/qr:opacity-100 transition-opacity duration-300"
                                    title="Download QR Code (SVG High-Res)"
                                >
                                    <Download size={24} className="mb-1" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Simpan</span>
                                </button>
                            )}
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

                        {/* Pemilik Terkini */}
                        {ownerProfile && (
                            <div className="mb-6 flex-1 bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
                                    <User className="text-orange-600" />
                                </div>
                                <div className="flex-grow">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Pemilik Terkini</p>
                                    <div className="flex items-center gap-2">
                                        {ownerProfile?.user_id ? (
                                            <Link href={`/user/${ownerProfile.user_id}`} className="font-bold text-gray-900 hover:text-orange-600 transition truncate max-w-[200px]">
                                                {ownerProfile.full_name}
                                            </Link>
                                        ) : (
                                            <p className="font-bold text-gray-900 truncate max-w-[200px]">
                                                {ownerProfile?.full_name || 'Anonymous'}
                                            </p>
                                        )}
                                        {ownerProfile?.role === 'admin' && (
                                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold">ADMIN</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                                    {ownerProfile.role?.includes('seller') && (
                                        <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase border border-purple-200">Seller</span>
                                    )}
                                    {ownerProfile.role?.includes('breeder') && (
                                        <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase border border-blue-200">Breeder</span>
                                    )}
                                    {!ownerProfile.role?.includes('seller') && !ownerProfile.role?.includes('breeder') && !ownerProfile.role?.includes('admin') && (
                                        <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2.5 py-1 rounded-full uppercase border border-gray-200">{ownerProfile.role}</span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-y-8 gap-x-4 flex-grow mb-8">
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold mb-1"><User size={12} className="inline mr-1" /> Original Breeder</p>
                                {breederProfile ? (
                                    <Link href={`/user/${breederProfile.user_id}`} className="text-lg font-semibold text-gray-900 hover:text-orange-600 transition underline decoration-orange-300 decoration-2 underline-offset-4">
                                        {breederProfile.full_name}
                                    </Link>
                                ) : (
                                    <p className="text-lg font-semibold text-gray-900">{koiData.breeder}</p>
                                )}
                            </div>
                            <div><p className="text-xs text-gray-400 uppercase font-bold mb-1"><Activity size={12} /> Gender</p><p className="text-lg font-semibold text-gray-900">{koiData.gender}</p></div>
                            <div><p className="text-xs text-gray-400 uppercase font-bold mb-1"><Calendar size={12} /> Umur</p><p className="text-lg font-semibold text-gray-900">{koiData.age}</p></div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold mb-1"><Ruler size={12} /> Ukuran</p>
                                {/* SAFE NUMBER RENDER */}
                                <p className="text-lg font-semibold text-gray-900">{formatNumber(koiData.size)} cm</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Kondisi Terkini</p>
                                <p className="text-lg font-semibold text-gray-900">{koiData.condition || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Catatan</p>
                                <p className="text-sm font-medium text-gray-700 italic border-l-2 border-orange-300 pl-2 mt-1">{catatanTerkini}</p>
                            </div>
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
                                            <Tag size={16} /> {koiData.certUrls.length > 1 ? `Sertifikat Asli ${idx + 1}` : "Sertifikat Asli"}
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
                                            <Tag size={16} /> {koiData.contestUrls.length > 1 ? `Sertifikat Lomba ${idx + 1}` : "Sertifikat Lomba"}
                                        </a>
                                    ))
                                ) : null}
                            </div>
                        </div>

                        {/* TOMBOL CETAK SERTIFIKAT & DOWNLOAD QR — HANYA OWNER */}
                        {isOwner && (
                            <div className="pt-6 border-t border-gray-100 mt-auto">
                                <p className="text-xs text-gray-400 uppercase font-bold mb-3">Aksi Pemilik</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={generateCertificatePDF}
                                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-orange-600/30 transition transform hover:-translate-y-0.5"
                                    >
                                        <Printer size={18} /> Cetak Sertifikat PDF
                                    </button>
                                    <button
                                        onClick={downloadQRCode}
                                        className="flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl font-bold hover:bg-gray-800 transition"
                                    >
                                        <FileDown size={18} /> QR Code
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- SILSILAH (LINEAGE) --- */}
                {(koiData.fatherId || koiData.motherId || spawningSession) && (
                    <div className="bg-orange-50 rounded-2xl border border-orange-100 p-8 mb-8">
                        <h3 className="text-xl font-bold text-orange-900 mb-6 flex items-center gap-2">
                            <GitMerge /> Silsilah Keluarga (Lineage)
                        </h3>

                        {/* Info Sesi Pemijahan */}
                        {spawningSession && (
                            <div className="bg-white rounded-xl border border-orange-200 p-4 mb-5 flex flex-wrap gap-4 items-center">
                                <div className="flex items-center gap-2">
                                    <Baby size={16} className="text-orange-500" />
                                    <span className="text-xs font-bold text-gray-500 uppercase">Sesi Pemijahan</span>
                                    <span className="font-mono font-black text-orange-600">{spawningSession.session_code}</span>
                                </div>
                                {spawningSession.profiles?.full_name && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                        <User size={13} className="text-blue-400" />
                                        <span className="font-bold">{spawningSession.profiles.full_name}</span>
                                        <span className="text-gray-400">(Breeder)</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Calendar size={13} className="text-orange-400" />
                                    {new Date(spawningSession.spawn_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                                {spawningSession.location && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <MapPin size={13} className="text-red-400" /> {spawningSession.location}
                                    </div>
                                )}
                                {spawningSession.notes && (
                                    <p className="w-full text-xs italic text-gray-400">📝 {spawningSession.notes}</p>
                                )}
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Induk Betina (Ibu) */}
                            {(koiData.motherId || spawningSession?.mother_koi_id) && (
                                <Link href={`/koi/${koiData.motherId || spawningSession.mother_koi_id}`}
                                    className="bg-white p-4 rounded-xl border border-pink-200 hover:shadow-md transition flex items-center justify-between group">
                                    <div>
                                        <p className="text-xs font-bold text-pink-400 uppercase mb-0.5">Indukan Betina (Ibu)</p>
                                        <p className="font-mono text-lg font-bold text-gray-800">{koiData.motherId || spawningSession.mother_koi_id}</p>
                                    </div>
                                    <ArrowLeft className="rotate-180 text-pink-300 group-hover:text-pink-600 transition" />
                                </Link>
                            )}

                            {/* Multi Induk Jantan (Ayah) dari spawning session */}
                            {spawningSession?.spawning_fathers?.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-blue-400 uppercase mb-1">Indukan Jantan (Ayah)</p>
                                    {spawningSession.spawning_fathers.map((f: any) => (
                                        <Link key={f.father_koi_id} href={`/koi/${f.father_koi_id}`}
                                            className="bg-white p-3 rounded-xl border border-blue-200 hover:shadow-md transition flex items-center justify-between group block">
                                            <p className="font-mono font-bold text-gray-800">{f.father_koi_id}</p>
                                            <ArrowLeft className="rotate-180 text-blue-300 group-hover:text-blue-600 transition" />
                                        </Link>
                                    ))}
                                </div>
                            ) : !spawningSession && koiData.fatherId ? (
                                // Fallback: hanya jika bukan dari spawning session
                                koiData.fatherId.split(',').filter(Boolean).map((fid: string) => (
                                    <Link key={fid.trim()} href={`/koi/${fid.trim()}`}
                                        className="bg-white p-4 rounded-xl border border-blue-200 hover:shadow-md transition flex items-center justify-between group">
                                        <div>
                                            <p className="text-xs font-bold text-blue-400 uppercase mb-0.5">Indukan Jantan (Ayah)</p>
                                            <p className="font-mono text-lg font-bold text-gray-800">{fid.trim()}</p>
                                        </div>
                                        <ArrowLeft className="rotate-180 text-blue-300 group-hover:text-blue-600 transition" />
                                    </Link>
                                ))
                            ) : null}
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

                                    <div className="mb-2">
                                        <span className="font-bold text-gray-800 text-lg block">
                                            {(() => {
                                                if (index === historyData.length - 1) return "🎉 Minting (Pencatatan Awal)";
                                                if (index < historyData.length - 1 && historyData[index].owner !== historyData[index + 1]?.owner) {
                                                    return "🤝 Transfer Kepemilikan";
                                                }
                                                return "📝 Update Pertumbuhan";
                                            })()}
                                        </span>
                                        <p className="text-xs text-gray-400 mt-1 mb-3">
                                            {formatDate(item.timestamp)}
                                        </p>
                                        <div className="flex gap-4 items-start">
                                            <div className="w-12 h-12 relative rounded-lg overflow-hidden shrink-0 border border-gray-200">
                                                {item.photoUrl && item.photoUrl.length > 5 ? (
                                                    <Image src={item.photoUrl} alt="History" fill={true} style={{ objectFit: 'cover' }} className="hover:scale-110 transition-transform cursor-pointer" onClick={() => setPreviewImage(item.photoUrl)} />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400"><ImageIcon size={16} /></div>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 w-full space-y-1">
                                                <p><span className="font-bold">Size:</span> {formatNumber(item.size)} cm</p>
                                                <p><span className="font-bold">Age:</span> {item.age || '-'}</p>
                                                
                                                {/* Pisahkan Kondisi dan Catatan */}
                                                {item.note && item.note.includes(" | ") ? (
                                                    <div className="mt-2 space-y-1 border-l-2 border-gray-200 pl-2">
                                                        <p className="text-gray-700"><span className="font-bold text-gray-900">Kondisi:</span> {item.note.split(" | ")[0].replace("Kondisi: ", "")}</p>
                                                        <p className="text-gray-700 italic line-clamp-2"><span className="font-bold text-gray-900 not-italic">Catatan:</span> {item.note.split(" | ").slice(1).join(" | ")}</p>
                                                    </div>
                                                ) : (
                                                    <p className="mt-2 text-gray-700 italic line-clamp-2 border-l-2 border-gray-200 pl-2">
                                                        {item.note || 'Tidak ada catatan'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* DETAIL PEMILIK DI CARD */}
                                    <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-gray-50 pt-2 mt-3">
                                        <User size={12} />
                                        {walletUserIds[item.owner?.toLowerCase()] ? (
                                            <Link href={`/user/${walletUserIds[item.owner?.toLowerCase()]}`} className="font-bold text-gray-800 hover:text-orange-600 transition">
                                                {walletNames[item.owner?.toLowerCase()] || item.ownerName || 'Tidak Diketahui'}
                                            </Link>
                                        ) : (
                                            <span className="font-bold text-gray-800">
                                                {walletNames[item.owner?.toLowerCase()] || item.ownerName || 'Tidak Diketahui'}
                                            </span>
                                        )}
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
                            <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center p-4 relative h-64 md:h-auto">
                                {selectedHistory.photoUrl && selectedHistory.photoUrl.length > 5 ? (
                                    <ImageLightbox src={selectedHistory.photoUrl} alt="Snapshot" fill={true} />
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
                                    <h2 className="text-2xl font-bold text-gray-900 mt-2">
                                        {/* Tentukan title Modal secara dinamis */}
                                        {(() => {
                                            const idx = historyData.findIndex(h => h.timestamp === selectedHistory.timestamp);
                                            if (idx === historyData.length - 1) return "🎉 Minting (Pencatatan Awal)";
                                            if (idx < historyData.length - 1 && historyData[idx].owner !== historyData[idx + 1]?.owner) return "🤝 Transfer Kepemilikan";
                                            return "📝 Update Pertumbuhan";
                                        })()}
                                    </h2>
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
                                        <div className="bg-gray-50 p-3 rounded-xl col-span-2">
                                            <p className="text-xs text-gray-400 uppercase font-bold mb-2">Kondisi / Catatan Tambahan</p>
                                            {selectedHistory.note && selectedHistory.note.includes(" | ") ? (
                                                <div className="space-y-2">
                                                    <p className="text-sm text-gray-800"><span className="font-bold">Kondisi:</span> {selectedHistory.note.split(" | ")[0].replace("Kondisi: ", "")}</p>
                                                    <p className="text-sm text-gray-700 italic"><span className="font-bold not-italic">Catatan:</span> {selectedHistory.note.split(" | ").slice(1).join(" | ")}</p>
                                                </div>
                                            ) : (
                                                <p className="text-sm font-semibold text-gray-800 mt-1">{selectedHistory.note || 'Tidak ada catatan tambahan'}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Pemilik Pada Saat Itu</p>
                                        <div className="flex flex-col gap-1 bg-blue-50 p-3 rounded-xl text-blue-800 border border-blue-100">
                                            <div className="flex items-center gap-2">
                                                <User size={16} />
                                                {walletUserIds[selectedHistory.owner?.toLowerCase()] ? (
                                                    <Link href={`/user/${walletUserIds[selectedHistory.owner?.toLowerCase()]}`} className="font-bold text-sm hover:text-orange-600 transition">
                                                        {walletNames[selectedHistory.owner?.toLowerCase()] || selectedHistory.ownerName || 'Tidak Diketahui'}
                                                    </Link>
                                                ) : (
                                                    <span className="font-bold text-sm">{walletNames[selectedHistory.owner?.toLowerCase()] || selectedHistory.ownerName || 'Tidak Diketahui'}</span>
                                                )}
                                            </div>
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