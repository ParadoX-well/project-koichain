import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contractConfig';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Menggunakan node RPC localhost untuk pengembangan
    // Pastikan untuk mengganti RPC URL jika rilis ke testnet/mainnet
    // Menggunakan node RPC Sepolia jika ada di .env (untuk testnet) atau fallback ke localhost
    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'http://127.0.0.1:8545';
      
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Memuat Admin Wallet dari PRIVATE_KEY
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY tidak ditemukan di environment variables");
    }

    const adminWallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, adminWallet);

    // Hash dari MINTER_ROLE (sesuai standar AccessControl OpenZeppelin)
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));

    // Mengecek apakah wallet sudah memiliki MINTER_ROLE
    const hasRole = await contract.hasRole(MINTER_ROLE, walletAddress);
    
    if (hasRole) {
      return NextResponse.json({ success: true, message: 'Wallet sudah memiliki MINTER_ROLE', granted: false });
    }

    // Jika belum punya, maka berikan ROLE
    console.log(`Memberikan MINTER_ROLE ke dompet: ${walletAddress}...`);
    const tx = await contract.grantRole(MINTER_ROLE, walletAddress);
    
    // Tunggu 1 konfirmasi
    await tx.wait();

    return NextResponse.json({ success: true, message: 'MINTER_ROLE berhasil diberikan', txHash: tx.hash, granted: true });

  } catch (error: any) {
    console.error("Gagal saat memberikan MINTER_ROLE:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
