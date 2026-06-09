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
  "0x59f778dF00c354742fAc5992737218C5A023b69b",  // Wallet Asli 1 (dipake akun breeder)
  "0x281cfC570B52e4099946cfb731300745A3842892", // Wallet Asli 2 Bikinan (dipake akun koichain)
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
   *
   * @param userId - Opsional. Jika diberikan (misal dari onAuthStateChange),
   *                 TIDAK perlu panggil getSession() lagi → mencegah race condition.
   */
  const validateAndSetAccount = async (address: string, userId?: string, silent = false): Promise<boolean> => {
    const lowerAddr = address.toLowerCase();

    // Tentukan userId: pakai parameter jika ada, kalau tidak baru ambil dari session
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user?.id;
    }

    if (currentUserId) {
      const { data: owner } = await supabase
        .from('user_wallets')
        .select('user_id')
        .eq('wallet_address', lowerAddr)
        .maybeSingle();

      if (owner && owner.user_id !== currentUserId) {
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

  // Cek koneksi wallet saat halaman dimuat + listener perubahan
  useEffect(() => {
    // --- 1. Cek wallet yang sudah terkoneksi saat mount ---
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        // Cek apakah user sebelumnya sengaja disconnect / logout
        const isConnected = localStorage.getItem('wallet_connected');
        if (isConnected !== 'true') return;

        try {
          // eth_accounts = TIDAK meminta permission, hanya cek yang sudah ada
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            // Saat mount, belum tahu userId → biarkan getSession() dipanggil
            await validateAndSetAccount(accounts[0]);
          }
        } catch (error) {
          console.error("Gagal cek koneksi wallet:", error);
        }
      }
    };

    checkConnection();

    // --- 2. Listener auth Supabase (login/logout/token refresh) ---
    // CATATAN: TIDAK ada visibilitychange listener di sini!
    // Alasan: visibilitychange + getSession() secara bersamaan dari beberapa komponen
    // (Navbar, WalletContext, halaman) menyebabkan deadlock di @supabase/ssr.
    // Wallet state sudah cukup ditangani oleh:
    //   - accountsChanged (MetaMask sendiri yang memberitahu jika ada perubahan)
    //   - onAuthStateChange (Supabase yang memberitahu jika sesi berubah)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setAccount(null);
        setIsAdmin(false);
        setWalletConflict(null);
        localStorage.removeItem('wallet_connected');
      }
      // Kita HAPUS blok SIGNED_IN yang memanggil MetaMask (window.ethereum.request).
      // Alasan 1: Agar Supabase TIDAK macet (deadlock) menunggu response MetaMask saat pindah aplikasi.
      // Alasan 2: Sesuai permintaan, saat user login ulang, wallet tidak otomatis terhubung.
      //           User harus menekan tombol "Connect Wallet" secara manual.
    });

    // --- 3. Listener jika user ganti akun di MetaMask ---
    let handleAccountsChanged: ((accounts: string[]) => void) | null = null;

    if (typeof window !== 'undefined' && window.ethereum) {
      handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length > 0) {
          const success = await validateAndSetAccount(accounts[0]);
          if (success) toast.success("Akun Wallet Diganti");
        } else {
          // Double check untuk memastikan bukan bug background tab Chrome
          try {
            const doubleCheck = await window.ethereum.request({ method: 'eth_accounts' });
            if (doubleCheck && doubleCheck.length > 0) {
              await validateAndSetAccount(doubleCheck[0], undefined, true);
            } else {
              setAccount(null);
              setIsAdmin(false);
              toast("Wallet Disconnected", { icon: "👋" });
            }
          } catch (e) {
            setAccount(null);
            setIsAdmin(false);
          }
        }
      };
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    // --- CLEANUP: Satu return statement yang bersihkan SEMUA listener ---
    return () => {
      subscription.unsubscribe();
      if (handleAccountsChanged && typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
      }
    };
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
      if (success) {
        localStorage.setItem('wallet_connected', 'true');
        toast.success("Wallet Terhubung!");
      }

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
    localStorage.removeItem('wallet_connected');
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