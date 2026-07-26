# 🏠 Decentralized Property Exchange — Complete Setup Guide
**Thesis Project | QUEST Nawabshah | 2026**

---

## ⚡ Why the Old Code Doesn't Work

The original Dapp University tutorial code is ~3 years old. These are the **breaking changes** that broke it:

| What Changed | Old (v5/v4) | New (v6/v5) |
|---|---|---|
| **Ethers.js** | `ethers.providers.Web3Provider()` | `ethers.BrowserProvider()` |
| **Ethers.js** | `ethers.utils.parseEther()` | `ethers.parseEther()` |
| **Ethers.js** | `ethers.utils.getAddress()` | `ethers.getAddress()` |
| **Ethers.js** | `contract.address` | `await contract.getAddress()` |
| **OpenZeppelin** | `Counters.sol` library exists | Removed in v5 — use plain `uint256` |
| **Hardhat** | `@nomiclabs/hardhat-waffle` | `@nomicfoundation/hardhat-toolbox` |
| **Hardhat** | `@nomiclabs/hardhat-ethers` | `@nomicfoundation/hardhat-ethers` |

All of these have been fixed in the code files provided in this package.

---

## 📋 Prerequisites — Install These First

### 1. Node.js (CRITICAL: Use v18 or v20 ONLY)
- Download from: https://nodejs.org/
- ✅ v18.x LTS — WORKS
- ✅ v20.x LTS — WORKS
- ❌ v21+ — May cause issues
- Check your version: `node --version`

### 2. Git
- Download from: https://git-scm.com/

### 3. MetaMask Browser Extension
- Install from: https://metamask.io/
- Create a wallet if you don't have one
- **Keep your seed phrase safe!**

---

## 🚀 Step-by-Step Setup

### Step 1 — Get the Code

Either use this provided project folder, or clone from the official source:
```bash
git clone https://github.com/dappuniversity/millow.git
cd millow
```

If using the provided files, just navigate to the project folder:
```bash
cd millow
```

---

### Step 2 — Install All Dependencies

```bash
npm install
```

This installs everything listed in `package.json`. Takes 2-5 minutes.

> If you see `WARN deprecated` messages — that's fine, ignore them.
> If you see `npm ERR!` — check your Node.js version first.

---

### Step 3 — Run Tests (Verify Contracts Work)

```bash
npx hardhat test
```

**Expected output:**
```
  Escrow Contract
    Deployment
      ✔ Returns the correct NFT address
      ✔ Returns the correct seller address
      ✔ Returns the correct inspector address
      ✔ Returns the correct lender address
    Listing
      ✔ Marks property as listed
      ✔ Transfers NFT ownership to Escrow contract
      ✔ Records the correct buyer address
      ✔ Records the correct purchase price
      ✔ Records the correct earnest (escrow) amount
    Deposits
      ✔ Updates the Escrow contract balance after deposit
    Inspection
      ✔ Records inspection as passed
    Approval
      ✔ Records approval from all three parties
    Sale — Full End-to-End Flow
      ✔ Transfers NFT ownership from Escrow to Buyer
      ✔ Empties Escrow contract balance (funds sent to Seller)
      ✔ Marks the property as no longer listed
    Sale Cancellation
      ✔ Refunds buyer if inspection failed

  16 passing (Xs)
```

✅ If all tests pass — your smart contracts are working!

---


### Step 4 — Start the Hardhat Local Blockchain

Open a **new terminal window** (keep this running):
```bash
npx hardhat node
```

You will see 20 test accounts with private keys. **Copy the first 4** — you'll need them for MetaMask:
```
Account #0: 0xf39Fd6...  (10000 ETH)  ← This will be the BUYER
Account #1: 0x70997...  (10000 ETH)   ← This will be the SELLER
Account #2: 0x3C44C...  (10000 ETH)   ← This will be the INSPECTOR
Account #3: 0x90F79...  (10000 ETH)   ← This will be the LENDER

Private Key #0: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478...
Private Key #1: 0x59c6995e998f97a5a0044966f0945389dc9e86d...
Private Key #2: 0x5de4111afa1a4b94908f83103eb1f1706367c2e...
Private Key #3: 0x7c852118294e51e653712a81e05800f419141751...
```

