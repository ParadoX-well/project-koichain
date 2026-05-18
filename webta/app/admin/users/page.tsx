'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, User, Briefcase, ArrowLeft, Store, MapPin, FileText, Ban, Trash2, ShieldOff, Search, Phone, Mail, Instagram, X } from 'lucide-react';
import Navbar from "@/components/Navbar";
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'partners'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State untuk Modal Detail Partner
  const [selectedPartner, setSelectedPartner] = useState<any>(null);

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    
    // 1. Ambil Request (Pending)
    const { data: reqData } = await supabase
      .from('profiles')
      .select('*')
      .not('requested_role', 'is', null) 
      .order('updated_at', { ascending: false });
    setRequests(reqData || []);

    // 2. Ambil Mitra (Breeder & Seller)
    const { data: partnerData } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['breeder', 'seller']) 
      .order('full_name', { ascending: true });
    setPartners(partnerData || []);
    
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- AKSI: APPROVE REQUEST ---
  const handleApprove = async (id: string, newRole: string) => {
    if(!confirm(`ACC user ini menjadi ${newRole}?`)) return;
    
    const { error } = await supabase.from('profiles')
        .update({ 
            role: newRole, 
            requested_role: null, 
            verification_status: 'verified' 
        })
        .eq('id', id);

    if(!error) { 
        toast.success("User berhasil di-ACC!"); 
        fetchData(); 
    } else {
        toast.error("Gagal update: " + error.message);
    }
  };

  // --- AKSI: TOLAK REQUEST ---
  const handleReject = async (id: string) => {
    if(!confirm("Tolak pengajuan ini?")) return;

    const { error } = await supabase.from('profiles')
        .update({ 
            requested_role: null, 
            verification_status: 'rejected' 
        })
        .eq('id', id);
    
    if(!error) { 
        toast.success("Pengajuan ditolak."); 
        fetchData(); 
    }
  };

  // --- AKSI: COPOT JABATAN (DOWNGRADE) ---
  const handleDowngrade = async (id: string, name: string) => {
    if(!confirm(`Yakin ingin mencopot jabatan ${name} menjadi User biasa?`)) return;
    
    const { error } = await supabase.from('profiles')
        .update({ role: 'user' }) 
        .eq('id', id);
    
    if(!error) { 
        toast.success("Jabatan berhasil dicopot."); 
        fetchData();
        setSelectedPartner(null); // Tutup modal jika sedang dibuka
    }
  };

  // --- AKSI: BAN / UNBAN USER ---
  const handleToggleBan = async (id: string, currentStatus: boolean) => {
    const action = currentStatus ? "UNBAN" : "BAN";
    if(!confirm(`Yakin ingin ${action} user ini?`)) return;
    
    const { error } = await supabase.from('profiles')
        .update({ is_banned: !currentStatus })
        .eq('id', id);

    if(!error) { 
        toast.success(currentStatus ? "User dipulihkan." : "User berhasil di-Banned!"); 
        fetchData(); 
        setSelectedPartner(null); // Tutup modal jika sedang dibuka
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 relative">
      <Navbar />
      <Toaster position="top-center" />
      
      <main className="max-w-6xl mx-auto px-4 py-10">
        
        {/* Header */}
        <Link href="/admin" className="flex items-center gap-2 text-gray-500 mb-6 hover:text-orange-600 transition w-fit">
            <ArrowLeft size={18}/> Kembali ke Dashboard
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold">Kelola Pengguna</h1>
                <p className="text-gray-500">Verifikasi pengajuan dan manajemen mitra.</p>
            </div>
            
            {/* TABS NAVIGASI */}
            <div className="bg-white p-1 rounded-lg border border-gray-200 inline-flex shadow-sm">
                <button 
                    onClick={() => setActiveTab('requests')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${activeTab === 'requests' ? 'bg-pink-100 text-pink-700' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Briefcase size={16} /> Permintaan Baru
                    {requests.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{requests.length}</span>}
                </button>
                <button 
                    onClick={() => setActiveTab('partners')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${activeTab === 'partners' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Store size={16} /> Daftar Mitra
                    <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full">{partners.length}</span>
                </button>
            </div>
        </div>

        {/* --- KONTEN TAB: PERMINTAAN BARU --- */}
        {activeTab === 'requests' && (
            <div className="space-y-4">
                {requests.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                        <Briefcase className="mx-auto h-12 w-12 text-gray-200 mb-2"/>
                        Tidak ada permintaan upgrade akun saat ini.
                    </div>
                )}
                
                {requests.map((req) => (
                    <div key={req.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-6 hover:border-pink-300 transition">
                        
                        {/* Info User & Bisnis */}
                        <div className="flex-grow space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-xl flex items-center gap-2">
                                        {req.full_name || 'User Tanpa Nama'} 
                                        <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded font-mono">ID: {req.id.slice(0,8)}...</span>
                                    </h3>
                                </div>
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 uppercase flex items-center gap-1">
                                    Ingin Jadi: {req.requested_role}
                                </span>
                            </div>
                            
                            {/* Data Bisnis Lengkap */}
                            <div className="grid md:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div>
                                    <span className="block text-gray-400 font-bold text-xs uppercase mb-1">Nama Bisnis</span>
                                    <span className="font-medium text-gray-800">{req.store_name || '-'}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-400 font-bold text-xs uppercase mb-1">Alamat</span>
                                    <span className="font-medium text-gray-800">{req.store_address || '-'}</span>
                                </div>
                                
                                {/* Kontak - Baru Ditambahkan */}
                                <div>
                                    <span className="block text-gray-400 font-bold text-xs uppercase mb-1">Email Kontak</span>
                                    <span className="flex items-center gap-1 text-gray-800"><Mail size={12}/> {req.contact_email || '-'}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-400 font-bold text-xs uppercase mb-1">No. Telp / WA</span>
                                    <span className="flex items-center gap-1 text-gray-800"><Phone size={12}/> {req.contact_phone || '-'}</span>
                                </div>
                                {req.instagram && (
                                    <div className="col-span-2">
                                        <span className="block text-gray-400 font-bold text-xs uppercase mb-1">Instagram</span>
                                        <span className="flex items-center gap-1 text-blue-600 font-medium"><Instagram size={12}/> {req.instagram}</span>
                                    </div>
                                )}

                                <div className="col-span-2 pt-2 border-t border-gray-200 mt-2">
                                    <span className="block text-gray-400 font-bold text-xs uppercase mb-1">Deskripsi</span>
                                    <span className="italic text-gray-600">{req.store_description || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* KTP & Aksi */}
                        <div className="lg:w-72 flex flex-col gap-3">
                            <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                                <p className="text-xs font-bold text-gray-400 mb-2 uppercase text-center">Dokumen KTP</p>
                                {req.ktp_url ? (
                                    <a href={req.ktp_url} target="_blank" rel="noreferrer" className="block relative aspect-video bg-gray-200 rounded overflow-hidden group">
                                        <img src={req.ktp_url} alt="KTP" className="w-full h-full object-cover group-hover:scale-105 transition" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition font-bold">
                                            Lihat Perbesar
                                        </div>
                                    </a>
                                ) : (
                                    <div className="h-24 flex items-center justify-center text-gray-400 text-xs italic bg-gray-100 rounded">Tidak ada foto KTP</div>
                                )}
                            </div>
                            
                            <div className="flex gap-2 mt-auto">
                                <button 
                                    onClick={() => handleApprove(req.id, req.requested_role)} 
                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold text-xs hover:bg-green-700 flex items-center justify-center gap-1 transition"
                                >
                                    <CheckCircle size={14}/> Terima
                                </button>
                                <button 
                                    onClick={() => handleReject(req.id)} 
                                    className="flex-1 bg-white border border-red-200 text-red-600 py-2 rounded-lg font-bold text-xs hover:bg-red-50 flex items-center justify-center gap-1 transition"
                                >
                                    <XCircle size={14}/> Tolak
                                </button>
                            </div>
                        </div>

                    </div>
                ))}
            </div>
        )}

        {/* --- KONTEN TAB: DAFTAR MITRA (BREEDER/SELLER) --- */}
        {activeTab === 'partners' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-700">Nama & Bisnis</th>
                                <th className="px-6 py-4 font-bold text-gray-700">Kontak</th>
                                <th className="px-6 py-4 font-bold text-gray-700">Role</th>
                                <th className="px-6 py-4 font-bold text-gray-700">Status</th>
                                <th className="px-6 py-4 font-bold text-gray-700 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {partners.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-10 text-center text-gray-400">
                                        Belum ada mitra terdaftar. Cek tab Permintaan Baru.
                                    </td>
                                </tr>
                            )}
                            
                            {partners.map((partner) => (
                                <tr key={partner.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => setSelectedPartner(partner)}>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{partner.full_name || 'Tanpa Nama'}</div>
                                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                            <Store size={10}/> {partner.store_name || '-'}
                                        </div>
                                    </td>
                                    
                                    {/* Kontak Mitra */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-xs text-gray-600">
                                            <span className="flex items-center gap-1"><Phone size={10}/> {partner.contact_phone || '-'}</span>
                                            {partner.instagram && <span className="flex items-center gap-1 text-blue-600"><Instagram size={10}/> {partner.instagram}</span>}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${partner.role === 'breeder' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                            {partner.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {partner.is_banned ? (
                                            <span className="flex items-center gap-1 text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded w-fit border border-red-100">
                                                <Ban size={12}/> BANNED
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded w-fit border border-green-100">
                                                <CheckCircle size={12}/> Aktif
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            {/* Tombol Copot Jabatan */}
                                            <button 
                                                onClick={() => handleDowngrade(partner.id, partner.full_name)}
                                                className="text-orange-600 hover:bg-orange-50 p-2 rounded-lg transition border border-transparent hover:border-orange-200"
                                                title="Copot Jabatan (Downgrade ke User)"
                                            >
                                                <ShieldOff size={18} />
                                            </button>

                                            {/* Tombol Ban/Unban */}
                                            <button 
                                                onClick={() => handleToggleBan(partner.id, partner.is_banned)}
                                                className={`p-2 rounded-lg transition border border-transparent ${partner.is_banned ? 'text-green-600 hover:bg-green-50 hover:border-green-200' : 'text-red-600 hover:bg-red-50 hover:border-red-200'}`}
                                                title={partner.is_banned ? "Unban User" : "Ban User"}
                                            >
                                                {partner.is_banned ? <CheckCircle size={18} /> : <Ban size={18} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

      </main>

      {/* --- MODAL DETAIL PARTNER --- */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative border border-gray-200">
                <button 
                    onClick={() => setSelectedPartner(null)}
                    className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition text-gray-500 z-10"
                >
                    <X size={20} />
                </button>

                <div className="bg-gray-50 px-8 py-6 border-b border-gray-200 flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-full border-4 border-white shadow-md overflow-hidden flex-shrink-0">
                         {selectedPartner.avatar_url ? (
                            <img src={selectedPartner.avatar_url} className="w-full h-full object-cover" alt="Avatar"/>
                         ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400"><User size={24}/></div>
                         )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedPartner.full_name}</h2>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${selectedPartner.role === 'breeder' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                            {selectedPartner.role}
                        </span>
                        {selectedPartner.is_banned && <span className="ml-2 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">BANNED</span>}
                    </div>
                </div>

                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    
                    {/* Data Bisnis */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Nama Bisnis</h4>
                            <p className="font-medium text-gray-900 flex items-center gap-2">
                                <Store size={16} className="text-orange-500"/> {selectedPartner.store_name || '-'}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Kontak Email</h4>
                            <p className="font-medium text-gray-900 flex items-center gap-2">
                                <Mail size={16} className="text-orange-500"/> {selectedPartner.contact_email || '-'}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Telepon / WA</h4>
                            <p className="font-medium text-gray-900 flex items-center gap-2">
                                <Phone size={16} className="text-orange-500"/> {selectedPartner.contact_phone || '-'}
                            </p>
                        </div>
                        {selectedPartner.instagram && (
                             <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Instagram</h4>
                                <p className="font-medium text-blue-600 flex items-center gap-2">
                                    <Instagram size={16}/> {selectedPartner.instagram}
                                </p>
                            </div>
                        )}
                        <div className="col-span-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Alamat Lengkap</h4>
                            <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                                {selectedPartner.store_address || '-'}
                            </p>
                        </div>
                        <div className="col-span-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Deskripsi Bisnis</h4>
                            <p className="font-medium text-gray-600 italic text-sm">
                                {selectedPartner.store_description || 'Tidak ada deskripsi.'}
                            </p>
                        </div>
                    </div>

                    {/* Foto KTP */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 text-center">Dokumen KTP Terverifikasi</h4>
                        <div className="bg-gray-100 rounded-xl border border-gray-200 overflow-hidden relative group">
                            {selectedPartner.ktp_url ? (
                                <a href={selectedPartner.ktp_url} target="_blank" rel="noreferrer" className="block">
                                    <img src={selectedPartner.ktp_url} alt="KTP" className="w-full h-48 object-contain bg-gray-200 hover:scale-105 transition duration-500"/>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold">
                                        Klik untuk Perbesar
                                    </div>
                                </a>
                            ) : (
                                <div className="h-32 flex items-center justify-center text-gray-400 text-xs">Tidak ada data KTP</div>
                            )}
                        </div>
                    </div>
                    
                </div>
                
                <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 text-right">
                    <button onClick={() => setSelectedPartner(null)} className="px-6 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-gray-800 transition">Tutup</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}