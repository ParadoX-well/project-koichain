import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("Eksperimen 5: Perbandingan Efisiensi WebKoi vs ERC-721", function () {
    let koiCert: any;
    let erc721Koi: any;
    let owner: any;

    before(async function () {
        [owner] = await ethers.getSigners();

        // 1. Deploy Custom Contract (Sistem yang diusulkan)
        const KoiCert = await ethers.getContractFactory("KoiCert");
        koiCert = await KoiCert.deploy();

        // 2. Deploy Standard ERC-721 (Baseline)
        const ERC721Koi = await ethers.getContractFactory("ERC721Koi");
        erc721Koi = await ERC721Koi.deploy();
    });

    it("Mencatat Perbandingan Gas Minting", async function () {
        console.log("\n   --- Hasil Pengukuran Unit Gas ---");

        // Minting Standard ERC-721
        const tx1 = await erc721Koi.safeMint(owner.address);
        const receipt1 = await tx1.wait();
        console.log(`   [Baseline] ERC-721 safeMint   : ${receipt1.gasUsed} gas`);

        // Minting WebKoi (Data Kompleks)
        const tx2 = await koiCert.mintCertificate(
            "COMP-001", "Kohaku", "Farm X", "Jantan", "Tosai", 30, "OK",
            "https://supabase.com/photo.jpg", "", "", "", ""
        );
        const receipt2 = await tx2.wait();
        console.log(`   [Proposed] WebKoi mintCert    : ${receipt2.gasUsed} gas`);

        /**
         * CATATAN UNTUK PAPER:
         * Rasio Efisiensi = Total Gas / Jumlah Metadata Field
         */
    });
});