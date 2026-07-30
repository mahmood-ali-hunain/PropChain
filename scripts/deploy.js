// scripts/deploy.js
// Compatible with Hardhat + Ethers.js v6 + OpenZeppelin v5

const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

try {
  require("dotenv").config();
} catch (error) {
  // dotenv is optional in environments where the package is not installed yet
}

// Helper: convert ETH to Wei
const tokens = (n) => {
  return ethers.parseUnits(n.toString(), "ether");
};

async function main() {
  // --- 1. Setup Accounts ---
  // Account[0] = buyer, [1] = seller, [2] = inspector, [3] = lender
  const [buyer, seller, inspector, lender] = await ethers.getSigners();

  console.log("\n==================================================");
  console.log("  Deploying Decentralized Property Exchange DApp  ");
  console.log("==================================================\n");
  console.log(`Buyer    : ${buyer.address}`);
  console.log(`Seller   : ${seller.address}`);
  console.log(`Inspector: ${inspector.address}`);
  console.log(`Lender   : ${lender.address}\n`);

  // --- 2. Deploy RealEstate ERC-721 Contract ---
  const RealEstate = await ethers.getContractFactory("RealEstate");
  const realEstate = await RealEstate.deploy();
  await realEstate.waitForDeployment();
  const realEstateAddress = await realEstate.getAddress();

  console.log(`✅ RealEstate (ERC-721) deployed at: ${realEstateAddress}`);

  const metadataBaseUrl = process.env.REACT_APP_METADATA_BASE_URL || "https://ipfs.io/ipfs";
  const ipfsCid = process.env.REACT_APP_IPFS_CID || "";
  const metadataUris = [1, 2, 3].map((id) => {
    if (ipfsCid) {
      return `${metadataBaseUrl}/${ipfsCid}/${id}.json`;
    }

    return `${process.env.PUBLIC_URL || ""}/metadata/${id}.json`;
  });

  console.log(`\n🏠 Minting ${metadataUris.length} property NFTs...`);
  for (let i = 0; i < metadataUris.length; i++) {
    const tx = await realEstate.connect(seller).mint(metadataUris[i]);
    await tx.wait();
    console.log(`   Token #${i + 1} minted → ${metadataUris[i]}`);
  }

  // --- 4. Deploy Escrow Contract ---
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(
    realEstateAddress,
    seller.address,
    inspector.address,
    lender.address
  );
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();

  console.log(`\n✅ Escrow Contract deployed at: ${escrowAddress}`);

  // --- 5. Approve Escrow to Transfer Each NFT (Seller approves) ---
  console.log(`\n🔐 Approving Escrow to hold NFTs...`);
  for (let i = 1; i <= metadataUris.length; i++) {
    const tx = await realEstate.connect(seller).approve(escrowAddress, i);
    await tx.wait();
    console.log(`   Token #${i} approved for Escrow`);
  }

  // --- 6. List Properties in Escrow (Seller lists with price & earnest amount) ---
  // Arguments: nftID, buyerAddress, purchasePrice, escrowAmount
  const listings = [
    { id: 1, price: "20", earnest: "10" },
    { id: 2, price: "15", earnest: "5" },
    { id: 3, price: "10", earnest: "5" },
  ];

  console.log(`\n📋 Listing properties in Escrow...`);
  for (const listing of listings) {
    const tx = await escrow
      .connect(seller)
      .list(
        listing.id,
        buyer.address,
        tokens(listing.price),
        tokens(listing.earnest)
      );
    await tx.wait();
    console.log(
      `   Property #${listing.id} listed → Price: ${listing.price} ETH, Earnest: ${listing.earnest} ETH`
    );
  }

  // --- 7. Save Contract Addresses to src/config.json ---
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  const config = {
    [chainId]: {
      realEstate: {
        address: realEstateAddress,
      },
      escrow: {
        address: escrowAddress,
      },
    },
  };

  const configPath = path.join(__dirname, "../src/config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log(`\n💾 Contract addresses saved to src/config.json`);
  console.log(`   Chain ID: ${chainId}`);
  console.log(`   RealEstate: ${realEstateAddress}`);
  console.log(`   Escrow: ${escrowAddress}`);

  console.log("\n==================================================");
  console.log("  Deployment complete! Now run: npm run start     ");
  console.log("==================================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
