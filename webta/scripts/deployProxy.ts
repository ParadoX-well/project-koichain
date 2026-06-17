const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("Memulai deployment KoiCert (UUPS Proxy)...");

  // Mendapatkan alamat signer pertama (deployer) sebagai Admin
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const KoiCert = await ethers.getContractFactory("KoiCert");

  console.log("Mendeploy Proxy...");
  // Mendeploy Proxy, memanggil initialize() dengan address deployer sebagai Admin
  const koiCertProxy = await upgrades.deployProxy(KoiCert, [deployer.address], {
    initializer: "initialize",
    kind: "uups",
  });

  await koiCertProxy.waitForDeployment();

  const proxyAddress = await koiCertProxy.getAddress();
  console.log("KoiCert Proxy berhasil di-deploy ke:", proxyAddress);

  // Implementasi address sebenarnya ada di balik layar, tapi Proxy Address inilah yang dipakai di Frontend.
  console.log("\n=============================================");
  console.log("Silakan salin alamat Proxy di atas dan paste");
  console.log("ke dalam file lib/contractConfig.ts sebagai");
  console.log("CONTRACT_ADDRESS.");
  console.log("=============================================\n");
}

main().catch((error) => {
  console.error("Terjadi kesalahan saat deployment:", error);
  process.exitCode = 1;
});
