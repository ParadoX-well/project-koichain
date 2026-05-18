"use client";

import { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import { User, ShieldCheck, Wallet, XCircle, LayoutDashboard, LogOut, ChevronDown, Settings } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useWallet } from '@/context/WalletContext'; 
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>('user');
  const [displayName, setDisplayName] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
  
  const { account, connectWallet, disconnectWallet } = useWallet();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        const { data } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', session.user.id)
          .single();
        
        if (data) {
          setRole(data.role || 'user');
          setDisplayName(data.full_name || session.user.email?.split('@')[0]);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
       if (session) {
         checkSession(); 
       } else {
         setUser(null);
         setRole('user');
         setDisplayName('');
       }
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const shortenAddress = (addr: string) => {
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  const handleConnect = async () => {
    try {
      if ((window as any).ethereum) {
        await (window as any).ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
      }
      await connectWallet();
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsDropdownOpen(false);
    router.replace('/login');
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
      
      {/* LOGO & BRAND */}
      <Link href="/" className="flex items-center gap-2 group">
        {/* LOGO TANPA KOTAK, UKURAN DISESUAIKAN */}
        <img 
          src="/logokoi.png" 
          alt="Logo WebKoi" 
          className="w-10 h-10 object-contain transition-transform group-hover:scale-110" 
        />
        <span className="text-xl font-bold text-gray-900">WebKoi</span>
      </Link>

      <div className="flex items-center gap-4">
        
        {/* --- WALLET --- */}
        {account ? (
            <button 
                onClick={disconnectWallet}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition shadow-md border border-gray-700 group"
                title="Klik untuk Disconnect"
            >
                <Wallet className="w-4 h-4 text-green-400" />
                <span className="font-mono">{shortenAddress(account)}</span>
                <XCircle className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition ml-1" />
            </button>
        ) : (
            <button 
                onClick={handleConnect} 
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 border-2 border-gray-900 text-sm font-bold rounded-lg hover:bg-gray-50 transition shadow-sm"
            >
                <Wallet className="w-4 h-4" />
                Connect Wallet
            </button>
        )}

        <div className="h-6 w-px bg-gray-300 mx-1 hidden md:block"></div>

        {/* --- USER MENU (DROPDOWN) --- */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            {/* Tombol Pemicu Dropdown */}
            <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 pl-1 pr-3 py-1 bg-gray-50 hover:bg-orange-50 border border-gray-200 rounded-full transition group"
            >
                <div className="bg-white p-1.5 rounded-full shadow-sm border border-gray-100">
                    <User className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex flex-col text-left mr-1">
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

                        {(role === 'breeder' || role === 'seller') && (
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
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-full hover:bg-orange-700 transition shadow-lg"
          >
            <User className="w-4 h-4" />
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}