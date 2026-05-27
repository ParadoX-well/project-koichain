import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

/**
 * EKSPERIMEN KEAMANAN BLOCKCHAIN KOMPREHENSIF (IEEE STANDARD)
 * Skenario: Simulasi Penetrasi (Pen-Test) pada Smart Contract KoiChain ID.
 * Metodologi: Negative Testing untuk memvalidasi Integritas dan Kontrol Akses.
 */

describe("Security Robustness Analysis: KoiChain ID", function () {
    let koiCert: any;
    let owner: any;         // Wallet A (Pemilik Sah)
    let hacker: any;        // Wallet B (Penyerang)
    let innocentUser: any;  // Akun pihak ketiga

    const KOI_ID = "SECURE-KOI-888";

    before(async function () {
        // 1. Inisialisasi Akun
        [owner, hacker, innocentUser] = await ethers.getSigners();

        // 2. Deploy Kontrak Baru
        const KoiCert = await ethers.getContractFactory("KoiCert");
        koiCert = await KoiCert.deploy();

        // 3. Setup Awal: Wallet A mendaftarkan ikan (Minting)
        await koiCert.connect(owner).mintCertificate(
            KOI_ID, "Kohaku", "Dainichi Farm", "Jantan", "Tosai", 30, "Sehat",
            "https://photo.com", "", "", "", ""
        );

        console.log(`\n   [Keamanan] Menyiapkan lingkungan uji aman untuk ID: ${KOI_ID}`);
    });

    describe("Akses Kontrol & Integritas Data (Vulnerability Testing)", function () {

        it("Skenario 1: Serangan Pemindahan Hak Milik Ilegal (Wallet_B -> Wallet_A)", async function () {
            console.log("      --- Memulai Simulasi Serangan Pencurian Aset ---");

            // Hacker mencoba memanggil fungsi transfer atas aset yang bukan miliknya
            const transferAttempt = koiCert.connect(hacker).transferOwnership(
                KOI_ID,
                hacker.address,
                "Hacker Store",
                0, "", "", "",
                "Upaya Pengambilalihan Paksa"
            );

            // Verifikasi REVERT: Sistem harus menolak transaksi
            await expect(transferAttempt).to.be.revertedWith("Akses Ditolak!");
            console.log("      ✅ HASIL: Transaksi ditolak (Akses Ditolak).");
        });

        it("Skenario 2: Serangan Sabotase Data Fisik (Data Tampering)", async function () {
            console.log("      --- Memulai Simulasi Serangan Sabotase Data ---");

            // Hacker mencoba mengubah ukuran ikan menjadi tidak masuk akal
            const sabotageAttempt = koiCert.connect(hacker).updateKoiStats(
                KOI_ID,
                999, // Ukuran palsu
                "Nisai",
                "Sakit Parah",
                "", "",
                "Sabotase Nilai Aset"
            );

            await expect(sabotageAttempt).to.be.revertedWith("Akses Ditolak!");
            console.log("      ✅ HASIL: Perubahan status data digagalkan oleh EVM.");
        });

        it("Skenario 3: Serangan Tabrakan Identitas (ID Collision Attack)", async function () {
            console.log("      --- Memulai Simulasi Duplikasi Sertifikat ---");

            // Mencoba mendaftarkan ID yang sudah ada di sistem
            const duplicateMint = koiCert.connect(innocentUser).mintCertificate(
                KOI_ID, // Menggunakan ID yang sama dengan KOI-888
                "Showa", "Farm Palsu", "Betina", "Tosai", 20, "OK", "", "", "", "", ""
            );

            await expect(duplicateMint).to.be.revertedWith("ID Koi sudah terdaftar!");
            console.log("      ✅ HASIL: Sistem mencegah pendaftaran ganda pada identitas yang sama.");
        });

        it("Skenario 4: Verifikasi Kebocoran Event (Event Privacy Check)", async function () {
            // Memastikan transaksi yang gagal TIDAK memicu log event di blockchain
            const tx = koiCert.connect(hacker).updateKoiStats(KOI_ID, 50, "", "", "", "", "Test");

            // Transaksi gagal tidak boleh menghasilkan log "KoiUpdated"
            await expect(tx).to.be.reverted;
            // Di Paper IEEE ini disebut sebagai 'No State Change leakage'
            console.log("      ✅ HASIL: Tidak ada emisi event pada transaksi yang gagal.");
        });

        it("Audit Final: Verifikasi Status Akhir Buku Besar (State Integrity)", async function () {
            const data = await koiCert.getKoi(KOI_ID);

            // Bukti empiris untuk paper: State tetap orisinal meskipun diserang berkali-kali
            expect(data.currentOwner).to.equal(owner.address);
            expect(data.size).to.equal(30);

            console.log(`      ✅ BUKTI: Integritas data terjaga 100%. Pemilik tetap: ${owner.address.slice(0, 10)}...`);
        });

    });
});