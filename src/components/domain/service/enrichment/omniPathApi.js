import log from "../../../adapters/logging/logger.js";
import { OMNI_PATH_BASE_URL, SUBSTRATE_CHUNK_SIZE } from "./omniPathConfig.js";
import { chunkArray } from "./stringDbHelpers.js";

async function fetchEnzSubChunk(substrateIds) {
  log.debug(`Fetching OmniPath enzsub for ${substrateIds.length} substrate(s)`);
  const url = `${OMNI_PATH_BASE_URL}/enzsub?substrates=${substrateIds.join(",")}&modification=phosphorylation&genesymbols=1&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`OmniPath request failed (HTTP ${response.status})`);
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchKinaseSubstrateInteractions(substrateIds) {
  const uniqueIds = Array.from(new Set(substrateIds.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  if (uniqueIds.length <= SUBSTRATE_CHUNK_SIZE) {
    return fetchEnzSubChunk(uniqueIds);
  }

  const allInteractions = [];
  for (const chunk of chunkArray(uniqueIds, SUBSTRATE_CHUNK_SIZE)) {
    const interactions = await fetchEnzSubChunk(chunk);
    allInteractions.push(...interactions);
  }
  return allInteractions;
}
