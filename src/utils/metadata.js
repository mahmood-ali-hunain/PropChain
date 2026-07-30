const LOCAL_METADATA_BASE = "/metadata";

const buildLocalMetadataPath = (tokenId) => `${LOCAL_METADATA_BASE}/${tokenId}.json`;

export const getFallbackMetadataPath = (tokenId) => buildLocalMetadataPath(tokenId);

export const loadMetadataForToken = async (uri, tokenId) => {
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Metadata fetch failed with status ${response.status}`);
    }

    const payload = await response.json();
    if (payload && typeof payload === "object") {
      return payload;
    }

    throw new Error("Metadata payload was invalid");
  } catch (error) {
    const fallbackPath = buildLocalMetadataPath(tokenId);
    const localResponse = await fetch(fallbackPath);

    if (!localResponse.ok) {
      throw error;
    }

    const fallbackMetadata = await localResponse.json();
    return {
      ...fallbackMetadata,
      id: tokenId,
      _fallback: true,
      _fallbackReason: error.message,
    };
  }
};
