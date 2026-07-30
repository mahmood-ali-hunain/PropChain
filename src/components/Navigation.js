// src/components/Navigation.js
import { ethers } from "ethers";

import { formatAddress } from "../utils/formatters";

const Navigation = ({ account, connectWallet }) => {
  const connectHandler = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected! Please install MetaMask.");
      return;
    }

    try {
      await connectWallet();
    } catch (err) {
      console.error("Wallet connect error:", err);
      alert("Failed to connect wallet. Please check MetaMask and try again.");
    }
  };

  return (
    <nav>
      {/* Brand: logo uses 🏠, not ⛓️ — hero already uses the chain emoji */}
      <div className="nav__brand">
        <div className="nav__logo">🏠</div>
        <div className="nav__title">
          {/* span, not h1 — brand name is not a page heading */}
          <span className="nav__name">PropChain</span>
          <span className="nav__subtitle">Decentralized Property Exchange</span>
        </div>
      </div>

      {account ? (
        <div className="nav__account">
          <span className="nav__account-label">Connected</span>
          <button type="button" className="nav__connect connected">
            {formatAddress(account)}
          </button>
        </div>
      ) : (
        <button type="button" className="nav__connect" onClick={connectHandler}>
          Connect Wallet
        </button>
      )}
    </nav>
  );
};

export default Navigation;