---

### Step 5 — Deploy Smart Contracts

In your **original terminal** (not the hardhat node terminal):
```bash
npx hardhat run ./scripts/deploy.js --network localhost
```

**Expected output:**
```
✅ RealEstate (ERC-721) deployed at: 0x5FbDB...
🏠 Minting 3 property NFTs...
   Token #1 minted
   Token #2 minted
   Token #3 minted
✅ Escrow Contract deployed at: 0xe7f17...
📋 Listing 3 properties in Escrow...
   Property #1 listed → Price: 20 ETH, Earnest: 10 ETH
   Property #2 listed → Price: 15 ETH, Earnest: 5 ETH
   Property #3 listed → Price: 10 ETH, Earnest: 5 ETH
💾 Contract addresses saved to src/config.json
```

> The script automatically saves the contract addresses to `src/config.json`.
> You do NOT need to copy-paste addresses manually.

---

### Step 6 — Configure MetaMask

#### 6a. Add Hardhat Local Network to MetaMask

1. Open MetaMask → Click the network dropdown (top)
2. Click **"Add a network"** → **"Add a network manually"**
3. Enter these details:
   - **Network Name**: `Hardhat Localhost`
   - **New RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `1337`
   - **Currency Symbol**: `ETH`
4. Click **Save**
5. Switch to **Hardhat Localhost** network

#### 6b. Import Test Accounts into MetaMask

You need to import accounts from Step 4. In MetaMask:
1. Click the account icon (top right)
2. Click **"Import Account"**
3. Paste **Private Key #0** (the Buyer account)
4. Repeat for **Private Key #1** (Seller), **#2** (Inspector), **#3** (Lender)

Now you have 4 accounts with 10,000 test ETH each!

> ⚠️ NEVER use these private keys on mainnet. They are public test keys.

---

### Step 7 — Start the React Frontend

```bash
npm run start
```

The app opens at: **http://localhost:3000**

---

## 🧪 Testing the Complete Transaction Flow

Open the app. Connect MetaMask. Switch between accounts to simulate the full flow:

### Transaction Roles:
| Account | Role | Action |
|---|---|---|
| Account #0 | **Buyer** | Deposits earnest money, approves |
| Account #1 | **Seller** | Lists property, finalizes sale |
| Account #2 | **Inspector** | Approves inspection |
| Account #3 | **Lender** | Funds the loan, approves |

### The Flow (switch accounts in MetaMask for each step):

