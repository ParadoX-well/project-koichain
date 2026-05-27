'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

// Solusi TypeScript untuk window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}

// --- CONFIG ADMIN ---
const ADMIN_WALLETS = [
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",  // Akun Hardhat
  "0x59f778dF00c354742fAc5992737218C5A023b69b", // Wallet Asli
].map(addr => addr.toLowerCase());

interface WalletConflictInfo {
  address: string;
  ownerUserId: string;
}

interface WalletContextType {
  account: string | null;
  connectWallet: (forceNew?: boolean) => Promise<void>;
  disconnectWallet: () => void;
  isAdmin: boolean;
  walletConflict: WalletConflictInfo | null;
  resolveConflict: (action: 'cancel' | 'reconnect') => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [walletConflict, setWalletConflict] = useState<WalletConflictInfo | null>(null);

  // Helper untuk set akun dan cek admin
  const handleSetAccount = (address: string) => {
    const lowerAddr = address.toLowerCase();
    setAccount(lowerAddr);
    setIsAdmin(ADMIN_WALLETS.includes(lowerAddr));
  };

  /**
   * Validasi wallet ke database.
   * Jika wallet sudah dipakai akun LAIN, set walletConflict (tampilkan modal)
   * dan return false. Jika clear, set account dan return true.
   */
  const validateAndSetAccount = async (address: string, silent = false): Promise<boolean> => {
    const lowerAddr = address.toLowerCase();

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: owner } = await supabase
        .from('user_wallets')
        .select('user_id')
        .eq('wallet_address', lowerAddr)
        .maybeSingle();

      if (owner && owner.user_id !== session.user.id) {
        // Wallet milik orang lain — tampilkan modal konfirmasi
        setWalletConflict({ address: lowerAddr, ownerUserId: owner.user_id });
        setAccount(null);
        setIsAdmin(false);
        return false;
      }
    }

    handleSetAccount(lowerAddr);
    return true;
  };

  // Cek koneksi saat refresh halaman
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // eth_accounts = TIDAK meminta permission, hanya cek yang sudah ada
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await validateAndSetAccount(accounts[0], true);
          }
        } catch (error) {
          console.error("Gagal cek koneksi wallet:", error);
        }
      }
    };

    checkConnection();

    // Re-validasi saat sesi auth berubah (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setAccount(null);
        setIsAdmin(false);
        setWalletConflict(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Re-check wallet setelah login
        if (typeof window !== 'undefined' && window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await validateAndSetAccount(accounts[0], true);
          }
        }
      }
    });

    // Listener jika user ganti akun di MetaMask
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length > 0) {
          const success = await validateAndSetAccount(accounts[0]);
          if (success) toast.success("Akun Wallet Diganti");
        } else {
          setAccount(null);
          setIsAdmin(false);
          toast("Wallet Disconnected", { icon: "👋" });
        }
      };
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        subscription.unsubscribe();
        window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
      };
    }

    return () => { subscription.unsubscribe(); };
  }, []);

  /**
   * connectWallet:
   * - forceNew=true  → pakai wallet_requestPermissions agar MetaMask minta pilih akun baru
   * - forceNew=false → pakai eth_requestAccounts (cukup untuk sebagian besar kasus)
   */
  const connectWallet = async (forceNew = false) => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast.error("MetaMask tidak terdeteksi! Silakan install MetaMask.");
      return;
    }

    try {
      let accounts: string[];

      if (forceNew) {
        // Minta MetaMask buka dialog pilih akun dari awal
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
      }

      accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];

      const success = await validateAndSetAccount(walletAddress);
      if (success) toast.success("Wallet Terhubung!");

    } catch (err: any) {
      if (err.code === 4001) {
        toast.error("Koneksi dibatalkan oleh pengguna.");
      } else {
        console.error(err);
        toast.error("Gagal menghubungkan wallet.");
      }
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsAdmin(false);
    toast("Wallet Terputus", { icon: "👋" });
  };

  /**
   * resolveConflict:
   * - 'cancel'     → tutup modal, tidak connect
   * - 'reconnect'  → tutup modal, buka MetaMask untuk pilih wallet lain
   */
  const resolveConflict = async (action: 'cancel' | 'reconnect') => {
    setWalletConflict(null);
    if (action === 'reconnect') {
      // Delay sedikit agar modal tutup dulu secara visual
      setTimeout(() => connectWallet(true), 150);
    }
  };

  return (
    <WalletContext.Provider value={{
      account,
      connectWallet,
      disconnectWallet,
      isAdmin,
      walletConflict,
      resolveConflict,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}