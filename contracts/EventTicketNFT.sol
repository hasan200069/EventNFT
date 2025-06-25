// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title EventTicketNFT
 * @dev NFT contract for event tickets with verification and locking mechanism
 */
contract EventTicketNFT is ERC721, ERC721URIStorage, ERC721Burnable, Ownable, Pausable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    // Ticket status enum
    enum TicketStatus {
        PENDING,    // Awaiting admin verification
        VERIFIED,   // Verified by admin
        LOCKED,     // In escrow
        UNLOCKED,   // Transaction completed
        DISPUTED    // Under dispute
    }

    // Ticket information structure
    struct TicketInfo {
        string eventName;
        string eventDate;
        string venue;
        string seatInfo;
        uint256 originalPrice;
        address originalSeller;
        TicketStatus status;
        uint256 listingTimestamp;
        string proofImageHash; // IPFS hash
    }

    // Mappings
    mapping(uint256 => TicketInfo) public ticketInfo;
    mapping(uint256 => bool) public isLocked;
    mapping(address => bool) public authorizedMarketplace;
    mapping(address => bool) public admins;

    // Events
    event TicketMinted(uint256 indexed tokenId, address indexed seller, string eventName);
    event TicketVerified(uint256 indexed tokenId, address indexed admin);
    event TicketLocked(uint256 indexed tokenId);
    event TicketUnlocked(uint256 indexed tokenId);
    event TicketStatusChanged(uint256 indexed tokenId, TicketStatus newStatus);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event MarketplaceAuthorized(address indexed marketplace);

    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner(), "Only admin can perform this action");
        _;
    }

    modifier onlyMarketplace() {
        require(authorizedMarketplace[msg.sender], "Only authorized marketplace");
        _;
    }

    modifier notLocked(uint256 tokenId) {
        require(!isLocked[tokenId], "Token is locked");
        _;
    }

    constructor() ERC721("EventTicketNFT", "ETNFT") {
        admins[msg.sender] = true;
    }

    /**
     * @dev Mints a new ticket NFT
     */
    function mintTicket(
        address to,
        string memory eventName,
        string memory eventDate,
        string memory venue,
        string memory seatInfo,
        uint256 originalPrice,
        string memory proofImageHash,
        string memory metadataURI
    ) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        ticketInfo[tokenId] = TicketInfo({
            eventName: eventName,
            eventDate: eventDate,
            venue: venue,
            seatInfo: seatInfo,
            originalPrice: originalPrice,
            originalSeller: to,
            status: TicketStatus.PENDING,
            listingTimestamp: block.timestamp,
            proofImageHash: proofImageHash
        });

        emit TicketMinted(tokenId, to, eventName);
        return tokenId;
    }

    /**
     * @dev Verifies a ticket (admin only)
     */
    function verifyTicket(uint256 tokenId) external onlyAdmin {
        require(_exists(tokenId), "Token does not exist");
        require(ticketInfo[tokenId].status == TicketStatus.PENDING, "Ticket not pending verification");
        
        ticketInfo[tokenId].status = TicketStatus.VERIFIED;
        emit TicketVerified(tokenId, msg.sender);
        emit TicketStatusChanged(tokenId, TicketStatus.VERIFIED);
    }

    /**
     * @dev Locks a ticket (marketplace only)
     */
    function lockTicket(uint256 tokenId) external onlyMarketplace {
        require(_exists(tokenId), "Token does not exist");
        require(ticketInfo[tokenId].status == TicketStatus.VERIFIED, "Ticket not verified");
        
        isLocked[tokenId] = true;
        ticketInfo[tokenId].status = TicketStatus.LOCKED;
        emit TicketLocked(tokenId);
        emit TicketStatusChanged(tokenId, TicketStatus.LOCKED);
    }

    /**
     * @dev Unlocks a ticket (marketplace only)
     */
    function unlockTicket(uint256 tokenId) external onlyMarketplace {
        require(_exists(tokenId), "Token does not exist");
        require(isLocked[tokenId], "Token not locked");
        
        isLocked[tokenId] = false;
        ticketInfo[tokenId].status = TicketStatus.UNLOCKED;
        emit TicketUnlocked(tokenId);
        emit TicketStatusChanged(tokenId, TicketStatus.UNLOCKED);
    }

    /**
     * @dev Sets ticket status to disputed
     */
    function markAsDisputed(uint256 tokenId) external onlyMarketplace {
        require(_exists(tokenId), "Token does not exist");
        ticketInfo[tokenId].status = TicketStatus.DISPUTED;
        emit TicketStatusChanged(tokenId, TicketStatus.DISPUTED);
    }

    /**
     * @dev Adds an admin
     */
    function addAdmin(address admin) external onlyOwner {
        admins[admin] = true;
        emit AdminAdded(admin);
    }

    /**
     * @dev Removes an admin
     */
    function removeAdmin(address admin) external onlyOwner {
        admins[admin] = false;
        emit AdminRemoved(admin);
    }

    /**
     * @dev Authorizes a marketplace contract
     */
    function authorizeMarketplace(address marketplace) external onlyOwner {
        authorizedMarketplace[marketplace] = true;
        emit MarketplaceAuthorized(marketplace);
    }

    /**
     * @dev Override transfer functions to check lock status
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721, IERC721) notLocked(tokenId) {
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721, IERC721) notLocked(tokenId) {
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override(ERC721, IERC721) notLocked(tokenId) {
        super.safeTransferFrom(from, to, tokenId, data);
    }

    /**
     * @dev Marketplace-only transfer (ignores lock)
     */
    function marketplaceTransfer(
        address from,
        address to,
        uint256 tokenId
    ) external onlyMarketplace {
        _transfer(from, to, tokenId);
    }

    /**
     * @dev Get ticket information
     */
    function getTicketInfo(uint256 tokenId) external view returns (TicketInfo memory) {
        require(_exists(tokenId), "Token does not exist");
        return ticketInfo[tokenId];
    }

    /**
     * @dev Pause contract
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    // Override required functions
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns the total number of tokens minted
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }
} 