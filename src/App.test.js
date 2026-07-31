import { fireEvent, render, screen } from "@testing-library/react";
import Navigation from "./components/Navigation";

describe("Navigation wallet connection", () => {
  it("calls the provided connect handler when the wallet button is clicked", async () => {
    const connectWallet = jest.fn().mockResolvedValue(["0xabc123"]);
    window.alert = jest.fn();
    Object.defineProperty(window, "ethereum", {
      value: { request: jest.fn(), on: jest.fn() },
      configurable: true,
    });

    render(<Navigation account={null} connectWallet={connectWallet} />);

    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));

    expect(connectWallet).toHaveBeenCalledTimes(1);
  });
});
