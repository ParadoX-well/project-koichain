import hre from "hardhat";

/**
 * SKRIP PENGECEKAN SALDO WALLET (IEEE EXPERIMENT PREP)
 * Digunakan untuk memverifikasi ketersediaan bensin (Gas Fee) 
 * sebelum melakukan deployment atau transaksi massal.
 */

async function main() {
    const { ethers } = hre;

    // 1. Ambil informasi signer dari Private Key yang ada di .env
    const [signer] = await ethers.getSigners();
    const address = await signer.getAddress();

    console.log("\n===============================================");
    console.log("🔍 MEMULAI PENGECEKAN SALDO WALLET");
    console.log("===============================================");
    console.log(`Jaringan  : ${hre.network.name.toUpperCase()}`);
    console.log(`Address   : ${address}`);

    // 2. Ambil saldo dari provider blockchain
    const balance = await ethers.provider.getBalance(address);

    // 3. Konversi dari Wei ke Ether
    const balanceEth = ethers.formatEther(balance);

    console.log(`Saldo     : ${balanceEth} ETH`);

    // 4. Analisis kelayakan untuk pendaftaran kontrak
    const minRequired = 0.01; // Estimasi minimal untuk deploy kontrak simpel

    if (parseFloat(balanceEth) < minRequired) {
        console.log("\n⚠️  PERINGATAN: Saldo Anda sangat rendah.");
        console.log(`   Dibutuhkan minimal sekitar ${minRequired} ETH untuk pendaftaran.`);
        console.log("   Saran: Ambil faucet tambahan di Google Cloud atau PoW Faucet.");
    } else {
        console.log("\n✅ SALDO MENCUKUPI!");
        console.log("   Anda siap untuk menjalankan perintah:");
        console.log(`   npx hardhat run scripts/deploy.ts --network ${hre.network.name}`);
    }

    console.log("===============================================\n");
}

// Jalankan fungsi utama
main().catch((error) => {
    console.error("Terjadi kesalahan saat mengecek saldo:", error);
    process.exitCode = 1;
});