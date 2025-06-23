// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./EventTicketNFT.sol";

/**
 * @title TicketMarketplace
 * @dev Marketplace contract with escrow functionality for event ticket NFTs
 */
contract TicketMarketplace is ReentrancyGuard, Ownable, Pausable {
    EventTicketNFT public ticketNFT;

    // Listing structure
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
        uint256 timestamp;
    }

    // Escrow transaction structure
    struct EscrowTransaction {
        uint256 tokenId;
        address seller;
        address buyer;
        uint256 price;
        uint256 startTime;
        bool sellerConfirmed;
        bool buyerConfirmed;
        bool disputed;
        bool completed;
        string disputeReason;
    }

    // State variables
    uint256 public marketplaceFee = 250; // 2.5% fee (basis points)
    uint256 public constant CONFIRMATION_PERIOD = 7 days;
    uint256 public constant MAX_FEE = 1000; // 10% maximum fee

    // Mappings
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => EscrowTransaction) public escrowTransactions;
    mapping(address => bool) public admins;
    
    // Arrays for iteration
    uint256[] public listedTokenIds;
    uint256[] public escrowTokenIds;

    // Events
    event TicketListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event TicketUnlisted(uint256 indexed tokenId, address indexed seller);
    event TicketPurchased(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
    event EscrowCreated(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
    event TransactionConfirmed(uint256 indexed tokenId, address indexed confirmer, bool isSeller);
    event EscrowCompleted(uint256 indexed tokenId, address indexed buyer, address indexed seller);
    event DisputeRaised(uint256 indexed tokenId, address indexed raiser, string reason);
    event DisputeResolved(uint256 indexed tokenId, address indexed resolver, bool sellerWins);
    event FeesWithdrawn(address indexed owner, uint256 amount);
    event MarketplaceFeeUpdated(uint256 newFee);

    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner(), "Only admin can perform this action");
        _;
    }

    modifier validTokenId(uint256 tokenId) {
        require(tokenId < ticketNFT.totalSupply(), "Invalid token ID");
        _;
    }

    constructor(address _ticketNFT) {
        ticketNFT = EventTicketNFT(_ticketNFT);
        admins[msg.sender] = true;
    }

    /**
     * @dev Lists a ticket for sale
     */
    function listTicket(uint256 tokenId, uint256 price) 
        external 
        nonReentrant 
        whenNotPaused 
        validTokenId(tokenId) 
    {
        require(ticketNFT.ownerOf(tokenId) == msg.sender, "You don't own this ticket");
        require(price > 0, "Price must be greater than 0");
        require(!listings[tokenId].active, "Ticket already listed");
        
        // Check if ticket is verified
        EventTicketNFT.TicketInfo memory info = ticketNFT.getTicketInfo(tokenId);
        require(
            info.status == EventTicketNFT.TicketStatus.VERIFIED || 
            info.status == EventTicketNFT.TicketStatus.UNLOCKED, 
            "Ticket not verified or available for sale"
        );

        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true,
            timestamp: block.timestamp
        });

        listedTokenIds.push(tokenId);
        emit TicketListed(tokenId, msg.sender, price);
    }

    /**
     * @dev Unlists a ticket from sale
     */
    function unlistTicket(uint256 tokenId) 
        external 
        nonReentrant 
        validTokenId(tokenId) 
    {
        require(listings[tokenId].seller == msg.sender, "You didn't list this ticket");
        require(listings[tokenId].active, "Ticket not listed");
        require(!_isInEscrow(tokenId), "Ticket is in escrow");

        listings[tokenId].active = false;
        _removeFromListedTokens(tokenId);
        
        emit TicketUnlisted(tokenId, msg.sender);
    }

    /**
     * @dev Purchases a ticket and creates escrow
     */
    function purchaseTicket(uint256 tokenId) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        validTokenId(tokenId) 
    {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Ticket not for sale");
        require(msg.value == listing.price, "Incorrect payment amount");
        require(msg.sender != listing.seller, "Cannot buy your own ticket");
        require(!_isInEscrow(tokenId), "Ticket already in escrow");

        // Lock the ticket
        ticketNFT.lockTicket(tokenId);

        // Create escrow transaction
        escrowTransactions[tokenId] = EscrowTransaction({
            tokenId: tokenId,
            seller: listing.seller,
            buyer: msg.sender,
            price: listing.price,
            startTime: block.timestamp,
            sellerConfirmed: false,
            buyerConfirmed: false,
            disputed: false,
            completed: false,
            disputeReason: ""
        });

        // Transfer NFT to buyer (but it remains locked)
        ticketNFT.marketplaceTransfer(listing.seller, msg.sender, tokenId);

        // Remove from active listings
        listings[tokenId].active = false;
        _removeFromListedTokens(tokenId);
        escrowTokenIds.push(tokenId);

        emit TicketPurchased(tokenId, msg.sender, listing.seller, listing.price);
        emit EscrowCreated(tokenId, msg.sender, listing.seller, listing.price);
    }

    /**
     * @dev Confirms transaction (buyer or seller)
     */
    function confirmTransaction(uint256 tokenId) 
        external 
        nonReentrant 
        validTokenId(tokenId) 
    {
        EscrowTransaction storage escrow = escrowTransactions[tokenId];
        require(escrow.price > 0, "No escrow transaction found");
        require(!escrow.completed, "Transaction already completed");
        require(!escrow.disputed, "Transaction is disputed");
        require(
            msg.sender == escrow.buyer || msg.sender == escrow.seller,
            "Not authorized to confirm"
        );

        if (msg.sender == escrow.seller) {
            require(!escrow.sellerConfirmed, "Already confirmed by seller");
            escrow.sellerConfirmed = true;
            emit TransactionConfirmed(tokenId, msg.sender, true);
        } else {
            require(!escrow.buyerConfirmed, "Already confirmed by buyer");
            escrow.buyerConfirmed = true;
            emit TransactionConfirmed(tokenId, msg.sender, false);
        }

        // Check if both parties confirmed
        if (escrow.sellerConfirmed && escrow.buyerConfirmed) {
            _completeEscrow(tokenId);
        }
    }

    /**
     * @dev Auto-releases escrow after 7 days
     */
    function autoReleaseEscrow(uint256 tokenId) 
        external 
        nonReentrant 
        validTokenId(tokenId) 
    {
        EscrowTransaction storage escrow = escrowTransactions[tokenId];
        require(escrow.price > 0, "No escrow transaction found");
        require(!escrow.completed, "Transaction already completed");
        require(!escrow.disputed, "Transaction is disputed");
        require(
            block.timestamp >= escrow.startTime + CONFIRMATION_PERIOD,
            "Confirmation period not ended"
        );

        _completeEscrow(tokenId);
    }

    /**
     * @dev Raises a dispute
     */
    function raiseDispute(uint256 tokenId, string memory reason) 
        external 
        nonReentrant 
        validTokenId(tokenId) 
    {
        EscrowTransaction storage escrow = escrowTransactions[tokenId];
        require(escrow.price > 0, "No escrow transaction found");
        require(!escrow.completed, "Transaction already completed");
        require(!escrow.disputed, "Dispute already raised");
        require(
            msg.sender == escrow.buyer || msg.sender == escrow.seller,
            "Not authorized to raise dispute"
        );

        escrow.disputed = true;
        escrow.disputeReason = reason;
        
        // Mark ticket as disputed
        ticketNFT.markAsDisputed(tokenId);

        emit DisputeRaised(tokenId, msg.sender, reason);
    }

    /**
     * @dev Resolves a dispute (admin only)
     */
    function resolveDispute(uint256 tokenId, bool sellerWins) 
        external 
        onlyAdmin 
        nonReentrant 
        validTokenId(tokenId) 
    {
        EscrowTransaction storage escrow = escrowTransactions[tokenId];
        require(escrow.disputed, "No dispute to resolve");
        require(!escrow.completed, "Transaction already completed");

        if (sellerWins) {
            // Seller wins: release funds to seller, NFT stays with buyer
            _releaseFundsToSeller(tokenId);
            ticketNFT.unlockTicket(tokenId);
        } else {
            // Buyer wins: refund buyer, return NFT to seller
            _refundBuyer(tokenId);
            ticketNFT.marketplaceTransfer(escrow.buyer, escrow.seller, tokenId);
            ticketNFT.unlockTicket(tokenId);
        }

        escrow.completed = true;
        _removeFromEscrowTokens(tokenId);

        emit DisputeResolved(tokenId, msg.sender, sellerWins);
    }

    /**
     * @dev Internal function to complete escrow
     */
    function _completeEscrow(uint256 tokenId) internal {
        EscrowTransaction storage escrow = escrowTransactions[tokenId];
        
        _releaseFundsToSeller(tokenId);
        ticketNFT.unlockTicket(tokenId);
        
        escrow.completed = true;
        _removeFromEscrowTokens(tokenId);

        emit EscrowCompleted(tokenId, escrow.buyer, escrow.seller);
    }

    /**
     * @dev Internal function to release funds to seller
     */
    function _releaseFundsToSeller(uint256 tokenId) internal {
        EscrowTransaction memory escrow = escrowTransactions[tokenId];
        
        uint256 fee = (escrow.price * marketplaceFee) / 10000;
        uint256 sellerAmount = escrow.price - fee;

        payable(escrow.seller).transfer(sellerAmount);
        // Fee stays in contract for withdrawal by owner
    }

    /**
     * @dev Internal function to refund buyer
     */
    function _refundBuyer(uint256 tokenId) internal {
        EscrowTransaction memory escrow = escrowTransactions[tokenId];
        payable(escrow.buyer).transfer(escrow.price);
    }

    /**
     * @dev Checks if token is in escrow
     */
    function _isInEscrow(uint256 tokenId) internal view returns (bool) {
        EscrowTransaction memory escrow = escrowTransactions[tokenId];
        return escrow.price > 0 && !escrow.completed;
    }

    /**
     * @dev Removes token from listed tokens array
     */
    function _removeFromListedTokens(uint256 tokenId) internal {
        for (uint256 i = 0; i < listedTokenIds.length; i++) {
            if (listedTokenIds[i] == tokenId) {
                listedTokenIds[i] = listedTokenIds[listedTokenIds.length - 1];
                listedTokenIds.pop();
                break;
            }
        }
    }

    /**
     * @dev Removes token from escrow tokens array
     */
    function _removeFromEscrowTokens(uint256 tokenId) internal {
        for (uint256 i = 0; i < escrowTokenIds.length; i++) {
            if (escrowTokenIds[i] == tokenId) {
                escrowTokenIds[i] = escrowTokenIds[escrowTokenIds.length - 1];
                escrowTokenIds.pop();
                break;
            }
        }
    }

    /**
     * @dev Gets all active listings
     */
    function getActiveListings() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < listedTokenIds.length; i++) {
            if (listings[listedTokenIds[i]].active) {
                activeCount++;
            }
        }

        uint256[] memory activeListings = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < listedTokenIds.length; i++) {
            if (listings[listedTokenIds[i]].active) {
                activeListings[index] = listedTokenIds[i];
                index++;
            }
        }

        return activeListings;
    }

    /**
     * @dev Gets all active escrow transactions
     */
    function getActiveEscrows() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < escrowTokenIds.length; i++) {
            if (!escrowTransactions[escrowTokenIds[i]].completed) {
                activeCount++;
            }
        }

        uint256[] memory activeEscrows = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < escrowTokenIds.length; i++) {
            if (!escrowTransactions[escrowTokenIds[i]].completed) {
                activeEscrows[index] = escrowTokenIds[i];
                index++;
            }
        }

        return activeEscrows;
    }

    /**
     * @dev Updates marketplace fee
     */
    function updateMarketplaceFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee too high");
        marketplaceFee = newFee;
        emit MarketplaceFeeUpdated(newFee);
    }

    /**
     * @dev Adds an admin
     */
    function addAdmin(address admin) external onlyOwner {
        admins[admin] = true;
    }

    /**
     * @dev Removes an admin
     */
    function removeAdmin(address admin) external onlyOwner {
        admins[admin] = false;
    }

    /**
     * @dev Withdraws accumulated fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        payable(owner()).transfer(balance);
        emit FeesWithdrawn(owner(), balance);
    }

    /**
     * @dev Pauses the marketplace
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses the marketplace
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency function to recover stuck tokens
     */
    function emergencyRecoverToken(uint256 tokenId) external onlyOwner {
        require(ticketNFT.ownerOf(tokenId) == address(this), "Token not in contract");
        ticketNFT.safeTransferFrom(address(this), owner(), tokenId);
    }

    // Fallback function to reject direct Ether transfers
    receive() external payable {
        revert("Direct transfers not allowed");
    }
} 