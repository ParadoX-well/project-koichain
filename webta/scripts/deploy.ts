import hre from "hardhat"; // <-- Ubah import jadi default

async function main() {
  // Ambil ethers dari dalam objek 'hre' (Hardhat Runtime Environment)
  const { ethers } = hre; 

  // 1. Ambil "pabrik" pembuatan kontrak
  const KoiCert = await ethers.getContractFactory("KoiCert");
  
  // 2. Mulai proses deploy
  console.log("Sedang mendeploy kontrak KoiCert...");
  const koiCert = await KoiCert.deploy();

  // 3. Tunggu sampai selesai tercatat di blockchain
  await koiCert.waitForDeployment();

  // 4. Tampilkan alamat kontrak
  console.log("KoiCert deployed to:", await koiCert.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});