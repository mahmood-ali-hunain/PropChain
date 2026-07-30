// src/App.js
import { useEffect, useState } from "react";
import { ethers } from "ethers";

import Navigation from "./components/Navigation";
import Search from "./components/Search";
import Home from "./components/Home";

import RealEstateABI from "./artifacts/contracts/RealEstate.sol/RealEstate.json";
import EscrowABI from "./artifacts/contracts/Escrow.sol/Escrow.json";
import config from "./config.json";
import { loadMetadataForToken } from "./utils/metadata";

const fallbackChainId = process.env.REACT_APP_CHAIN_ID || "1337";

function App() {
  const [provider, setProvider] = useState(null);
  const [escrow, setEscrow]     = useState(null);
  const [account, setAccount]   = useState(null);
  const [homes, setHomes]       = useState([]);
  const [home, setHome]         = useState({});
  const [toggle, setToggle]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const loadBlockchainData = async () => {
    setLoading(true);
    setError("");

    try {
      const rpcUrl = process.env.REACT_APP_RPC_URL || "http://127.0.0.1:8545";
      const readProvider = new ethers.JsonRpcProvider(rpcUrl);

      const network = await readProvider.getNetwork();
      const chainId = network.chainId.toString();
      const networkConfig = config[chainId] || config[fallbackChainId] || config["1337"];

      if (!networkConfig) {
        setError("Network not configured. Start Hardhat localhost and refresh the page.");
        return;
      }

      const realEstate = new ethers.Contract(
        networkConfig.realEstate.address,
        RealEstateABI.abi,
        readProvider
      );

      const totalSupply = await realEstate.totalSupply();
      const homes = [];

      for (let i = 1; i <= Number(totalSupply); i++) {
        const uri = await realEstate.tokenURI(i);
        const metadata = await loadMetadataForToken(uri, i);
        homes.push({ ...metadata, id: i });
      }

      setHomes(homes);

      const escrowContract = new ethers.Contract(
        networkConfig.escrow.address,
        EscrowABI.abi,
        readProvider
      );
      setEscrow(escrowContract);
      setProvider(readProvider);
    } catch (err) {
      console.error("Blockchain load failed:", err);
      setError("Unable to load blockchain data. Make sure Hardhat localhost is running and refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlockchainData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("MetaMask not detected. Please install MetaMask and refresh the page.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts?.length) {
        return;
      }

      const userAccount = ethers.getAddress(accounts[0]);
      setAccount(userAccount);
      setProvider(new ethers.BrowserProvider(window.ethereum));
      setError("");
    } catch (err) {
      if (err.code === 4001) {
        return;
      }
      console.error("Wallet connect failed:", err);
      setError("Failed to connect MetaMask. Please try again.");
    }
  };

  const togglePop = (home) => {
    setHome(home);
    setToggle((prev) => !prev);
  };

  return (
    <>
      <Navigation account={account} connectWallet={connectWallet} />
      <Search />

      <main>
        <div className="cards__section">
          <div className="cards__header">
            <h1>Available Properties</h1>
            {homes.length > 0 && (
              <span className="cards__count">{homes.length} listed</span>
            )}
          </div>

              {error ? (
            <div className="loading-state error-state">
              <div style={{ fontSize: "2.2rem" }}>⚠️</div>
              <p>{error}</p>
              <small>Refresh after fixing MetaMask or local blockchain settings.</small>
            </div>
          ) : loading ? (
            <div className="loading-state">
              <div style={{ fontSize: "2.2rem" }}>⏳</div>
              <p>Loading from blockchain...</p>
              <small>Make sure MetaMask is on Hardhat Localhost (Chain ID 1337)</small>
            </div>
          ) : homes.length === 0 ? (
            <div className="loading-state">
              <div style={{ fontSize: "2.2rem" }}>🏚️</div>
              <p>No properties found.</p>
              <small>Run the deploy script and refresh the page.</small>
            </div>
          ) : (
            <div className="cards">
              {homes.map((home, index) => (
                <div className="card" key={index} onClick={() => togglePop(home)}>
                  <div className="card__image">
                    <img src={home.image} alt={home.name} />
                    <div className="card__tag">For Sale</div>
                  </div>
                  <div className="card__info">
                    {/* Property name visible on the card */}
                    <p className="card__name">{home.name}</p>
                    <div className="card__price">
                      {home.attributes?.[0]?.value} ETH
                      <span> · {home.attributes?.[1]?.value}</span>
                    </div>
                    <div className="card__specs">
                      <span><b>{home.attributes?.[2]?.value}</b> Beds</span>
                      <span><b>{home.attributes?.[3]?.value}</b> Baths</span>
                      <span><b>{home.attributes?.[4]?.value}</b> sqft</span>
                    </div>
                    <div className="card__address">📍 {home.address}</div>
                  </div>
                  <div className="card__footer">
                    <span className="card__blockchain-badge">⛓️ On-chain title</span>
                    <span>Token #{home.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {toggle && (
        <Home
          home={home}
          provider={provider}
          account={account}
          escrow={escrow}
          togglePop={togglePop}
        />
      )}
    </>
  );
}

export default App;
