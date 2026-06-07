import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * SKRIP VERIFIKASI DATA VIA ETHERSCAN API (V2 UNIFIED ENDPOINT)
 * Perbaikan: Menggunakan Unified Endpoint V2 untuk menghindari error 404.
 */

// 1. KONFIGURASI DATA
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

// Hash Transaksi sukses Anda dari jaringan Sepolia
const TX_HASH = "0x65b7324c8b356745b85e1c0721b61be8e69b02e617e54f5769fb96565b58f5a2";

async function verifyTransaction() {
    console.log("\n" + "=".repeat(60));
    console.log("🔍 AUDIT TRANSAKSI BLOCKCHAIN (ETHERSCAN API V2)");
    console.log("=".repeat(60));
    console.log(`Target Hash : ${TX_HASH}`);

    /**
     * PENTING: Pada API V2, Etherscan menggunakan satu endpoint utama.
     * Kita membedakan jaringan (Sepolia) melalui parameter 'chainid'.
     */
    const BASE_URL = "https://api.etherscan.io/v2/api";
    const CHAIN_ID = "11155111"; // ID untuk Sepolia

    const receiptUrl = `${BASE_URL}?chainid=${CHAIN_ID}&module=proxy&action=eth_getTransactionReceipt&txhash=${TX_HASH}&apikey=${ETHERSCAN_API_KEY}`;

    try {
        const response = await axios.get(receiptUrl);
        const data = response.data;

        // Cek jika API mengembalikan pesan error
        if (data.status === "0" && data.message === "NOTOK") {
            console.log(`\n❌ API ERROR: ${data.result}`);
            return;
        }

        const receipt = data.result;

        if (!receipt || typeof receipt === 'string') {
            console.log("\n⏳ STATUS: Transaksi ditemukan namun data receipt belum siap.");
            console.log("Saran: Tunggu sejenak, lalu jalankan kembali skrip ini.");
            return;
        }

        // Konversi Hex ke Decimal
        const blockNumber = parseInt(receipt.blockNumber, 16);
        const gasUsed = parseInt(receipt.gasUsed, 16);
        const status = parseInt(receipt.status, 16) === 1 ? "SUCCESS (CONFIRMED)" : "FAILED";

        // Ambil detail Blok untuk mendapatkan Timestamp yang valid
        const blockUrl = `${BASE_URL}?chainid=${CHAIN_ID}&module=proxy&action=eth_getBlockByNumber&tag=${receipt.blockNumber}&boolean=false&apikey=${ETHERSCAN_API_KEY}`;
        const blockResponse = await axios.get(blockUrl);
        const blockData = blockResponse.data.result;

        let confirmationDate = "Pending indexing...";
        if (blockData && blockData.timestamp) {
            const timestamp = parseInt(blockData.timestamp, 16);
            confirmationDate = new Date(timestamp * 1000).toLocaleString("id-ID", {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }

        console.log("\n[HASIL VALIDASI JARINGAN V2]");
        console.log(`✅ Status Eksekusi   : ${status}`);
        console.log(`📦 Terkonfirmasi di  : Blok #${blockNumber}`);
        console.log(`⏰ Waktu Konfirmasi  : ${confirmationDate}`);
        console.log(`⛽ Biaya Komputasi   : ${gasUsed.toLocaleString()} units Gas`);
        console.log(`🔗 Bukti Publik      : https://sepolia.etherscan.io/tx/${TX_HASH}`);

        console.log("\n" + "=".repeat(60));
        console.log("[DATA UNTUK PAPER IEEE]");
        console.log(`"The transaction's block confirmation time and status were verified `);
        console.log(`independently through the Etherscan API V2 at block ${blockNumber}."`);
        console.log("=".repeat(60) + "\n");

    } catch (error: any) {
        console.error("\n❌ GAGAL MENGHUBUNGI API V2:", error.message);
        if (error.response) {
            console.log(`Detail: Server merespons dengan kode ${error.response.status}`);
        }
    }
}

// Jalankan audit
verifyTransaction();