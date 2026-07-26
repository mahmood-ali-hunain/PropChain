// src/components/Home.js
import { useEffect, useState } from "react";

import { formatAddress, formatEthValue, getPropertyStatusLabel, normalizeAddress } from "../utils/formatters";

const Home = ({ home, provider, account, escrow, togglePop }) => {
  const [hasBought,    setHasBought]    = useState(false);
  const [hasLended,    setHasLended]    = useState(false);
  const [hasInspected, setHasInspected] = useState(false);
  const [hasSold,      setHasSold]      = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);

  // Role addresses — read from contract on mount
  const [lender,    setLender]    = useState(null);
  const [inspector, setInspector] = useState(null);
  const [seller,    setSeller]    = useState(null);
  const [owner,     setOwner]     = useState(null);

  const fetchDetails = async () => {
    // Buyer
    const _buyer    = await escrow.buyer(home.id);
    const _hasBought = await escrow.approval(home.id, _buyer);
    setHasBought(_hasBought);

    // Seller
    const _seller   = await escrow.seller();
    setSeller(_seller);
    const _hasSold  = await escrow.approval(home.id, _seller);
    setHasSold(_hasSold);

    // Lender
    const _lender   = await escrow.lender();
    setLender(_lender);
    const _hasLended = await escrow.approval(home.id, _lender);
    setHasLended(_hasLended);

    // Inspector
    const _inspector   = await escrow.inspector();
    setInspector(_inspector);
    const _hasInspected = await escrow.inspectionPassed(home.id);
    setHasInspected(_hasInspected);
  };

  const fetchOwner = async () => {
    const isListed = await escrow.isListed(home.id);
    if (isListed) return;
    const _owner = await escrow.buyer(home.id);
    setOwner(_owner);
  };

  useEffect(() => {
    fetchDetails();
    fetchOwner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSold]);

  // ── Transaction handlers ──────────────────────────────
  const buyHandler = async () => {
    try {
      setIsLoading(true);
      const escrowAmount = await escrow.escrowAmount(home.id);
      const signer       = await provider.getSigner();
      let tx = await escrow.connect(signer).depositEarnest(home.id, { value: escrowAmount });
      await tx.wait();
      tx = await escrow.connect(signer).approveSale(home.id);
      await tx.wait();
      setHasBought(true);
    } catch (err) {
      alert(`Transaction failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const inspectHandler = async () => {
    try {
      setIsLoading(true);
      const signer = await provider.getSigner();
      const tx = await escrow.connect(signer).updateInspectionStatus(home.id, true);
      await tx.wait();
      setHasInspected(true);
    } catch (err) {
      alert(`Transaction failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const lendHandler = async () => {
    try {
      setIsLoading(true);
      const signer        = await provider.getSigner();
      let tx              = await escrow.connect(signer).approveSale(home.id);
      await tx.wait();
      const purchasePrice = await escrow.purchasePrice(home.id);
      const escrowAmount  = await escrow.escrowAmount(home.id);
      const lendAmount    = purchasePrice - escrowAmount;
      await signer.sendTransaction({ to: await escrow.getAddress(), value: lendAmount.toString() });
      setHasLended(true);
    } catch (err) {
      alert(`Transaction failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sellHandler = async () => {
    try {
      setIsLoading(true);
      const signer = await provider.getSigner();
      let tx = await escrow.connect(signer).approveSale(home.id);
      await tx.wait();
      tx = await escrow.connect(signer).finalizeSale(home.id);
      await tx.wait();
      setHasSold(true);
    } catch (err) {
      alert(`Transaction failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Role detection ────────────────────────────────────
  const isInspector = normalizeAddress(account) === normalizeAddress(inspector);
  const isLender    = normalizeAddress(account) === normalizeAddress(lender);
  const isSeller    = normalizeAddress(account) === normalizeAddress(seller);

  // Colors match CSS variables exactly
  const getRoleLabel = () => {
    if (isInspector) return { label: "Inspector", color: "#7c3aed" }; // --purple
    if (isLender)    return { label: "Lender",    color: "#d97706" }; // --amber
    if (isSeller)    return { label: "Seller",    color: "#dc2626" }; // --red
    return               { label: "Buyer",     color: "#2563eb" }; // --blue
  };
  const role = getRoleLabel();

  const completedSteps = [hasBought, hasInspected, hasLended, hasSold].filter(Boolean).length;
  const progressPct    = (completedSteps / 4) * 100;

  return (
    <div className="home" onClick={(e) => e.target === e.currentTarget && togglePop()}>
      <div className="home__details">

        {/* Left — Image */}
        <div className="home__image-wrap">
          <img src={home.image} alt={home.name} />
          <div className="home__image-badge">
            {owner ? `✅ ${getPropertyStatusLabel(owner)}` : "🏷️ Listed"}
          </div>
        </div>

        {/* Right — Details */}
        <div className="home__overview">

          {/* Header */}
          <div className="home__header">
            <div>
              <h2>{home.name}</h2>
              <p className="home__address">📍 {home.address}</p>
            </div>
            <div className="home__price-tag">
              {formatEthValue(home.attributes?.[0]?.value)}
            </div>
          </div>

          {/* Specs */}
          <div className="home__specs">
            <div className="spec-item">
              <span className="spec-icon">🛏</span>
              <span>{home.attributes?.[2]?.value} Beds</span>
            </div>
            <div className="spec-item">
              <span className="spec-icon">🚿</span>
              <span>{home.attributes?.[3]?.value} Baths</span>
            </div>
            <div className="spec-item">
              <span className="spec-icon">📐</span>
              <span>{home.attributes?.[4]?.value} sqft</span>
            </div>
            <div className="spec-item">
              <span className="spec-icon">🏠</span>
              <span>{home.attributes?.[1]?.value}</span>
            </div>
          </div>

          <hr className="home__divider" />

          {/* Action / Owned */}
          {owner ? (
            <div className="home__owned-box">
              <span className="owned-icon">🎉</span>
              <div>
                <div className="owned-title">Property Sold</div>
                <div className="owned-address">
                  Owner: {formatAddress(owner)}
                </div>
              </div>
            </div>
          ) : (
            <div className="home__action-section">
              <div className="role-badge" style={{ borderColor: role.color, color: role.color }}>
                <span className="role-dot" style={{ background: role.color }}></span>
                Your Role: {role.label}
              </div>

              {isInspector ? (
                <button className="action-btn" onClick={inspectHandler} disabled={hasInspected || isLoading}>
                  {isLoading ? "⏳ Confirming..." : hasInspected ? "✅ Inspection Approved" : "🔍 Approve Inspection"}
                </button>
              ) : isLender ? (
                <button className="action-btn lender" onClick={lendHandler} disabled={hasLended || isLoading}>
                  {isLoading ? "⏳ Confirming..." : hasLended ? "✅ Loan Funded" : "💰 Approve & Fund Loan"}
                </button>
              ) : isSeller ? (
                <button
                  className="action-btn seller"
                  onClick={sellHandler}
                  disabled={hasSold || isLoading}
                  style={{ opacity: (!hasInspected || !hasLended || !hasBought) ? 0.5 : 1 }}
                >
                  {isLoading ? "⏳ Confirming..." : hasSold ? "✅ Sale Finalized" : "🤝 Approve & Finalize Sale"}
                </button>
              ) : (
                <button className="action-btn" onClick={buyHandler} disabled={hasBought || isLoading}>
                  {isLoading ? "⏳ Confirming..." : hasBought ? "✅ Earnest Deposited" : "🛒 Buy — Deposit Earnest"}
                </button>
              )}

              {isSeller && (!hasInspected || !hasLended || !hasBought) && (
                <p className="seller-hint">
                  ⚠️ Waiting for Buyer, Inspector, and Lender to complete their steps first.
                </p>
              )}
            </div>
          )}

          <hr className="home__divider" />

          {/* Transaction Progress */}
          <div className="home__progress-section">
            <div className="progress-header">
              <span className="progress-title">Transaction Progress</span>
              <span className="progress-count">{completedSteps} / 4 steps complete</span>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${progressPct}%` }}></div>
            </div>
            <div className="progress-steps">
              <div className={`progress-step ${hasBought    ? "done" : "pending"}`}>
                <span className="step-icon">{hasBought    ? "✅" : "⏳"}</span>
                <span>Buyer Deposit</span>
              </div>
              <div className={`progress-step ${hasInspected ? "done" : "pending"}`}>
                <span className="step-icon">{hasInspected ? "✅" : "⏳"}</span>
                <span>Inspection</span>
              </div>
              <div className={`progress-step ${hasLended    ? "done" : "pending"}`}>
                <span className="step-icon">{hasLended    ? "✅" : "⏳"}</span>
                <span>Loan Funded</span>
              </div>
              <div className={`progress-step ${hasSold      ? "done" : "pending"}`}>
                <span className="step-icon">{hasSold      ? "✅" : "⏳"}</span>
                <span>Finalized</span>
              </div>
            </div>
          </div>

          <hr className="home__divider" />

          {/* Description */}
          <div className="home__desc">
            <h3>About this property</h3>
            <p>{home.description}</p>
          </div>

        </div>

        <button onClick={togglePop} className="home__close" aria-label="Close">✕</button>
      </div>
    </div>
  );
};

export default Home;
