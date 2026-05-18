'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

// Solusi TypeScript untuk window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}

// --- CONFIG ADMIN ---
// Daftar wallet ini OTOMATIS dianggap sebagai Admin
const ADMIN_WALLETS = [
  "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199", // Akun Hardhat #19
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "0x59f778dF00c354742fAc5992737218C5A023b69b", // Wallet Asli Kamu
  // Tambahkan wallet lain di sini jika perlu
].map(addr => addr.toLowerCase());

interface WalletContextType {
  account: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isAdmin: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Helper untuk set akun dan cek admin
  const handleSetAccount = (address: string) => {
    const lowerAddr = address.toLowerCase();
    setAccount(lowerAddr);

    // Cek apakah wallet ini ada di daftar admin
    if (ADMIN_WALLETS.includes(lowerAddr)) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false); // Bukan admin, tapi TETAP BOLEH CONNECT (untuk Breeder/Seller)
    }
  };

  // Cek koneksi saat refresh halaman
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            handleSetAccount(accounts[0]);
          }
        } catch (error) {
          console.error("Gagal cek koneksi:", error);
        }
      }
    };

    checkConnection();

    // Listener jika user ganti akun di Metamask
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          handleSetAccount(accounts[0]);
          toast.success("Akun Wallet Diganti");
        } else {
          setAccount(null);
          setIsAdmin(false);
          toast.success("Wallet Disconnected");
        }
      });
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const walletAddress = accounts[0];

        // --- PERUBAHAN UTAMA DI SINI ---
        // Dulu: Jika bukan admin -> Error/Tolak
        // Sekarang: Semua boleh masuk, nanti diatur hak aksesnya lewat role

        handleSetAccount(walletAddress);
        toast.success("Wallet Terhubung!");

      } catch (err) {
        console.error(err);
        toast.error("Gagal menghubungkan wallet.");
      }
    } else {
      toast.error("Metamask tidak terdeteksi! Silakan install.");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsAdmin(false);
    toast.success("Wallet Terputus");
  };

  return (
    <WalletContext.Provider value={{
      account,
      connectWallet,
      disconnectWallet,
      isAdmin // Flag ini bisa dipakai untuk proteksi tombol khusus admin
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