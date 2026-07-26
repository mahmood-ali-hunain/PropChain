// test/Escrow.js
// Full test suite — compatible with Hardhat + Ethers.js v6 + Chai

const { expect } = require("chai");
const { ethers } = require("hardhat");

// Helper: parse ETH amount to wei
const tokens = (n) => ethers.parseUnits(n.toString(), "ether");

describe("Escrow Contract", () => {
  let buyer, seller, inspector, lender;
  let realEstate, escrow;

  beforeEach(async () => {
    // --- Setup 4 test accounts ---
    [buyer, seller, inspector, lender] = await ethers.getSigners();

    // --- Deploy RealEstate (ERC-721) ---
    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy();

    // --- Mint Property NFT #1 as Seller ---
    let transaction = await realEstate
      .connect(seller)
      .mint(
        "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS/1.json"
      );
    await transaction.wait();

    // --- Deploy Escrow Contract ---
    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      await realEstate.getAddress(),
      seller.address,
      inspector.address,
      lender.address
    );

    // --- Seller approves Escrow to hold NFT ---
    transaction = await realEstate
      .connect(seller)
      .approve(await escrow.getAddress(), 1);
    await transaction.wait();

    // --- Seller lists Property #1 in Escrow ---
    // Purchase price: 10 ETH | Earnest deposit: 5 ETH
    transaction = await escrow
      .connect(seller)
      .list(1, buyer.address, tokens(10), tokens(5));
    await transaction.wait();
  });

  // ============================================================
  // TEST SUITE 1: Deployment
  // ============================================================
  describe("Deployment", () => {
    it("Returns the correct NFT address", async () => {
      expect(await escrow.nftAddress()).to.equal(
        await realEstate.getAddress()
      );
    });

    it("Returns the correct seller address", async () => {
      expect(await escrow.seller()).to.equal(seller.address);
    });

    it("Returns the correct inspector address", async () => {
      expect(await escrow.inspector()).to.equal(inspector.address);
    });

    it("Returns the correct lender address", async () => {
      expect(await escrow.lender()).to.equal(lender.address);
    });
  });

  // ============================================================
  // TEST SUITE 2: Listing
  // ============================================================
  describe("Listing", () => {
    it("Marks property as listed", async () => {
      expect(await escrow.isListed(1)).to.equal(true);
    });

    it("Transfers NFT ownership to Escrow contract", async () => {
      expect(await realEstate.ownerOf(1)).to.equal(
        await escrow.getAddress()
      );
    });

    it("Records the correct buyer address", async () => {
      expect(await escrow.buyer(1)).to.equal(buyer.address);
    });

    it("Records the correct purchase price", async () => {
      expect(await escrow.purchasePrice(1)).to.equal(tokens(10));
    });

    it("Records the correct earnest (escrow) amount", async () => {
      expect(await escrow.escrowAmount(1)).to.equal(tokens(5));
    });
  });

  // ============================================================
  // TEST SUITE 3: Earnest Deposit
  // ============================================================
  describe("Deposits", () => {
    beforeEach(async () => {
      const tx = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) });
      await tx.wait();
    });

    it("Updates the Escrow contract balance after deposit", async () => {
      expect(await escrow.getBalance()).to.equal(tokens(5));
    });
  });

  // ============================================================
  // TEST SUITE 4: Inspection
  // ============================================================
  describe("Inspection", () => {
    beforeEach(async () => {
      const tx = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);
      await tx.wait();
    });

    it("Records inspection as passed", async () => {
      expect(await escrow.inspectionPassed(1)).to.equal(true);
    });
  });

  // ============================================================
  // TEST SUITE 5: Approvals
  // ============================================================
  describe("Approval", () => {
    it("Records approval from all three parties", async () => {
      let tx = await escrow.connect(buyer).approveSale(1);
      await tx.wait();

      tx = await escrow.connect(seller).approveSale(1);
      await tx.wait();

      tx = await escrow.connect(lender).approveSale(1);
      await tx.wait();

      expect(await escrow.approval(1, buyer.address)).to.equal(true);
      expect(await escrow.approval(1, seller.address)).to.equal(true);
      expect(await escrow.approval(1, lender.address)).to.equal(true);
    });
  });

  // ============================================================
  // TEST SUITE 6: Full Sale (The Atomic Swap)
  // ============================================================
  describe("Sale — Full End-to-End Flow", () => {
    beforeEach(async () => {
      // Step 1: Buyer deposits earnest money (5 ETH)
      let tx = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) });
      await tx.wait();

      // Step 2: Inspector approves inspection
      tx = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);
      await tx.wait();

      // Step 3: All parties approve the sale
      tx = await escrow.connect(buyer).approveSale(1);
      await tx.wait();

      tx = await escrow.connect(seller).approveSale(1);
      await tx.wait();

      tx = await escrow.connect(lender).approveSale(1);
      await tx.wait();

      // Step 4: Lender sends remaining funds (5 ETH) directly to contract
      await lender.sendTransaction({
        to: await escrow.getAddress(),
        value: tokens(5),
      });

      // Step 5: Seller finalizes the sale → Atomic Swap executes
      tx = await escrow.connect(seller).finalizeSale(1);
      await tx.wait();
    });

    it("Transfers NFT ownership from Escrow to Buyer", async () => {
      expect(await realEstate.ownerOf(1)).to.equal(buyer.address);
    });

    it("Empties Escrow contract balance (funds sent to Seller)", async () => {
      expect(await escrow.getBalance()).to.equal(0);
    });

    it("Marks the property as no longer listed", async () => {
      expect(await escrow.isListed(1)).to.equal(false);
    });
  });

  // ============================================================
  // TEST SUITE 7: Cancellation
  // ============================================================
  describe("Sale Cancellation", () => {
    it("Refunds buyer if inspection failed", async () => {
      // Buyer deposits earnest
      let tx = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) });
      await tx.wait();

      // Inspection fails
      tx = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, false);
      await tx.wait();

      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      // Cancel sale
      tx = await escrow.connect(buyer).cancelSale(1);
      await tx.wait();

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);

      // Buyer should have received the funds back
      expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);
    });
  });
});
