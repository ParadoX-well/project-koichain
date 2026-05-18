// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract KoiCert {
    
    struct History {
        address owner;
        string ownerName; 
        uint256 timestamp;
        string note;
        string photoUrl;
        uint256 size;
        string age; 
    }

    struct KoiData {
        string id;
        string variety;
        string breeder;
        string gender;
        string age;             
        uint256 size;           
        string condition;       
        string photoUrl;        
        string[] certUrls;
        string[] contestUrls;
        uint256 timestamp;
        address issuer;
        address currentOwner;
        
        // --- FITUR BARU: SILSILAH (LINEAGE) ---
        string fatherId; // ID Koi Bapak (Optional)
        string motherId; // ID Koi Ibu (Optional)
    }

    mapping(string => KoiData) public koiRegistry;
    mapping(string => History[]) public koiHistories;

    event KoiMinted(string indexed id, address indexed owner);
    event OwnershipTransferred(string indexed id, address indexed from, address indexed to);
    event KoiUpdated(string indexed id, uint256 newSize, string newNote, address indexed updatedBy);

    // 1. MINTING (Tambah Parameter Father & Mother)
    function mintCertificate(
        string memory _id,
        string memory _variety,
        string memory _breeder,
        string memory _gender,
        string memory _age,
        uint256 _size,
        string memory _condition,
        string memory _photoUrl,
        string memory _certUrl,
        string memory _contestUrl,
        string memory _fatherId, // Input ID Bapak
        string memory _motherId  // Input ID Ibu
    ) public {
        require(bytes(koiRegistry[_id].id).length == 0, "ID Koi sudah terdaftar!");

        string[] memory emptyCerts;
        string[] memory emptyContests;
        
        KoiData storage newKoi = koiRegistry[_id];
        newKoi.id = _id;
        newKoi.variety = _variety;
        newKoi.breeder = _breeder;
        newKoi.gender = _gender;
        newKoi.age = _age;
        newKoi.size = _size;
        newKoi.condition = _condition;
        newKoi.photoUrl = _photoUrl;
        newKoi.timestamp = block.timestamp;
        newKoi.issuer = msg.sender;
        newKoi.currentOwner = msg.sender;
        
        // Simpan Data Orang Tua
        newKoi.fatherId = _fatherId;
        newKoi.motherId = _motherId;

        if (bytes(_certUrl).length > 0) {
            newKoi.certUrls.push(_certUrl);
        }
        if (bytes(_contestUrl).length > 0) {
            newKoi.contestUrls.push(_contestUrl);
        }

        koiHistories[_id].push(History({
            owner: msg.sender,
            ownerName: _breeder,
            timestamp: block.timestamp,
            note: "Genesis: Sertifikat Diterbitkan",
            photoUrl: _photoUrl,
            size: _size,
            age: _age
        }));

        emit KoiMinted(_id, msg.sender);
    }

    // 2. TRANSFER
    function transferOwnership(
        string memory _id,
        address _newOwner,
        string memory _newOwnerName, 
        uint256 _newSize,            
        string memory _newAge,       
        string memory _newCondition, 
        string memory _newPhotoUrl,  
        string memory _note          
    ) public {
        require(msg.sender == koiRegistry[_id].currentOwner, "Akses Ditolak!");
        require(_newOwner != address(0), "Alamat tidak valid");

        KoiData storage koi = koiRegistry[_id];
        address oldOwner = koi.currentOwner;

        koi.currentOwner = _newOwner;
        koi.breeder = _newOwnerName; 

        if (_newSize > 0) koi.size = _newSize;
        if (bytes(_newAge).length > 0) koi.age = _newAge;
        if (bytes(_newCondition).length > 0) koi.condition = _newCondition;
        if (bytes(_newPhotoUrl).length > 0) koi.photoUrl = _newPhotoUrl;

        koiHistories[_id].push(History({
            owner: _newOwner,
            ownerName: _newOwnerName,
            timestamp: block.timestamp,
            note: _note,
            photoUrl: koi.photoUrl,
            size: koi.size,
            age: koi.age
        }));

        emit OwnershipTransferred(_id, oldOwner, _newOwner);
    }

    // 3. UPDATE DATA
    function updateKoiStats(
        string memory _id,
        uint256 _newSize,
        string memory _newAge,
        string memory _newCondition,
        string memory _newPhotoUrl,
        string memory _newContestUrl,
        string memory _updateNote
    ) public {
        require(msg.sender == koiRegistry[_id].currentOwner, "Akses Ditolak!");

        KoiData storage koi = koiRegistry[_id];
        
        koi.size = _newSize;
        koi.age = _newAge;
        koi.condition = _newCondition;
        
        if (bytes(_newPhotoUrl).length > 0) {
            koi.photoUrl = _newPhotoUrl;
        }
        if (bytes(_newContestUrl).length > 0) {
            koi.contestUrls.push(_newContestUrl);
        }

        koiHistories[_id].push(History({
            owner: msg.sender,
            ownerName: koi.breeder,
            timestamp: block.timestamp,
            note: _updateNote,
            photoUrl: koi.photoUrl,
            size: _newSize,
            age: _newAge
        }));

        emit KoiUpdated(_id, _newSize, _updateNote, msg.sender);
    }

    function getKoi(string memory _id) public view returns (KoiData memory) {
        return koiRegistry[_id];
    }

    function getKoiHistory(string memory _id) public view returns (History[] memory) {
        return koiHistories[_id];
    }
}