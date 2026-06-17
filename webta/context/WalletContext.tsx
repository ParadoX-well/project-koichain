'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

interface WalletConflictInfo {
  address: string;
  ownerUserId: string;
}

interface WalletContextType {
  account: string | null;
  connectWallet: () => void;
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

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  const validateAndSetAccount = async (walletAddress: string): Promise<boolean> => {
    const lowerAddr = walletAddress.toLowerCase();
    let isUserAdmin = false;

    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    if (currentUserId) {
      // 1. Cek apakah wallet dipakai orang lain
      const { data: owner } = await supabase
        .from('user_wallets')
        .select('user_id')
        .eq('wallet_address', lowerAddr)
        .maybeSingle();

      if (owner && owner.user_id !== currentUserId) {
        setWalletConflict({ address: lowerAddr, ownerUserId: owner.user_id });
        setAccount(null);
        setIsAdmin(false);
        disconnect(); // Putuskan dari Wagmi karena konflik
        return false;
      }

      // 2. Cek apakah user admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUserId)
        .single();
      
      if (profile && profile.role === 'admin') {
        isUserAdmin = true;
      }
    }

    setAccount(lowerAddr);
    setIsAdmin(isUserAdmin);
    return true;
  };

  // Sinkronisasi status Wagmi ke WalletContext kita
  useEffect(() => {
    if (isConnected && address) {
      validateAndSetAccount(address);
    } else {
      setAccount(null);
      setIsAdmin(false);
    }
  }, [isConnected, address]);

  // Listener auth Supabase (logout)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setAccount(null);
        setIsAdmin(false);
        setWalletConflict(null);
        disconnect(); // Putuskan wallet saat logout web
      }
    });
    return () => subscription.unsubscribe();
  }, [disconnect]);

  const connectWallet = () => {
    if (openConnectModal) {
      openConnectModal();
    } else {
      toast.error("Gagal membuka menu Wallet");
    }
  };

  const disconnectWallet = () => {
    disconnect();
    setAccount(null);
    setIsAdmin(false);
    toast("Wallet Terputus", { icon: "👋" });
  };

  const resolveConflict = async (action: 'cancel' | 'reconnect') => {
    setWalletConflict(null);
    if (action === 'reconnect') {
      disconnect(); // Putuskan yang sekarang
      setTimeout(() => {
        if (openConnectModal) openConnectModal();
      }, 500);
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