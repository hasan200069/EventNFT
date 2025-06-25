const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EventTicketNFT", function () {
  let eventTicketNFT;
  let owner, admin, seller, buyer, marketplace;

  const sampleTicket = {
    eventName: "Rock Concert 2024",
    eventDate: "2024-12-31",
    venue: "Madison Square Garden",
    seatInfo: "Section A, Row 5, Seat 10",
    originalPrice: ethers.parseEther("0.1"),
    proofImageHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    tokenURI: "https://ipfs.io/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
  };

  beforeEach(async function () {
    [owner, admin, seller, buyer, marketplace] = await ethers.getSigners();

    const EventTicketNFT = await ethers.getContractFactory("EventTicketNFT");
    eventTicketNFT = await EventTicketNFT.deploy();
    await eventTicketNFT.waitForDeployment();

    // Add admin
    await eventTicketNFT.addAdmin(admin.address);
    
    // Authorize marketplace
    await eventTicketNFT.authorizeMarketplace(marketplace.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await eventTicketNFT.owner()).to.equal(owner.address);
    });

    it("Should set deployer as admin", async function () {
      expect(await eventTicketNFT.admins(owner.address)).to.be.true;
    });

    it("Should have correct name and symbol", async function () {
      expect(await eventTicketNFT.name()).to.equal("EventTicketNFT");
      expect(await eventTicketNFT.symbol()).to.equal("ETNFT");
    });
  });

  describe("Admin Management", function () {
    it("Should allow owner to add admin", async function () {
      const newAdmin = ethers.Wallet.createRandom();
      await eventTicketNFT.addAdmin(newAdmin.address);
      expect(await eventTicketNFT.admins(newAdmin.address)).to.be.true;
    });

    it("Should allow owner to remove admin", async function () {
      await eventTicketNFT.removeAdmin(admin.address);
      expect(await eventTicketNFT.admins(admin.address)).to.be.false;
    });

    it("Should not allow non-owner to add admin", async function () {
      const newAdmin = ethers.Wallet.createRandom();
      await expect(
        eventTicketNFT.connect(admin).addAdmin(newAdmin.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Ticket Minting", function () {
    it("Should mint a ticket with correct information", async function () {
      const tx = await eventTicketNFT.mintTicket(
        seller.address,
        sampleTicket.eventName,
        sampleTicket.eventDate,
        sampleTicket.venue,
        sampleTicket.seatInfo,
        sampleTicket.originalPrice,
        sampleTicket.proofImageHash,
        sampleTicket.tokenURI
      );

      await expect(tx)
        .to.emit(eventTicketNFT, "TicketMinted")
        .withArgs(0, seller.address, sampleTicket.eventName);

      expect(await eventTicketNFT.ownerOf(0)).to.equal(seller.address);
      expect(await eventTicketNFT.tokenURI(0)).to.equal(sampleTicket.tokenURI);

      const ticketInfo = await eventTicketNFT.getTicketInfo(0);
      expect(ticketInfo.eventName).to.equal(sampleTicket.eventName);
      expect(ticketInfo.originalSeller).to.equal(seller.address);
      expect(ticketInfo.status).to.equal(0); // PENDING
    });

    it("Should increment token ID", async function () {
      await eventTicketNFT.mintTicket(
        seller.address,
        sampleTicket.eventName,
        sampleTicket.eventDate,
        sampleTicket.venue,
        sampleTicket.seatInfo,
        sampleTicket.originalPrice,
        sampleTicket.proofImageHash,
        sampleTicket.tokenURI
      );

      await eventTicketNFT.mintTicket(
        seller.address,
        "Another Event",
        "2024-11-01",
        "Another Venue",
        "Section B",
        ethers.parseEther("0.2"),
        "QmAnotherHash",
        "https://ipfs.io/ipfs/QmAnotherHash"
      );

      expect(await eventTicketNFT.ownerOf(0)).to.equal(seller.address);
      expect(await eventTicketNFT.ownerOf(1)).to.equal(seller.address);
    });
  });

  describe("Ticket Verification", function () {
    beforeEach(async function () {
      await eventTicketNFT.mintTicket(
        seller.address,
        sampleTicket.eventName,
        sampleTicket.eventDate,
        sampleTicket.venue,
        sampleTicket.seatInfo,
        sampleTicket.originalPrice,
        sampleTicket.proofImageHash,
        sampleTicket.tokenURI
      );
    });

    it("Should allow admin to verify ticket", async function () {
      const tx = await eventTicketNFT.connect(admin).verifyTicket(0);
      
      await expect(tx)
        .to.emit(eventTicketNFT, "TicketVerified")
        .withArgs(0, admin.address);

      const ticketInfo = await eventTicketNFT.getTicketInfo(0);
      expect(ticketInfo.status).to.equal(1); // VERIFIED
    });

    it("Should not allow non-admin to verify ticket", async function () {
      await expect(
        eventTicketNFT.connect(seller).verifyTicket(0)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should not verify already verified ticket", async function () {
      await eventTicketNFT.connect(admin).verifyTicket(0);
      
      await expect(
        eventTicketNFT.connect(admin).verifyTicket(0)
      ).to.be.revertedWith("Ticket not pending verification");
    });
  });

  describe("Ticket Locking", function () {
    beforeEach(async function () {
      await eventTicketNFT.mintTicket(
        seller.address,
        sampleTicket.eventName,
        sampleTicket.eventDate,
        sampleTicket.venue,
        sampleTicket.seatInfo,
        sampleTicket.originalPrice,
        sampleTicket.proofImageHash,
        sampleTicket.tokenURI
      );
      await eventTicketNFT.connect(admin).verifyTicket(0);
    });

    it("Should allow marketplace to lock ticket", async function () {
      const tx = await eventTicketNFT.connect(marketplace).lockTicket(0);
      
      await expect(tx).to.emit(eventTicketNFT, "TicketLocked").withArgs(0);
      
      expect(await eventTicketNFT.isLocked(0)).to.be.true;
      
      const ticketInfo = await eventTicketNFT.getTicketInfo(0);
      expect(ticketInfo.status).to.equal(2); // LOCKED
    });

    it("Should not allow non-marketplace to lock ticket", async function () {
      await expect(
        eventTicketNFT.connect(seller).lockTicket(0)
      ).to.be.revertedWith("Only authorized marketplace");
    });

    it("Should prevent transfer of locked ticket", async function () {
      await eventTicketNFT.connect(marketplace).lockTicket(0);
      
      await expect(
        eventTicketNFT.connect(seller).transferFrom(seller.address, buyer.address, 0)
      ).to.be.revertedWith("Token is locked");
    });

    it("Should allow marketplace transfer even when locked", async function () {
      await eventTicketNFT.connect(marketplace).lockTicket(0);
      
      await eventTicketNFT.connect(marketplace).marketplaceTransfer(
        seller.address, 
        buyer.address, 
        0
      );
      
      expect(await eventTicketNFT.ownerOf(0)).to.equal(buyer.address);
    });
  });

  describe("Ticket Unlocking", function () {
    beforeEach(async function () {
      await eventTicketNFT.mintTicket(
        seller.address,
        sampleTicket.eventName,
        sampleTicket.eventDate,
        sampleTicket.venue,
        sampleTicket.seatInfo,
        sampleTicket.originalPrice,
        sampleTicket.proofImageHash,
        sampleTicket.tokenURI
      );
      await eventTicketNFT.connect(admin).verifyTicket(0);
      await eventTicketNFT.connect(marketplace).lockTicket(0);
    });

    it("Should allow marketplace to unlock ticket", async function () {
      const tx = await eventTicketNFT.connect(marketplace).unlockTicket(0);
      
      await expect(tx).to.emit(eventTicketNFT, "TicketUnlocked").withArgs(0);
      
      expect(await eventTicketNFT.isLocked(0)).to.be.false;
      
      const ticketInfo = await eventTicketNFT.getTicketInfo(0);
      expect(ticketInfo.status).to.equal(3); // UNLOCKED
    });

    it("Should allow transfer after unlocking", async function () {
      await eventTicketNFT.connect(marketplace).unlockTicket(0);
      
      await eventTicketNFT.connect(seller).transferFrom(
        seller.address, 
        buyer.address, 
        0
      );
      
      expect(await eventTicketNFT.ownerOf(0)).to.equal(buyer.address);
    });
  });

  describe("Dispute Handling", function () {
    beforeEach(async function () {
      await eventTicketNFT.mintTicket(
        seller.address,
        sampleTicket.eventName,
        sampleTicket.eventDate,
        sampleTicket.venue,
        sampleTicket.seatInfo,
        sampleTicket.originalPrice,
        sampleTicket.proofImageHash,
        sampleTicket.tokenURI
      );
      await eventTicketNFT.connect(admin).verifyTicket(0);
    });

    it("Should allow marketplace to mark as disputed", async function () {
      const tx = await eventTicketNFT.connect(marketplace).markAsDisputed(0);
      
      await expect(tx)
        .to.emit(eventTicketNFT, "TicketStatusChanged")
        .withArgs(0, 4); // DISPUTED
      
      const ticketInfo = await eventTicketNFT.getTicketInfo(0);
      expect(ticketInfo.status).to.equal(4); // DISPUTED
    });
  });

  describe("Pausable Functionality", function () {
    it("Should allow owner to pause contract", async function () {
      await eventTicketNFT.pause();
      expect(await eventTicketNFT.paused()).to.be.true;
    });

    it("Should prevent minting when paused", async function () {
      await eventTicketNFT.pause();
      
      await expect(
        eventTicketNFT.mintTicket(
          seller.address,
          sampleTicket.eventName,
          sampleTicket.eventDate,
          sampleTicket.venue,
          sampleTicket.seatInfo,
          sampleTicket.originalPrice,
          sampleTicket.proofImageHash,
          sampleTicket.tokenURI
        )
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow owner to unpause contract", async function () {
      await eventTicketNFT.pause();
      await eventTicketNFT.unpause();
      expect(await eventTicketNFT.paused()).to.be.false;
    });
  });
}); 