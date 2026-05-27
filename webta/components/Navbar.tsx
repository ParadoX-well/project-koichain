"use client";

import { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import { User, ShieldCheck, Wallet, XCircle, LayoutDashboard, LogOut, ChevronDown, Settings, Bell, CheckCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useWallet } from '@/context/WalletContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const [user, setUser] = useState<any>(null);
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [role, setRole] = useState<string>('user');
    const [displayName, setDisplayName] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const { account, connectWallet, disconnectWallet } = useWallet();
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadUserProfile = async (userId: string, email: string) => {
            const { data } = await supabase
                .from('profiles')
                .select('full_name, role')
                .eq('id', userId)
                .single();

            if (data) {
                setRole(data.role || 'user');
                setDisplayName(data.full_name || email?.split('@')[0] || '');
            }

            // Fetch notifications
            const { data: notifData } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10);
            if (notifData) {
                setNotifications(notifData);
                setUnreadCount(notifData.filter(n => !n.is_read).length);
            }
        };

        // 1. Ambil session langsung untuk fallback cepat
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                loadUserProfile(session.user.id, session.user.email || '');
            } else {
                setUser(null);
                setRole('user');
                setDisplayName('');
            }
            setIsAuthChecking(false);
        });

        // 2. Listener perubahan selanjutnya
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
                loadUserProfile(session.user.id, session.user.email || '');
            } else {
                setUser(null);
                setRole('user');
                setDisplayName('');
                setNotifications([]);
                setUnreadCount(0);
            }
            setIsAuthChecking(false);
        });

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            subscription.unsubscribe();
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const markAllAsRead = async () => {
        if (!user) return;
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
        setUnreadCount(0);
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    };

    const shortenAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }

    const handleConnect = () => connectWallet(true);  // forceNew=true → MetaMask selalu tampil
    const handleReconnect = () => connectWallet(true);

    const handleLogout = async () => {
        setIsDropdownOpen(false);
        // Fire signOut dan tunggu selesai sebelum redirect agar token bersih
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <nav className="w-full bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">

            {/* LOGO & BRAND */}
            <Link href="/" className="flex items-center gap-2 group">
                {/* LOGO TANPA KOTAK, UKURAN DISESUAIKAN */}
                <img
                    src="/logo-koichain2-notulisan-black.png"
                    alt="Logo KoiChain ID"
                    className="w-11 h-11 object-contain transition-transform group-hover:scale-140"
                />
                <span className="text-xl font-bold text-gray-900">KoiChain ID</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">

                {/* --- WALLET --- */}
                {account ? (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={disconnectWallet}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition shadow-md border border-gray-700 group"
                            title="Klik untuk Disconnect"
                        >
                            <Wallet className="w-4 h-4 text-green-400" />
                            <span className="font-mono hidden sm:inline">{shortenAddress(account)}</span>
                            <XCircle className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition sm:ml-1" />
                        </button>
                        <button
                            onClick={handleReconnect}
                            className="p-2 text-gray-400 hover:text-gray-700 transition"
                            title="Ganti Wallet"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleConnect}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white text-gray-900 border-2 border-gray-900 text-sm font-bold rounded-lg hover:bg-gray-50 transition shadow-sm"
                    >
                        <Wallet className="w-4 h-4" />
                        <span className="hidden sm:inline">Connect Wallet</span>
                    </button>
                )}

                <div className="h-6 w-px bg-gray-300 mx-1 hidden md:block"></div>

                {/* --- NOTIFICATIONS --- */}
                {user && (
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => { setIsNotifOpen(!isNotifOpen); setIsDropdownOpen(false); if (unreadCount > 0) markAllAsRead(); }}
                            className="p-2 relative text-gray-500 hover:text-orange-600 transition hover:bg-orange-50 rounded-full"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                        </button>

                        {isNotifOpen && (
                            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform transition-all origin-top-right z-50 flex flex-col max-h-96">
                                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                                    <span className="font-bold text-gray-900 text-sm">Notifikasi</span>
                                </div>
                                <div className="overflow-y-auto flex-1">
                                    {notifications.length === 0 ? (
                                        <div className="p-6 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                                            <Bell size={24} className="text-gray-200" />
                                            Belum ada notifikasi
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50">
                                            {notifications.map(n => (
                                                <div key={n.id} className={`p-4 text-sm hover:bg-gray-50 transition ${!n.is_read ? 'bg-orange-50/30' : ''}`}>
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.is_read ? 'bg-orange-500' : 'bg-transparent'}`}></div>
                                                        <div className="flex-1">
                                                            <p className="text-gray-800 font-medium leading-snug">{n.title}</p>
                                                            <p className="text-gray-500 text-xs mt-1 leading-snug">{n.message}</p>
                                                            <p className="text-gray-400 text-[10px] mt-2">{new Date(n.created_at).toLocaleString('id-ID')}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- USER MENU (DROPDOWN) --- */}
                {isAuthChecking ? (
                    <div className="w-24 h-10 bg-gray-100 animate-pulse rounded-full"></div>
                ) : user ? (
                    <div className="relative" ref={dropdownRef}>
                        {/* Tombol Pemicu Dropdown */}
                        <button
                            onClick={() => { setIsDropdownOpen(!isDropdownOpen); setIsNotifOpen(false); }}
                            className="flex items-center gap-2 sm:gap-3 pl-1 pr-2 sm:pr-3 py-1 bg-gray-50 hover:bg-orange-50 border border-gray-200 rounded-full transition group"
                        >
                            <div className="bg-white p-1.5 rounded-full shadow-sm border border-gray-100">
                                <User className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="hidden sm:flex flex-col text-left mr-1">
                                <span className="text-xs font-bold text-gray-800 capitalize leading-none max-w-[100px] truncate">{displayName}</span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{role}</span>
                            </div>
                            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Isi Dropdown */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform transition-all origin-top-right z-50">
                                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                                    <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>

                                <div className="p-2 space-y-1">
                                    <Link
                                        href="/dashboard-user"
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-orange-50 hover:text-orange-700 transition"
                                    >
                                        <Settings size={18} />
                                        Profil & Pengaturan
                                    </Link>

                                    {role === 'admin' && (
                                        <Link
                                            href="/admin"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition rounded-xl"
                                        >
                                            <ShieldCheck size={18} />
                                            Admin Panel
                                        </Link>
                                    )}

                                    {role === 'author' && (
                                        <Link
                                            href="/dashboard-author"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition rounded-xl"
                                        >
                                            <LayoutDashboard size={18} />
                                            Dashboard Author
                                        </Link>
                                    )}

                                    {(role === 'breeder' || role === 'seller' || role.includes('breeder') || role.includes('seller')) && (
                                        <Link
                                            href="/dashboard-owner"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition rounded-xl"
                                        >
                                            <LayoutDashboard size={18} />
                                            Dashboard Bisnis
                                        </Link>
                                    )}

                                    <div className="h-px bg-gray-100 my-1 mx-2"></div>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-100 hover:text-red-600 transition text-left"
                                    >
                                        <LogOut size={18} />
                                        Keluar Akun
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link
                        href="/login"
                        className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-orange-600 text-white text-sm font-medium rounded-full hover:bg-orange-700 transition shadow-lg"
                    >
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">Login</span>
                    </Link>
                )}
            </div>
        </nav>
    );
}