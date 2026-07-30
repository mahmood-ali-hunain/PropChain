import { loadMetadataForToken } from "./metadata";

describe("loadMetadataForToken", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("falls back to the local metadata mirror when the remote URI fails", async () => {
    const remoteError = new Error("network down");
    const localMetadata = {
      name: "Fallback Home",
      description: "Loaded from local storage",
      image: "/metadata/images/property-1.svg",
      address: "Local fallback",
      attributes: []
    };

    jest.spyOn(global, "fetch")
      .mockRejectedValueOnce(remoteError)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => localMetadata,
      });

    const metadata = await loadMetadataForToken("https://example.com/ipfs/1.json", 1);

    expect(metadata.name).toBe("Fallback Home");
    expect(metadata.image).toBe("/metadata/images/property-1.svg");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
