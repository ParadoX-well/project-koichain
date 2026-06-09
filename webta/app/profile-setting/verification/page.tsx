'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, ArrowLeft, Briefcase, UserCheck, Store, MapPin, FileText, Upload, Loader2, Save, Trash2, AlertTriangle, CheckCircle2, Mail, Phone, Instagram } from 'lucide-react';
import Navbar from "@/components/Navbar";
import BackButton from '@/components/BackButton';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';

function VerificationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [profile, setProfile] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    // State Navigasi UI
    const [view, setView] = useState<'selection' | 'form'>('selection');
    const [selectedRole, setSelectedRole] = useState('');

    // State Form Lengkap
    const [formData, setFormData] = useState({
        personalName: '',
        personalAddress: '',
        personalPhone: '',
        storeName: '',
        storeAddress: '',
        storeDescription: '',
        contactEmail: '',
        contactPhone: '',
        instagram: ''
    });

    const [ktpFile, setKtpFile] = useState<File | null>(null);
    const [ktpSelfieFile, setKtpSelfieFile] = useState<File | null>(null);
    const [farmPhotoFile, setFarmPhotoFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [canceling, setCanceling] = useState(false);

    const { user: authUser } = useRequireAuth();

    useEffect(() => {
        const getData = async () => {
            if (!authUser) return;
            setUser(authUser);

            const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
            if (data) {
                setProfile(data);
                // Pre-fill data jika ada
                setFormData(prev => ({
                    ...prev,
                    personalName: data.full_name || '',
                    personalAddress: data.address || '',
                    personalPhone: data.phone || '',
                    storeName: data.store_name || '',
                    storeAddress: data.store_address || '',
                    storeDescription: data.store_description || '',
                    contactEmail: data.contact_email || authUser.email || '',
                    contactPhone: data.contact_phone || '',
                    instagram: data.instagram || ''
                }));

                // Jika datang dari popup landing page dengan ?upgrade=seller/breeder,
                // langsung skip ke form upgrade tanpa harus pilih manual
                const upgradeParam = searchParams.get('upgrade');
                if (upgradeParam && (upgradeParam === 'seller' || upgradeParam === 'breeder')) {
                    setSelectedRole(upgradeParam);
                    setView('form');
                }
            }
        };
        if (authUser) getData();
    }, [authUser, searchParams]);

    // Handle Pilih Role
    const handleSelectRole = (role: string) => {
        setSelectedRole(role);
        setView('form');
        // Pastikan form mengambil data dari profil jika data toko kosong
        if (!profile?.store_name) {
            setFormData(prev => ({
                ...prev,
                storeName: '',
                storeAddress: '',
                storeDescription: ''
            }));
        }
        setKtpFile(null);
        setKtpSelfieFile(null);
        setFarmPhotoFile(null);
    };

    // Upload Document Helper
    const uploadDocument = async (file: File, prefix: string, bucket: string = 'ktp-documents') => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${prefix}-${user.id}-${Date.now()}.${fileExt}`;
        const { error } = await supabase.storage.from(bucket).upload(fileName, file);
        if (error) throw error;
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return data.publicUrl;
    };

    // Submit Form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.personalName || !formData.personalAddress || !formData.personalPhone || !formData.storeName || !formData.storeAddress || !formData.contactEmail || !formData.contactPhone) {
            toast.error("Mohon lengkapi Data Pemilik, Data Usaha, dan Kontak!");
            return;
        }
        // KTP Wajib jika belum ada di database
        if ((!profile.ktp_url && !ktpFile) || (!profile.ktp_selfie_url && !ktpSelfieFile) || (!profile.farm_photo_url && !farmPhotoFile)) {
            toast.error("Wajib mengunggah semua dokumen (KTP, Selfie, dan Foto Bisnis)!");
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading("Menyimpan data...");

        try {
            let ktpUrl = profile.ktp_url;
            let ktpSelfieUrl = profile.ktp_selfie_url;
            let farmPhotoUrl = profile.farm_photo_url;

            if (ktpFile) ktpUrl = await uploadDocument(ktpFile, 'ktp');
            if (ktpSelfieFile) ktpSelfieUrl = await uploadDocument(ktpSelfieFile, 'selfie');
            if (farmPhotoFile) farmPhotoUrl = await uploadDocument(farmPhotoFile, 'farm', 'koi-photos');

            // LOGIKA KHUSUS: Jika user adalah ADMIN, jangan ubah role/request
            // Admin boleh mengisi data toko tanpa turun pangkat jadi breeder
            const isAdmin = profile.role === 'admin';

            const updates: any = {
                // Simpan untuk data Toko/Mitra
                store_name: formData.storeName,
                store_address: formData.storeAddress,
                store_description: formData.storeDescription,
                contact_email: formData.contactEmail,
                contact_phone: formData.contactPhone,
                instagram: formData.instagram,
                ktp_url: ktpUrl,
                ktp_selfie_url: ktpSelfieUrl,
                farm_photo_url: farmPhotoUrl,
                
                // Simpan untuk Profil Utama (Pribadi)
                full_name: formData.personalName,
                address: formData.personalAddress,
                phone: formData.personalPhone,
                
                updated_at: new Date()
            };

            // Jika BUKAN admin, set status request agar masuk antrian approval
            if (!isAdmin) {
                updates.requested_role = selectedRole;
            }

            const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);

            if (error) throw error;

            toast.success(isAdmin ? "Profil Bisnis Disimpan!" : "Pengajuan berhasil dikirim!", { id: toastId });
            window.location.reload();

        } catch (err: any) {
            console.error(err);
            toast.error("Gagal: " + err.message, { id: toastId });
            setSubmitting(false);
        }
    };

    // Reset
    const handleCancelRequest = async () => {
        if (!confirm("Yakin ingin membatalkan pengajuan?")) return;
        setCanceling(true);
        const { error } = await supabase.from('profiles').update({
            requested_role: null
        }).eq('id', user.id);

        if (!error) {
            toast.success("Dibatalkan.");
            window.location.reload();
        } else {
            toast.error("Gagal reset: " + error.message);
            setCanceling(false);
        }
    };

    if (!profile) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Memuat...</div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-orange-100/40 to-transparent pointer-events-none"></div>
            <div className="absolute top-20 -left-20 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 pointer-events-none"></div>
            <div className="absolute top-40 -right-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 pointer-events-none"></div>

            <Navbar />
            <Toaster position="top-center" />

            <main className="max-w-5xl mx-auto px-6 py-12 relative z-10">

                <div className="flex items-center gap-2 mb-8 bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-full w-fit border border-white/50 shadow-sm">
                    <BackButton />
                    <span className="text-gray-300">/</span>
                    <span className="text-gray-900 font-bold text-sm">Kemitraan</span>
                </div>

                <div className="mb-12 text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600 mb-6 tracking-tight drop-shadow-sm">
                        {profile.role === 'admin' ? "Profil Bisnis Admin" :
                            profile.requested_role ? "Status Pengajuan" :
                                view === 'selection' ? "Pilih Kemitraan" : `Formulir ${selectedRole === 'breeder' ? 'Breeder' : 'Penjual'}`}
                    </h1>
                    <p className="text-gray-500 text-lg md:text-xl max-w-3xl leading-relaxed">
                        {profile.role === 'admin' ? "Lengkapi data usaha Anda agar tampil sebagai Mitra Terverifikasi di sistem." :
                            profile.requested_role ? "Pantau status verifikasi akun Anda dari tim admin." : "Tingkatkan akun Anda menjadi Mitra resmi KoiChain dan nikmati seluruh fitur eksklusif Web3."}
                    </p>
                </div>

                {/* --- LOGIKA TAMPILAN UTAMA --- */}

                {/* 1. SUDAH JADI PARTNER (NON-ADMIN) */}
                {profile.role !== 'user' && profile.role !== 'admin' && view === 'selection' ? (
                    <>
                        {profile.role === 'seller,breeder' || (profile.role.includes('seller') && profile.role.includes('breeder')) ? (
                            <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] border border-green-200 shadow-xl text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                                <div className="absolute -top-20 -left-20 w-64 h-64 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

                                <div className="relative z-10">
                                    <div className="w-24 h-24 bg-gradient-to-br from-green-50 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-white">
                                        <CheckCircle2 size={48} className="text-green-500" />
                                    </div>
                                    <h2 className="text-3xl font-black text-green-900 mb-4 tracking-tight">Status Kemitraan Lengkap!</h2>
                                    <p className="text-gray-600 max-w-lg mx-auto mb-8 text-lg leading-relaxed">
                                        Anda telah berstatus sebagai <span className="font-black uppercase text-green-700 bg-green-50 px-2 py-1 rounded-lg">Seller</span> sekaligus <span className="font-black uppercase text-green-700 bg-green-50 px-2 py-1 rounded-lg">Breeder</span>. Semua fitur Web3 telah aktif.
                                    </p>
                                    <Link href="/minting" className="inline-block bg-green-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-600/30 transition transform hover:-translate-y-1">
                                        Mulai Registrasi Koi
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            /* Jika masih salah satu (seller atau breeder), tampilkan opsi upgrade */
                            <div className="space-y-8">
                                <div className="bg-green-50/80 backdrop-blur-md border border-green-200 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                                        <CheckCircle2 size={24} className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-green-900 text-lg">Anda terverifikasi sebagai Mitra <span className="uppercase font-black text-green-700">{profile.role}</span></p>
                                        <p className="text-green-700 mt-1">Ingin memperluas akses bisnis Anda? Ajukan diri sebagai {profile.role === 'seller' ? 'Breeder' : 'Seller'} di bawah ini.</p>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-8">
                                    {profile.role === 'seller' ? (
                                        <div onClick={() => handleSelectRole('breeder')} className="relative bg-white/80 backdrop-blur-xl border border-white shadow-xl rounded-[2rem] p-8 cursor-pointer group overflow-hidden hover:-translate-y-2 transition-all duration-500">
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50 group-hover:bg-blue-200 transition"></div>

                                            <div className="relative z-10 flex flex-col h-full">
                                                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                                    <UserCheck className="text-blue-600 w-8 h-8" />
                                                </div>
                                                <h4 className="font-black text-2xl mb-3 text-gray-900">Upgrade ke Breeder</h4>
                                                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">
                                                    Dapatkan akses khusus Farm untuk menerbitkan <b className="text-gray-800">Sertifikat Kelahiran</b> (Minting Web3).
                                                </p>
                                                <button className="w-full py-4 bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition shadow-sm">
                                                    Ajukan Upgrade
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div onClick={() => handleSelectRole('seller')} className="relative bg-white/80 backdrop-blur-xl border border-white shadow-xl rounded-[2rem] p-8 cursor-pointer group overflow-hidden hover:-translate-y-2 transition-all duration-500">
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-100 rounded-full blur-3xl opacity-50 group-hover:bg-purple-200 transition"></div>

                                            <div className="relative z-10 flex flex-col h-full">
                                                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                                    <Store className="text-purple-600 w-8 h-8" />
                                                </div>
                                                <h4 className="font-black text-2xl mb-3 text-gray-900">Upgrade ke Seller</h4>
                                                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">
                                                    Dapatkan akses khusus Toko/Dealer untuk menjual ikan dan menerbitkan sertifikat kepemilikan.
                                                </p>
                                                <button className="w-full py-4 bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition shadow-sm">
                                                    Ajukan Upgrade
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>

                    /* 2. PENDING REQUEST (NON-ADMIN) */
                ) : profile.requested_role && profile.role !== 'admin' ? (
                    <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] border border-yellow-200 shadow-xl text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-gradient-to-br from-yellow-50 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-white">
                                <Clock size={48} className="text-orange-500 animate-pulse" />
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Sedang Ditinjau Admin</h3>
                            <p className="text-gray-600 max-w-lg mx-auto mb-8 text-lg">
                                Anda telah mengajukan diri sebagai mitra <span className="font-black uppercase text-orange-600 bg-orange-50 px-3 py-1 rounded-lg ml-1">{profile.requested_role}</span>. Harap tunggu konfirmasi dari tim kami.
                            </p>

                            <div className="bg-orange-50/80 backdrop-blur border border-orange-100 p-6 rounded-2xl text-orange-800 mb-10 max-w-md mx-auto text-left shadow-sm">
                                <p className="flex items-center gap-2 mb-2 font-bold text-orange-900"><AlertTriangle size={18} /> Perhatian</p>
                                <p className="text-sm leading-relaxed">Jika Anda ingin mengubah data kontak, foto KTP, atau mengganti pilihan kemitraan, silakan batalkan pengajuan ini terlebih dahulu.</p>
                            </div>

                            <button
                                onClick={handleCancelRequest}
                                disabled={canceling}
                                className="inline-flex items-center gap-2 text-red-500 hover:text-white font-bold border-2 border-red-200 hover:border-red-500 hover:bg-red-500 px-8 py-4 rounded-xl transition-all shadow-sm active:scale-95"
                            >
                                {canceling ? <Loader2 className="animate-spin" /> : <Trash2 size={20} />}
                                Batalkan & Buat Pengajuan Baru
                            </button>
                        </div>
                    </div>

                    /* 3. PILIH ROLE (ADMIN ATAU USER AWAL) */
                ) : view === 'selection' ? (

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Breeder Card */}
                        <div onClick={() => handleSelectRole('breeder')} className="relative bg-white/80 backdrop-blur-xl border border-white shadow-xl rounded-[2rem] p-8 cursor-pointer group overflow-hidden hover:-translate-y-2 transition-all duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50 group-hover:bg-blue-200 transition"></div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <UserCheck className="text-blue-600 w-8 h-8" />
                                </div>
                                <h4 className="font-black text-2xl mb-3 text-gray-900">Breeder</h4>
                                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">
                                    Khusus untuk pembudidaya/breeder yang memijahkan ikan koi (spawning) dan menerbitkan <b className="text-gray-800">Sertifikat Kelahiran (Minting)</b> ke jaringan Web3.
                                </p>
                                <button className="w-full py-4 bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition shadow-sm">
                                    {profile.role === 'admin' ? 'Isi Data Breeder' : 'Pilih Breeder'}
                                </button>
                            </div>
                        </div>

                        {/* Seller Card */}
                        <div onClick={() => handleSelectRole('seller')} className="relative bg-white/80 backdrop-blur-xl border border-white shadow-xl rounded-[2rem] p-8 cursor-pointer group overflow-hidden hover:-translate-y-2 transition-all duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-100 rounded-full blur-3xl opacity-50 group-hover:bg-purple-200 transition"></div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <Store className="text-purple-600 w-8 h-8" />
                                </div>
                                <h4 className="font-black text-2xl mb-3 text-gray-900">Seller</h4>
                                <p className="text-gray-500 mb-8 leading-relaxed flex-grow">
                                    Khusus untuk penjual/seller yang mentransfer, memperbarui riwayat koi, dan memindahkan <b className="text-gray-800">Sertifikat Kepemilikan</b> kepada pembeli.
                                </p>
                                <button className="w-full py-4 bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition shadow-sm">
                                    {profile.role === 'admin' ? 'Isi Data Seller' : 'Pilih Seller'}
                                </button>
                            </div>
                        </div>
                    </div>

                    /* 4. FORM VIEW */
                ) : (

                    <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-2xl overflow-hidden relative">
                        <div className="bg-gradient-to-r from-orange-50 to-pink-50 px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-black text-xl text-gray-900 flex items-center gap-3">
                                <Briefcase className="text-orange-600" size={24} /> Data {selectedRole === 'breeder' ? 'Farm' : 'Toko'} {profile.role === 'admin' && '(Mode Admin)'}
                            </h3>
                            <button onClick={() => setView('selection')} className="text-sm font-bold text-gray-500 hover:text-red-500 bg-white px-5 py-2.5 rounded-full border border-gray-200 shadow-sm transition">Batalkan Pilihan</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-10">

                            {/* DATA PEMILIK (PRIBADI) */}
                            <div>
                                <h4 className="text-sm font-black text-orange-600 uppercase mb-5 border-b-2 border-orange-100 pb-3 inline-block">1. Data Pemilik (Profil Akun)</h4>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nama Pemilik <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <UserCheck className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                                            <input required type="text" value={formData.personalName} onChange={(e) => setFormData({ ...formData, personalName: e.target.value })} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-orange-200 transition-all outline-none" placeholder="Nama Lengkap Sesuai KTP" />
                                        </div>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">No. HP Pribadi <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                                            <input required type="text" value={formData.personalPhone} onChange={(e) => setFormData({ ...formData, personalPhone: e.target.value })} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-orange-200 transition-all outline-none" placeholder="0812xxx" />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Alamat Pemilik (Domisili) <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                                            <textarea required rows={2} value={formData.personalAddress} onChange={(e) => setFormData({ ...formData, personalAddress: e.target.value })} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-orange-200 transition-all outline-none resize-none" placeholder="Alamat rumah..." />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* IDENTITAS USAHA */}
                            <div>
                                <h4 className="text-sm font-black text-orange-600 uppercase mb-5 border-b-2 border-orange-100 pb-3 inline-block">2. Identitas Usaha</h4>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nama Usaha <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <Store className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                                            <input required type="text" value={formData.storeName} onChange={(e) => setFormData({ ...formData, storeName: e.target.value })} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-orange-200 transition-all outline-none" placeholder={selectedRole === 'breeder' ? "Nama Farm" : "Nama Toko"} />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Alamat Lengkap <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                                            <textarea required rows={2} value={formData.storeAddress} onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-orange-200 transition-all outline-none resize-none" placeholder="Alamat lengkap..." />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi Singkat</label>
                                        <div className="relative">
                                            <FileText className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                                            <textarea rows={2} value={formData.storeDescription} onChange={(e) => setFormData({ ...formData, storeDescription: e.target.value })} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-orange-200 transition-all outline-none resize-none" placeholder="Contoh: Spesialis Kohaku..." />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* KONTAK BISNIS */}
                            <div>
                                <h4 className="text-sm font-black text-orange-600 uppercase mb-5 border-b-2 border-orange-100 pb-3 inline-block">3. Kontak Bisnis</h4>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Email Bisnis <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                                            <input required type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-orange-200 transition-all outline-none" placeholder="email@bisnis.com" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">No. Telp / WA <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                                            <input required type="text" value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-orange-200 transition-all outline-none" placeholder="0812xxx" />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Instagram (Opsional)</label>
                                        <div className="relative">
                                            <Instagram className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                                            <input type="text" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-orange-200 transition-all outline-none" placeholder="@username" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* DOKUMEN */}
                            <div>
                                <h4 className="text-sm font-black text-orange-600 uppercase mb-5 border-b-2 border-orange-100 pb-3 inline-block">4. Dokumen Validasi (KYC)</h4>
                                
                                <div className="grid md:grid-cols-3 gap-6">
                                    {/* KTP */}
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-[1.5rem] border border-blue-100/50 flex flex-col h-full">
                                        <label className="block text-sm font-bold text-blue-900 mb-2">1. Foto KTP Asli {profile.ktp_url ? "(Tersimpan)" : <span className="text-red-500">*</span>}</label>
                                        <p className="text-xs text-blue-700 mb-4">Pastikan tulisan terbaca jelas dan tidak terpotong.</p>
                                        <div className="mt-auto border-2 border-dashed border-blue-300 bg-white/60 rounded-xl p-4 text-center relative hover:bg-white transition group cursor-pointer shadow-sm">
                                            <input required={!profile.ktp_url} type="file" accept="image/*" onChange={(e) => setKtpFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                            <Upload className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                                            <span className="text-xs font-bold text-gray-700 block">
                                                {ktpFile ? <span className="text-green-600">✅ {ktpFile.name}</span> : "Upload KTP"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* SELFIE KTP */}
                                    <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 p-6 rounded-[1.5rem] border border-purple-100/50 flex flex-col h-full">
                                        <label className="block text-sm font-bold text-purple-900 mb-2">2. Selfie Pegang KTP {profile.ktp_selfie_url ? "(Tersimpan)" : <span className="text-red-500">*</span>}</label>
                                        <p className="text-xs text-purple-700 mb-4">Wajah Anda dan KTP harus terlihat jelas dalam 1 frame.</p>
                                        <div className="mt-auto border-2 border-dashed border-purple-300 bg-white/60 rounded-xl p-4 text-center relative hover:bg-white transition group cursor-pointer shadow-sm">
                                            <input required={!profile.ktp_selfie_url} type="file" accept="image/*" onChange={(e) => setKtpSelfieFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                            <Upload className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                                            <span className="text-xs font-bold text-gray-700 block">
                                                {ktpSelfieFile ? <span className="text-green-600">✅ {ktpSelfieFile.name}</span> : "Upload Selfie KTP"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* FOTO FARM */}
                                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-[1.5rem] border border-orange-100/50 flex flex-col h-full">
                                        <label className="block text-sm font-bold text-orange-900 mb-2">3. Foto Bisnis/Kolam {profile.farm_photo_url ? "(Tersimpan)" : <span className="text-red-500">*</span>}</label>
                                        <p className="text-xs text-orange-700 mb-4">Bukti fisik operasional bisnis (Kolam / Toko).</p>
                                        <div className="mt-auto border-2 border-dashed border-orange-300 bg-white/60 rounded-xl p-4 text-center relative hover:bg-white transition group cursor-pointer shadow-sm">
                                            <input required={!profile.farm_photo_url} type="file" accept="image/*" onChange={(e) => setFarmPhotoFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                            <Upload className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                                            <span className="text-xs font-bold text-gray-700 block">
                                                {farmPhotoFile ? <span className="text-green-600">✅ {farmPhotoFile.name}</span> : "Upload Foto Lokasi"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 mt-8">
                                {profile.role !== 'admin' && !profile.requested_role && (
                                    <button type="button" onClick={() => setView('selection')} className="w-full md:w-1/4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-all">
                                        Batal
                                    </button>
                                )}
                                <button type="submit" disabled={submitting} className="flex-1 w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white font-black py-4 rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-lg">
                                    {submitting ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                                    {submitting ? "Menyimpan Data..." : profile.role === 'admin' ? "Simpan Profil Bisnis" : "Kirim Pengajuan Kemitraan"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function VerificationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Memuat...</div>}>
            <VerificationContent />
        </Suspense>
    );
}