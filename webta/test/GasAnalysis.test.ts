import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("IEEE Paper Experiments: WebKoi Comprehensive Analysis", function () {
    let koiCert: any;
    let erc721Koi: any;
    let owner: any;
    let addr1: any;
    let addr2: any;
    let hacker: any;

    // Parameter pengujian massal untuk akurasi statistik (Sesuai Standar IEEE)
    const JUMLAH_MINTING = 100;
    const JUMLAH_UPDATE = 50;
    const JUMLAH_TRANSFER = 50;

    before(async function () {
        // Inisialisasi akun pengujian
        [owner, addr1, addr2, hacker] = await ethers.getSigners();

        // 1. Deploy Smart Contract WebKoi (Sistem yang diusulkan)
        const KoiCert = await ethers.getContractFactory("KoiCert");
        koiCert = await KoiCert.deploy();

        // 2. Deploy Smart Contract ERC721Koi (Baseline/Pembanding)
        const ERC721Koi = await ethers.getContractFactory("ERC721Koi");
        erc721Koi = await ERC721Koi.deploy();

        console.log("   --- Memulai Eksperimen Kuantitatif WebKoi ---");
    });

    describe("Eksperimen 1: Analisis Gas Minting (Pencatatan Awal)", function () {

        it(`Harus mampu melakukan Minting ${JUMLAH_MINTING} Sertifikat secara berurutan`, async function () {
            for (let i = 1; i <= JUMLAH_MINTING; i++) {
                const tx = await koiCert.mintCertificate(
                    `KOI-ID-${i}`,      // ID unik
                    "Showa Sanshoku",   // Varietas
                    "Sakai Fish Farm",  // Breeder
                    "Betina",           // Gender
                    "Nisai",            // Umur
                    45 + (i % 5),       // Ukuran bervariasi
                    "Sangat Baik",      // Kondisi
                    `https://supabase.com/photo-${i}.jpg`,
                    "", "", "", ""      // Metadata silsilah (Opsional)
                );
                await tx.wait();
            }
            // Validasi: Cek data terakhir
            const lastKoi = await koiCert.getKoi(`KOI-ID-${JUMLAH_MINTING}`);
            expect(lastKoi.id).to.equal(`KOI-ID-${JUMLAH_MINTING}`);
        });

        it("Eksperimen Perbandingan: Minting 100 Sertifikat ERC-721 Standar", async function () {
            for (let i = 1; i <= JUMLAH_MINTING; i++) {
                const tx = await erc721Koi.safeMint(owner.address);
                await tx.wait();
            }
        });
    });

    describe("Eksperimen 2: Analisis Gas Update (Pertumbuhan Ikan)", function () {

        it(`Harus mampu melakukan Update Statistik sebanyak ${JUMLAH_UPDATE} kali`, async function () {
            for (let i = 1; i <= JUMLAH_UPDATE; i++) {
                const tx = await koiCert.updateKoiStats(
                    "KOI-ID-1",
                    50 + i,
                    "Nisai",
                    "Sehat",
                    `https://supabase.com/photo-update-${i}.jpg`,
                    "",
                    `Update pertumbuhan bulan ke-${i}`
                );
                await tx.wait();
            }

            const history = await koiCert.getKoiHistory("KOI-ID-1");
            expect(history.length).to.equal(JUMLAH_UPDATE + 1);
        });
    });

    describe("Eksperimen 3: Analisis Gas Transfer (Perpindahan Aset)", function () {

        it(`Harus mampu melakukan Transfer Kepemilikan sebanyak ${JUMLAH_TRANSFER} kali`, async function () {
            let currentOwner = owner;

            for (let i = 1; i <= JUMLAH_TRANSFER; i++) {
                const receiver = (i % 2 === 0) ? owner : addr1;

                const tx = await koiCert.connect(currentOwner).transferOwnership(
                    "KOI-ID-2",
                    receiver.address,
                    `Pemilik Baru Ke-${i}`,
                    48, "Nisai", "Sehat", "",
                    `Transaksi jual beli ke-${i}`
                );
                await tx.wait();

                currentOwner = receiver;
            }
        });
    });

    describe("Eksperimen 4: Pengujian Keamanan (Robustness Test)", function () {

        it("REVERT: Akun ilegal ditolak saat mencoba memindahkan aset", async function () {
            await expect(
                koiCert.connect(hacker).transferOwnership(
                    "KOI-ID-3", hacker.address, "Hacker", 0, "", "", "", "Pencurian"
                )
            ).to.be.revertedWith("Akses Ditolak!");
        });

        it("REVERT: Akun ilegal ditolak saat mencoba mengubah data", async function () {
            await expect(
                koiCert.connect(hacker).updateKoiStats(
                    "KOI-ID-3", 60, "Nisai", "Sakit", "", "", "Sabotase"
                )
            ).to.be.revertedWith("Akses Ditolak!");
        });
    });

    describe("Eksperimen 5: Validasi Traceability (Audit)", function () {
        it("Harus mengembalikan seluruh riwayat perjalanan ikan secara akurat", async function () {
            const history = await koiCert.getKoiHistory("KOI-ID-2");
            expect(history.length).to.be.at.least(JUMLAH_TRANSFER);
        });
    });
});