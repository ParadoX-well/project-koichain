import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-gas-reporter";
import * as dotenv from "dotenv";

// Memuat variabel lingkungan dari file .env
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  // --- KONFIGURASI GAS REPORTER ---
  gasReporter: {
    enabled: true,
    currency: 'USD',
    token: 'ETH',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
    noColors: false,
    gasPrice: 15,
  },
  networks: {
    // Jaringan Lokal
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    // Jaringan Publik Sepolia
    sepolia: {
      // Pastikan URL Infura di .env Anda benar
      url: process.env.SEPOLIA_RPC_URL || "",
      chainId: 11155111,
      // Jika saldo masih 0, transaksi ini akan gagal (insufficient funds)
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

export default config;