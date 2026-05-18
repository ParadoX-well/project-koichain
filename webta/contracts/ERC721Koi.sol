// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title ERC721Koi (Baseline)
 * @dev Kontrak standar ERC-721 minimal untuk pembanding eksperimen.
 * Kontrak ini hanya mencatat kepemilikan tanpa metadata biologis on-chain.
 */
contract ERC721Koi is ERC721 {
    uint256 private _nextTokenId;

    constructor() ERC721("StandardKoiNFT", "SKOI") {}

    // Fungsi minting standar minimal
    function safeMint(address to) public {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }
}