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

  const loadBlockchainData = async () => {
    if (typeof window.ethereum === "undefined") {
      console.error("MetaMask not detected.");
      setLoading(false);
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    setProvider(provider);

    const network = await provider.getNetwork();
    const chainId = network.chainId.toString();
    const networkConfig = config[chainId] || config[fallbackChainId] || config["1337"];

    if (!networkConfig) {
      alert("Network not configured!\n\nSwitch MetaMask to Hardhat Localhost (Chain ID: 1337), then refresh.");
      setLoading(false);
      return;
    }

    const realEstate = new ethers.Contract(
      networkConfig.realEstate.address,
      RealEstateABI.abi,
      provider
    );

    const totalSupply = await realEstate.totalSupply();
    const homes = [];

    for (let i = 1; i <= Number(totalSupply); i++) {
      const uri = await realEstate.tokenURI(i);
      const metadata = await loadMetadataForToken(uri, i);
      homes.push({ ...metadata, id: i });
    }

    setHomes(homes);
    setLoading(false);

    const escrow = new ethers.Contract(
      networkConfig.escrow.address,
      EscrowABI.abi,
      provider
    );
    setEscrow(escrow);

    window.ethereum.on("accountsChanged", async () => {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(ethers.getAddress(accounts[0]));
    });
  };

  useEffect(() => {
    loadBlockchainData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePop = (home) => {
    setHome(home);
    setToggle((prev) => !prev);
  };

  return (
    <>
      <Navigation account={account} setAccount={setAccount} />
      <Search />

      <main>
        <div className="cards__section">
          <div className="cards__header">
            <h1>Available Properties</h1>
            {homes.length > 0 && (
              <span className="cards__count">{homes.length} listed</span>
            )}
          </div>

          {loading ? (
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
                    <img src={home.card_image || home.image} alt={home.name} />
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
