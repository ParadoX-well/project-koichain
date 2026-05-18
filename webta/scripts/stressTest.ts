import hre from "hardhat";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const { ethers } = hre;

/**
 * SKRIP STRESS TEST WEBKOI (IEEE STANDARD)
 * Update: Menambahkan pengecekan otomatis untuk typo ekstensi file (.cvs vs .csv)
 * dan penanganan modul ES agar tidak terjadi error __dirname.
 */

// 1. Definisikan struktur data CSV agar tidak "merah"
interface KoiRecord {
    id: string;
    variety: string;
    breeder: string;
    gender: string;
    age: string;
    size: string;
    condition: string;
    photoUrl: string;
    certUrl?: string;
    contestUrl?: string;
    fatherId?: string;
    motherId?: string;
}

async function main() {
    // --- KONFIGURASI ---
    // Alamat kontrak dari deployment lokal Anda
    const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    // Kami mengecek beberapa kemungkinan nama file karena sering terjadi typo ekstensi (.cvs)
    const POSSIBLE_FILES = ["dummy_koi.csv", "dummy_koi.cvs"];
    let csvPath = "";
    let fileNameFound = "";

    for (const file of POSSIBLE_FILES) {
        const p = path.resolve(process.cwd(), file);
        if (fs.existsSync(p)) {
            csvPath = p;
            fileNameFound = file;
            break;
        }
    }

    if (!csvPath) {
        console.error(`❌ Error: File data dummy tidak ditemukan di root project.`);
        console.log(`Pastikan file bernama 'dummy_koi.csv' ada di folder: ${process.cwd()}`);
        return;
    }

    // Jika ditemukan typo, beri peringatan tapi tetap lanjutkan
    if (fileNameFound === "dummy_koi.cvs") {
        console.log(`⚠️  Peringatan: Menemukan file 'dummy_koi.cvs'. Seharusnya '.csv', tapi skrip akan tetap melanjutkannya.\n`);
    }

    const [signer] = await ethers.getSigners();
    const KoiCert = await ethers.getContractFactory("KoiCert");
    const koiCert = KoiCert.attach(CONTRACT_ADDRESS) as any;

    const fileContent = fs.readFileSync(csvPath, "utf-8");

    // Cast hasil parse ke array KoiRecord
    const records: KoiRecord[] = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
    });

    console.log(`\n🚀 Memulai Stress Test: ${records.length} Transaksi Minting`);
    console.log(`   File yang digunakan: ${fileNameFound}`);
    console.log(`   Wallet Pengirim: ${signer.address}\n`);

    const results: any[] = [];
    const startTimeTotal = performance.now();

    // 3. Iterasi Transaksi
    for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const startTx = performance.now();

        try {
            // Eksekusi fungsi Smart Contract
            const tx = await koiCert.mintCertificate(
                row.id,
                row.variety,
                row.breeder,
                row.gender,
                row.age,
                parseInt(row.size) || 0,
                row.condition,
                row.photoUrl,
                row.certUrl || "",
                row.contestUrl || "",
                row.fatherId || "",
                row.motherId || ""
            );

            const sendTxTime = performance.now();
            const receipt = await tx.wait();
            const endTx = performance.now();

            results.push({
                index: i + 1,
                id: row.id,
                gasUsed: receipt.gasUsed.toString(),
                executionLatencyMs: (sendTxTime - startTx).toFixed(2),
                confirmationTimeMs: (endTx - sendTxTime).toFixed(2),
                totalTimeMs: (endTx - startTx).toFixed(2),
                status: "SUCCESS"
            });

            process.stdout.write(`\r✅ Kemajuan: ${i + 1}/${records.length} | Gas: ${receipt.gasUsed}`);

        } catch (error: any) {
            console.error(`\n❌ Gagal pada ID ${row.id}:`, error.message);
            results.push({
                index: i + 1,
                id: row.id,
                status: "FAILED",
                error: error.message
            });
        }
    }

    const endTimeTotal = performance.now();
    const totalDurationSec = (endTimeTotal - startTimeTotal) / 1000;

    // 4. Kalkulasi Rata-rata
    const successTxs = results.filter(r => r.status === "SUCCESS");
    const totalGas = successTxs.reduce((a, b) => a + BigInt(b.gasUsed), BigInt(0));
    const avgGas = successTxs.length > 0 ? totalGas / BigInt(successTxs.length) : 0;

    // 5. Output ke File JSON
    const report = {
        testInfo: {
            totalRecords: records.length,
            successCount: successTxs.length,
            totalDurationSec: totalDurationSec.toFixed(2),
            averageGasUsed: avgGas.toString()
        },
        data: results
    };

    fs.writeFileSync("stress_test_results.json", JSON.stringify(report, null, 2));

    console.log("\n\n" + "=".repeat(40));
    console.log("🏁 SIMULASI SELESAI");
    console.log("=".repeat(40));
    console.log(`Total Waktu  : ${totalDurationSec.toFixed(2)} detik`);
    console.log(`Rata-rata Gas: ${avgGas.toString()}`);
    console.log(`Log tersimpan: stress_test_results.json`);
    console.log("=".repeat(40) + "\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});