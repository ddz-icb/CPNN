import log from "../../../adapters/logging/logger.js";
import { fetchNetworkInteractions } from "./stringDbApi.js";
import { STRING_DB_LINK_ATTRIB } from "./stringDbConfig.js";
import { buildEnrichmentLinks, buildProteinToNodeIdsMap } from "./stringDbMapping.js";
import { buildCacheKey, clampConfidence, cloneLink, getEdgeKey } from "./stringDbHelpers.js";

const enrichmentCache = new Map();

function getEndpointId(endpoint) {
  if (endpoint == null) return "";
  if (typeof endpoint === "object") {
    if (endpoint.id != null) return String(endpoint.id).trim();
    if (endpoint.data?.id != null) return String(endpoint.data.id).trim();
  }
  return String(endpoint).trim();
}

function getLinkPairKey(source, target) {
  if (!source || !target || source === target) return null;
  return getEdgeKey(source, target);
}

function ensureStringDbAttrib(link) {
  const attribs = Array.isArray(link.attribs) ? [...link.attribs] : [];
  const weights = Array.isArray(link.weights) ? [...link.weights] : [];
  const stringDbIndex = attribs.indexOf(STRING_DB_LINK_ATTRIB);

  if (stringDbIndex === -1) {
    attribs.push(STRING_DB_LINK_ATTRIB);
    weights.push(1);
    return { ...link, attribs, weights };
  }

  if (weights[stringDbIndex] == null) {
    weights[stringDbIndex] = 1;
    return { ...link, attribs, weights };
  }

  return { ...link, attribs, weights };
}

function applyStringDbLinks(graphData, enrichmentLinks) {
  if (!Array.isArray(enrichmentLinks) || enrichmentLinks.length === 0) return graphData;

  const mergedLinks = (graphData.links ?? []).map((link) => cloneLink(link));
  const pairKeyToLinkIndex = new Map();

  mergedLinks.forEach((link, index) => {
    const sourceId = getEndpointId(link.source);
    const targetId = getEndpointId(link.target);
    const pairKey = getLinkPairKey(sourceId, targetId);
    if (!pairKey || pairKeyToLinkIndex.has(pairKey)) return;
    pairKeyToLinkIndex.set(pairKey, index);
  });

  enrichmentLinks.forEach((link) => {
    const sourceId = getEndpointId(link.source);
    const targetId = getEndpointId(link.target);
    const pairKey = getLinkPairKey(sourceId, targetId);
    if (!pairKey) return;

    const existingLinkIndex = pairKeyToLinkIndex.get(pairKey);
    if (existingLinkIndex !== undefined) {
      mergedLinks[existingLinkIndex] = ensureStringDbAttrib(mergedLinks[existingLinkIndex]);
      return;
    }

    const newLink = ensureStringDbAttrib({
      source: sourceId,
      target: targetId,
      weights: [1],
      attribs: [STRING_DB_LINK_ATTRIB],
    });
    mergedLinks.push(newLink);
    pairKeyToLinkIndex.set(pairKey, mergedLinks.length - 1);
  });

  return {
    ...graphData,
    links: mergedLinks,
  };
}

export async function enrichGraphWithStringDb(graphData, options = {}) {
  if (!graphData?.nodes || !graphData?.links) return graphData;
  if (!options.enabled) return graphData;

  const minConfidence = clampConfidence(options.minConfidence);
  const proteinToNodeIds = buildProteinToNodeIdsMap(graphData.nodes);
  const proteinIds = Array.from(proteinToNodeIds.keys());
  if (proteinIds.length < 2) return graphData;

  log.debug(`Preparing STRING-DB enrichment for ${proteinIds.length} protein id(s) with min confidence ${minConfidence}`);

  const cacheKey = buildCacheKey(proteinIds, minConfidence);
  const cachedLinks = enrichmentCache.get(cacheKey);
  if (cachedLinks) {
    log.debug(`Using cached STRING-DB enrichment links (${cachedLinks.length})`);
    return applyStringDbLinks(graphData, cachedLinks);
  }

  try {
    const interactions = await fetchNetworkInteractions(proteinIds, minConfidence);
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