**As Buyer (Account #0):**
1. Connect MetaMask → click a property card → click **"Buy"**
2. Confirm the MetaMask transaction (sends earnest money)

**As Inspector (Account #2):**
3. Switch to Account #2 in MetaMask
4. Click the same property → click **"Approve Inspection"**
5. Confirm MetaMask transaction

**As Lender (Account #3):**
6. Switch to Account #3 in MetaMask
7. Click the property → click **"Approve & Lend"**
8. Confirm MetaMask transaction (sends loan funds to escrow)

**As Seller (Account #1):**
9. Switch to Account #1 in MetaMask
10. Click the property → click **"Approve & Finalize Sale"**
11. Confirm MetaMask transaction → **Atomic Swap executes!**

The property card should now show **"Owned by 0xf39F..."** (the buyer's address)

---

## 🔧 Common Errors & Fixes

### Error: "ENOENT: no such file or directory, 'src/config.json'"
**Cause**: Deploy script hasn't been run yet.
**Fix**: Run `npx hardhat run ./scripts/deploy.js --network localhost`

### Error: "Network not configured" alert in browser
**Cause**: MetaMask is on wrong network.
**Fix**: Switch MetaMask to "Hardhat Localhost" (Chain ID 1337)

### Error: "Could not connect to MetaMask"
**Fix**: Install MetaMask extension, then refresh the page.

### Error: `nonce too high` in MetaMask
**Cause**: You restarted Hardhat but MetaMask has cached the old nonce.
**Fix**: MetaMask → Settings → Advanced → **Reset Account**

### Error: `cannot estimate gas` or transaction fails
**Cause**: Wrong account connected (e.g., buyer trying to do inspector action).
**Fix**: Switch to the correct account in MetaMask.

### Error: `Error: could not detect network`
**Cause**: Hardhat node isn't running.
**Fix**: Run `npx hardhat node` in a separate terminal first.

### Error during `npm install`: `unsupported engine`
**Cause**: Node.js version is too new (v21+).
**Fix**: Downgrade to Node.js v18 or v20 LTS.

### Error: `Module not found: ethers`
**Fix**: Run `npm install` again.

---

## 📁 Project Structure

```
millow/
├── contracts/
│   ├── RealEstate.sol      ← ERC-721 NFT contract (property titles)
│   └── Escrow.sol          ← Multi-party escrow with atomic swap
├── scripts/
│   └── deploy.js           ← Deploys contracts & saves addresses
├── test/
│   └── Escrow.js           ← Full test suite (16 tests)
├── src/
│   ├── App.js              ← Main React component
│   ├── App.css             ← Styling
│   ├── index.js            ← React entry point
│   ├── config.json         ← Contract addresses (auto-updated)
│   ├── artifacts/          ← ABIs (auto-generated by Hardhat)
│   └── components/
│       ├── Navigation.js   ← Navbar with wallet connect
│       ├── Search.js       ← Search bar
│       └── Home.js         ← Property detail modal
├── hardhat.config.js       ← Hardhat configuration
└── package.json            ← Dependencies
```

---

## 🔗 Deployment to Sepolia Testnet (For Thesis Objective 4)

To deploy to the actual Sepolia testnet (as required by your thesis):

### 1. Get Sepolia Test ETH
- Visit https://sepoliafaucet.com/ or https://faucets.chain.link/sepolia
- Connect your MetaMask wallet (create a new account for this)
- Request free Sepolia ETH

### 2. Get an Infura/Alchemy RPC URL
- Sign up at https://infura.io/ (free)
- Create a new project → copy the Sepolia HTTPS URL

### 3. Add Sepolia to hardhat.config.js
```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  paths: {
    artifacts: "./src/artifacts"
  },
  networks: {
    hardhat: { chainId: 1337 },
    localhost: { url: "http://127.0.0.1:8545", chainId: 1337 },
    sepolia: {
      url: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      accounts: ["YOUR_METAMASK_PRIVATE_KEY"]   // Never commit this to GitHub!
    }
  }
};
```

### 4. Deploy to Sepolia
```bash
npx hardhat run ./scripts/deploy.js --network sepolia
```

### 5. Update config.json for Sepolia
The deploy script auto-saves addresses. Update the chain ID in the file from `1337` to `11155111` (Sepolia's chain ID).

---

## 📊 Thesis Verification Points

For your viva/presentation, you can demonstrate:

| Thesis Objective | How to Show It |
|---|---|
| **Obj 1**: ERC-721 property token | Show `RealEstate.sol` and minted tokens in deploy output |
| **Obj 2**: Multi-party escrow | Show 4 separate MetaMask transactions in the flow |
| **Obj 3**: Atomic swap logic | Show the `finalizeSale()` function in `Escrow.sol` |
| **Obj 4**: Sepolia deployment | Show contract address on sepolia.etherscan.io |

---

*Generated for: Decentralized Property Exchange Application using Ethereum Smart Contracts*
*Quaid-e-Awam University of Engineering, Science & Technology, Nawabshah — 2026*