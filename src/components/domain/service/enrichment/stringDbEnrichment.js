import log from "../../../adapters/logging/logger.js";
import { cloneLink } from "../graph_calculations/graphUtils.js";
import { applyAdditionalLinks } from "./additionalLinkEnrichment.js";
import { fetchNetworkInteractions } from "./stringDbApi.js";
import { DEFAULT_SPECIES_ID, STRING_DB_LINK_ATTRIB } from "./stringDbConfig.js";
import { buildEnrichmentLinks, buildProteinToNodeIdsMap } from "./stringDbMapping.js";
import { buildCacheKey, clampConfidence } from "./stringDbHelpers.js";

const enrichmentCache = new Map();

function applyStringDbLinks(graphData, enrichmentLinks) {
  return applyAdditionalLinks(graphData, enrichmentLinks, STRING_DB_LINK_ATTRIB, 1);
}

export async function enrichGraphWithStringDb(graphData, options = {}) {
  if (!graphData?.nodes || !graphData?.links) return graphData;
  if (!options.enabled) return graphData;

  const minConfidence = clampConfidence(options.minConfidence);
  const speciesId = options.speciesId ?? DEFAULT_SPECIES_ID;
  const proteinToNodeIds = buildProteinToNodeIdsMap(graphData.nodes);
  const proteinIds = Array.from(proteinToNodeIds.keys());
  if (proteinIds.length < 2) return graphData;

  log.debug(`Preparing STRING-DB enrichment for ${proteinIds.length} protein id(s), species ${speciesId}, min confidence ${minConfidence}`);

  const cacheKey = buildCacheKey(proteinIds, minConfidence, speciesId);
  const cachedLinks = enrichmentCache.get(cacheKey);
  if (cachedLinks) {
    log.debug(`Using cached STRING-DB enrichment links (${cachedLinks.length})`);
    return applyStringDbLinks(graphData, cachedLinks);
  }

  try {
    const interactions = await fetchNetworkInteractions(proteinIds, minConfidence, speciesId);
    const enrichmentLinks = buildEnrichmentLinks(interactions, proteinToNodeIds, minConfidence);

    if (interactions.length > 0 && enrichmentLinks.length === 0) {
      log.warn("STRING-DB returned interactions but none could be mapped back to the input UniProt IDs.");
    }
    log.info(`STRING-DB enrichment generated ${enrichmentLinks.length} additional link(s).`);

    enrichmentCache.set(
      cacheKey,
      enrichmentLinks.map((link) => cloneLink(link)),
    );

    return applyStringDbLinks(graphData, enrichmentLinks);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log.warn(`STRING-DB enrichment failed: ${message}`);
    throw new Error("Failed to load STRING-DB enrichment data.");
  }
}
