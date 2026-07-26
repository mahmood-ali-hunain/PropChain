export const normalizeAddress = (address) => (address ? address.toLowerCase() : "");

export const formatAddress = (address, start = 6, end = 4) => {
  if (!address) return "";

  const normalizedAddress = address.startsWith("0x") ? address : `0x${address}`;

  if (normalizedAddress.length <= start + end + 2) {
    return normalizedAddress;
  }

  return `${normalizedAddress.slice(0, start)}...${normalizedAddress.slice(-end)}`;
};

export const formatEthValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  return `${value} ETH`;
};

export const getPropertyStatusLabel = (owner) => (owner ? "Sold" : "Listed");
