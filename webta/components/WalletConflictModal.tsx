'use client';

import { useWallet } from '@/context/WalletContext';
import { AlertTriangle, Wallet, X, RefreshCw } from 'lucide-react';

/**
 * Modal yang muncul global (di app layout) ketika wallet yang dicoba
 * connect sudah terdaftar di akun lain.
 */
export default function WalletConflictModal() {
  const { walletConflict, resolveConflict } = useWallet();

  if (!walletConflict) return null;

  const shortAddr = `${walletConflict.address.slice(0, 8)}...${walletConflict.address.slice(-6)}`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-5 flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
            <AlertTriangle className="text-amber-600 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Wallet Sudah Terdaftar</h2>
            <p className="text-sm text-amber-700 mt-0.5">Wallet ini digunakan oleh akun lain</p>
          </div>
          <button
            onClick={() => resolveConflict('cancel')}
            className="ml-auto p-1 text-gray-400 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 border border-gray-200">
            <p className="text-xs text-gray-500 font-medium mb-1">Wallet Address</p>
            <p className="font-mono text-sm font-bold text-gray-800 break-all">{walletConflict.address}</p>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">
            Wallet <span className="font-bold font-mono text-gray-800">{shortAddr}</span> sudah terhubung ke akun lain di sistem KoiChain ID. Kamu tidak bisa menggunakannya di akun ini.
          </p>

          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
            <strong>Solusi:</strong> Pilih wallet lain di MetaMask yang belum terdaftar, atau hubungi admin jika ini adalah wallet milikmu.
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={() => resolveConflict('cancel')}
            className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition text-sm"
          >
            Batal
          </button>
          <button
            onClick={() => resolveConflict('reconnect')}
            className="flex-1 px-4 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-700 transition text-sm flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Pilih Wallet Lain
          </button>
        </div>
      </div>
    </div>
  );
}
