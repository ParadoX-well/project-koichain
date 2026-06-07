'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Wallet, Link2, X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface WalletGateProps {
    userId: string;
    walletAddress: string | null;
    onLinked: () => void;
    onDismiss: () => void;
}

export default function WalletLinkGate({ userId, walletAddress, onLinked, onDismiss }: WalletGateProps) {
    const [linking, setLinking] = useState(false);

    const handleLink = async () => {
        if (!walletAddress || !userId) return;
        setLinking(true);

        try {
            // Cek apakah sudah ada
            const { data: existing } = await supabase
                .from('user_wallets')
                .select('id, user_id')
                .eq('wallet_address', walletAddress.toLowerCase())
                .maybeSingle();

            if (existing) {
                if (existing.user_id === userId) {
                    // Sudah terkait ke akun ini, langsung proceed
                    onLinked();
                    return;
                } else {
                    alert('Wallet ini sudah digunakan oleh akun lain. Ganti wallet di MetaMask.');
                    setLinking(false);
                    return;
                }
            }

            // Cek jumlah wallet user untuk is_primary
            const { data: existingWallets } = await supabase
                .from('user_wallets')
                .select('id')
                .eq('user_id', userId);

            const { error } = await supabase.from('user_wallets').insert({
                user_id: userId,
                wallet_address: walletAddress.toLowerCase(),
                label: 'MetaMask',
                is_primary: !existingWallets || existingWallets.length === 0
            });

            if (error) throw error;
            onLinked();
        } catch (err: any) {
            alert('Gagal menautkan wallet: ' + err.message);
            setLinking(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden relative">
                <button onClick={onDismiss} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition p-1">
                    <X size={22} />
                </button>

                <div className="p-8 text-center">
                    {/* Icon */}
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <AlertTriangle size={40} className="text-orange-500" />
                    </div>

                    <h2 className="text-2xl font-black text-gray-900 mb-3">Wallet Belum Terkait</h2>
                    <p className="text-gray-500 mb-6 leading-relaxed">
                        Wallet MetaMask yang aktif saat ini <strong>belum dikaitkan</strong> dengan akun KoiChain Anda.
                        Untuk melanjutkan, Anda perlu menautkan wallet ini terlebih dahulu.
                    </p>

                    {/* Wallet Address Preview */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8 flex items-center gap-3">
                        <Wallet className="text-orange-500 shrink-0" size={20} />
                        <div className="text-left min-w-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">MetaMask Aktif</p>
                            <p className="font-mono text-sm text-gray-700 truncate">{walletAddress}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleLink}
                            disabled={linking}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 rounded-xl font-black text-lg hover:shadow-lg hover:shadow-orange-600/30 transition transform hover:-translate-y-0.5 disabled:opacity-70"
                        >
                            {linking ? <Loader2 className="animate-spin" size={22} /> : <Link2 size={22} />}
                            {linking ? 'Menautkan...' : 'Ya, Tautkan & Lanjutkan'}
                        </button>
                        <button
                            onClick={onDismiss}
                            className="w-full py-3 rounded-xl font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 border border-gray-200 transition"
                        >
                            Tidak, Batalkan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Hook untuk mengecek apakah wallet MetaMask yang aktif sudah terkait ke akun user.
 * Returns: { isLinked, isChecking, walletAddress, showGate, setShowGate }
 */
export function useWalletLinkCheck(userId: string, account: string | null) {
    const [isLinked, setIsLinked] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(true);

    const checkLink = useCallback(async () => {
        if (!userId || !account) {
            setIsLinked(null);
            setIsChecking(false);
            return;
        }

        setIsChecking(true);
        const { data } = await supabase
            .from('user_wallets')
            .select('id')
            .eq('user_id', userId)
            .eq('wallet_address', account.toLowerCase())
            .maybeSingle();

        setIsLinked(!!data);
        setIsChecking(false);
    }, [userId, account]);

    useEffect(() => {
        checkLink();
    }, [checkLink]);

    return { isLinked, isChecking, recheckLink: checkLink };
}
