import hre from "hardhat";
import { performance } from "perf_hooks";

const { ethers } = hre;

/**
 * SKRIP PENGUKURAN LATENSI (HARDHAT VS SEPOLIA) - VERSI FIX
 * Fitur: Auto-check data sebelum pengukuran untuk menghindari error 'could not decode'.
 */

async function main() {
    const networkName = hre.network.name;
    console.log(`\n=== MEMULAI PENGUJIAN LATENSI PADA JARINGAN: ${networkName.toUpperCase()} ===`);

    // ⚠️ PASTIKAN ALAMAT INI SESUAI DENGAN HASIL DEPLOY TERAKHIR ANDA
    const CONTRACT_ADDRESS = "0x911486D10f3130ce36e5Fd549bCae2E60CD3d12e";
    const TEST_ID = "LATENCY-DATA-PROBE";

    const [signer] = await ethers.getSigners();
    const KoiCert = await ethers.getContractFactory("KoiCert");
    const koiCert = KoiCert.attach(CONTRACT_ADDRESS) as any;

    console.log(`Verifikasi kontrak di alamat: ${CONTRACT_ADDRESS}...`);

    // --- PRE-CHECK: PASTIKAN DATA ADA AGAR TIDAK ERROR ---
    try {
        const checkData = await koiCert.getKoi(TEST_ID);
        if (!checkData.id) {
            console.log(`[!] Data ${TEST_ID} belum ada. Melakukan minting awal untuk bahan uji...`);
            const setupTx = await koiCert.mintCertificate(
                TEST_ID, "Tester", "Lab", "Jantan", "Tosai", 10, "OK", "https://test.com", "", "", "", ""
            );
            await setupTx.wait();
            console.log(`[OK] Data siap.`);
        }
    } catch (err) {
        console.error("❌ ERROR KRITIS: Kontrak tidak ditemukan atau alamat salah!");
        console.log("Saran: Jalankan kembali 'npx hardhat run scripts/deploy.ts --network localhost' dan update CONTRACT_ADDRESS di skrip ini.");
        return;
    }

    // --- 1. PENGUKURAN READ LATENCY (VERIFIKASI) ---
    console.log(`\n[1/2] Mengukur Read Latency (getKoi)...`);
    const iterations = networkName === 'localhost' ? 50 : 5;
    const readLatencies: number[] = [];

    for (let i = 1; i <= iterations; i++) {
        const start = performance.now();
        // Memanggil fungsi view (getKoi)
        await koiCert.getKoi(TEST_ID);
        const end = performance.now();
        readLatencies.push(end - start);
        process.stdout.write(`\r      Progress: ${i}/${iterations}`);
    }

    const avgRead = readLatencies.reduce((a, b) => a + b, 0) / readLatencies.length;

    // --- 2. PENGUKURAN WRITE LATENCY (KONFIRMASI BLOK) ---
    console.log(`\n\n[2/2] Mengukur Write Latency (Transaction Speed)...`);
    const startWrite = performance.now();

    // Minting ID unik setiap kali tes agar tidak bentrok
    const uniqueId = `TX-LATENCY-${Date.now()}`;
    const tx = await koiCert.mintCertificate(
        uniqueId, "Kohaku", "Test Farm", "Jantan", "Tosai", 30, "Sehat",
        "https://photo.com", "", "", "", ""
    );

    console.log(`      Transaksi dikirim: ${tx.hash}`);
    console.log(`      Menunggu konfirmasi blok...`);

    await tx.wait();
    const endWrite = performance.now();
    const writeDuration = (endWrite - startWrite) / 1000;

    // --- RINGKASAN HASIL ---
    console.log("\n" + "=".repeat(55));
    console.log(`🏁 HASIL ANALISIS LATENSI: ${networkName.toUpperCase()}`);
    console.log("=".repeat(55));
    console.log(`Rata-rata Read (ms)      : ${avgRead.toFixed(2)} ms`);
    console.log(`Waktu Konfirmasi (detik) : ${writeDuration.toFixed(2)} detik`);
    console.log("=".repeat(55) + "\n");
}

main().catch((error) => {
    console.error("Gagal menjalankan pengujian:", error.message);
    process.exitCode = 1;
});