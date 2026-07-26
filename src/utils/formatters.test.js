import { formatAddress, formatEthValue, getPropertyStatusLabel, normalizeAddress } from "./formatters";

describe("formatters", () => {
  it("formats wallet addresses consistently", () => {
    expect(formatAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe("0x1234...5678");
    expect(formatAddress("1234567890abcdef1234567890abcdef12345678")).toBe("0x1234...5678");
  });

  it("formats ETH values safely", () => {
    expect(formatEthValue("1.5")).toBe("1.5 ETH");
    expect(formatEthValue(null)).toBe("N/A");
  });

  it("normalizes addresses and status labels", () => {
    expect(normalizeAddress("0xABC")).toBe("0xabc");
    expect(getPropertyStatusLabel("0xabc")).toBe("Sold");
    expect(getPropertyStatusLabel(null)).toBe("Listed");
  });
});
