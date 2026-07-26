require("@nomicfoundation/hardhat-toolbox");

try {
  require("dotenv").config();
} catch (error) {
  // dotenv is optional for local development when dependencies are not installed yet
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    artifacts: "./src/artifacts"
  },
  networks: {
    hardhat: {
      chainId: Number(process.env.HARDHAT_CHAIN_ID || 1337)
    },
    localhost: {
      url: process.env.LOCALHOST_RPC || "http://127.0.0.1:8545",
      chainId: Number(process.env.CHAIN_ID || 1337)
    }
  }
};