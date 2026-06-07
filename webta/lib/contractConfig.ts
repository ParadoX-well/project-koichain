// ⚠️ GANTI ALAMAT INI DENGAN ALAMAT KONTRAK TERBARU SETIAP KALI DEPLOY ULANG
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const CONTRACT_ABI = [
  // Events
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "string", "name": "id", "type": "string" }, { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }], "name": "KoiMinted", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "string", "name": "id", "type": "string" }, { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }], "name": "OwnershipTransferred", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "string", "name": "id", "type": "string" }, { "indexed": false, "internalType": "uint256", "name": "newSize", "type": "uint256" }, { "indexed": false, "internalType": "string", "name": "newNote", "type": "string" }, { "indexed": true, "internalType": "address", "name": "updatedBy", "type": "address" }], "name": "KoiUpdated", "type": "event" },

  // 1. MINTING (Updated: Ada fatherId & motherId)
  {
    "inputs": [
      { "internalType": "string", "name": "_id", "type": "string" },
      { "internalType": "string", "name": "_variety", "type": "string" },
      { "internalType": "string", "name": "_breeder", "type": "string" },
      { "internalType": "string", "name": "_gender", "type": "string" },
      { "internalType": "string", "name": "_age", "type": "string" },
      { "internalType": "uint256", "name": "_size", "type": "uint256" },
      { "internalType": "string", "name": "_condition", "type": "string" },
      { "internalType": "string", "name": "_photoUrl", "type": "string" },
      { "internalType": "string", "name": "_certUrl", "type": "string" },
      { "internalType": "string", "name": "_contestUrl", "type": "string" },
      { "internalType": "string", "name": "_fatherId", "type": "string" }, // BARU
      { "internalType": "string", "name": "_motherId", "type": "string" }, // BARU
      { "internalType": "string", "name": "_note", "type": "string" }      // BARU UNTUK CATATAN AWAL
    ],
    "name": "mintCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // 2. TRANSFER
  {
    "inputs": [
      { "internalType": "string", "name": "_id", "type": "string" },
      { "internalType": "address", "name": "_newOwner", "type": "address" },
      { "internalType": "string", "name": "_newOwnerName", "type": "string" },
      { "internalType": "uint256", "name": "_newSize", "type": "uint256" },
      { "internalType": "string", "name": "_newAge", "type": "string" },
      { "internalType": "string", "name": "_newCondition", "type": "string" },
      { "internalType": "string", "name": "_newPhotoUrl", "type": "string" },
      { "internalType": "string", "name": "_note", "type": "string" }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // 3. UPDATE
  {
    "inputs": [
      { "internalType": "string", "name": "_id", "type": "string" },
      { "internalType": "uint256", "name": "_newSize", "type": "uint256" },
      { "internalType": "string", "name": "_newAge", "type": "string" },
      { "internalType": "string", "name": "_newCondition", "type": "string" },
      { "internalType": "string", "name": "_newPhotoUrl", "type": "string" },
      { "internalType": "string", "name": "_newContestUrl", "type": "string" },
      { "internalType": "string", "name": "_updateNote", "type": "string" }
    ],
    "name": "updateKoiStats",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // 4. GET KOI (Updated: Ada fatherId & motherId)
  {
    "inputs": [{ "internalType": "string", "name": "_id", "type": "string" }],
    "name": "getKoi",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "id", "type": "string" },
          { "internalType": "string", "name": "variety", "type": "string" },
          { "internalType": "string", "name": "breeder", "type": "string" },
          { "internalType": "string", "name": "gender", "type": "string" },
          { "internalType": "string", "name": "age", "type": "string" },
          { "internalType": "uint256", "name": "size", "type": "uint256" },
          { "internalType": "string", "name": "condition", "type": "string" },
          { "internalType": "string", "name": "photoUrl", "type": "string" },
          { "internalType": "string[]", "name": "certUrls", "type": "string[]" },
          { "internalType": "string[]", "name": "contestUrls", "type": "string[]" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
          { "internalType": "address", "name": "issuer", "type": "address" },
          { "internalType": "address", "name": "currentOwner", "type": "address" },
          { "internalType": "string", "name": "fatherId", "type": "string" }, // BARU
          { "internalType": "string", "name": "motherId", "type": "string" }  // BARU
        ],
        "internalType": "struct KoiCert.KoiData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // 5. GET HISTORY (Ada ownerName)
  {
    "inputs": [{ "internalType": "string", "name": "_id", "type": "string" }],
    "name": "getKoiHistory",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "owner", "type": "address" },
          { "internalType": "string", "name": "ownerName", "type": "string" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
          { "internalType": "string", "name": "note", "type": "string" },
          { "internalType": "string", "name": "photoUrl", "type": "string" },
          { "internalType": "uint256", "name": "size", "type": "uint256" },
          { "internalType": "string", "name": "age", "type": "string" }
        ],
        "internalType": "struct KoiCert.History[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];