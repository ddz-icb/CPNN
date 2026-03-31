import log from "../../../adapters/logging/logger.js";
import { fetchKinaseSubstrateInteractions } from "./omniPathApi.js";
import { OMNI_PATH_KINASE_ATTRIB, OMNI_PATH_PHOSPHO_ATTRIB } from "./omniPathConfig.js";
import { normalizeProteinId } from "./stringDbHelpers.js";
import { buildProteinToNodeIdsMap } from "./stringDbMapping.js";

const enrichmentCache = new Map();

function buildCacheKey(substrateIds) {
  return [...substrateIds].sort((a, b) => a.localeCompare(b)).join("|");
}

function buildKinaseNodeId(enzymeUniProtId, enzymeGeneSymbol) {
  return enzymeGeneSymbol ? `${enzymeUniProtId}_${enzymeGeneSymbol}` : enzymeUniProtId;
}

function applyKinaseLinks(graphData, interactions, substrateProteinToNodeIds) {
  if (!interactions.length) return graphData;

  // Build protein map for the full graph so existing kinase nodes are found.
  const allProteinToNodeIds = buildProteinToNodeIdsMap(graphData.nodes);

  const nodesToAdd = new Map(); // kinaseProteinId -> new node object
  const linksToAdd = [];
  const seenLinkKeys = new Set();

  interactions.forEach((record) => {
    const kinaseProteinId = normalizeProteinId(record.enzyme);
    const substrateProteinId = normalizeProteinId(record.substrate);
    if (!kinaseProteinId || !substrateProteinId || kinaseProteinId === substrateProteinId) return;

    const substrateNodeIds = substrateProteinToNodeIds.get(substrateProteinId);
    if (!substrateNodeIds?.size) return;

    // Resolve kinase to existing node(s) or create a new one.
    let kinaseNodeIds = allProteinToNodeIds.get(kinaseProteinId);
    if (!kinaseNodeIds?.size) {
      if (!nodesToAdd.has(kinaseProteinId)) {
        const nodeId = buildKinaseNodeId(kinaseProteinId, record.enzyme_genesymbol);
        nodesToAdd.set(kinaseProteinId, { id: nodeId, attribs: [OMNI_PATH_KINASE_ATTRIB] });
        allProteinToNodeIds.set(kinaseProteinId, new Set([nodeId]));
      }
      kinaseNodeIds = allProteinToNodeIds.get(kinaseProteinId);
    }

    kinaseNodeIds.forEach((kinaseNodeId) => {
      substrateNodeIds.forEach((substrateNodeId) => {
        const key = `${kinaseNodeId}---${substrateNodeId}`;
        if (seenLinkKeys.has(key)) return;
        seenLinkKeys.add(key);
        linksToAdd.push({
          source: kinaseNodeId,
          target: substrateNodeId,
          attribs: [OMNI_PATH_PHOSPHO_ATTRIB],
          weights: [1],
        });
      });
    });
  });

  log.info(`OmniPath enrichment added ${nodesToAdd.size} kinase node(s) and ${linksToAdd.length} phosphorylation link(s).`);

  return {
    ...graphData,
    nodes: nodesToAdd.size > 0 ? [...graphData.nodes, ...Array.from(nodesToAdd.values())] : graphData.nodes,
    links: linksToAdd.length > 0 ? [...graphData.links, ...linksToAdd] : graphData.links,
  };
}

export async function enrichGraphWithOmniPath(graphData, options = {}) {
  if (!graphData?.nodes || !graphData?.links) return graphData;
  if (!options.enabled) return graphData;

  const substrateProteinToNodeIds = buildProteinToNodeIdsMap(graphData.nodes);
  const substrateIds = Array.from(substrateProteinToNodeIds.keys());
  if (substrateIds.length === 0) return graphData;

  log.debug(`Preparing OmniPath kinase enrichment for ${substrateIds.length} substrate(s)`);

  const cacheKey = buildCacheKey(substrateIds);
  let interactions = enrichmentCache.get(cacheKey);

  if (!interactions) {
    try {
      interactions = await fetchKinaseSubstrateInteractions(substrateIds);
      enrichmentCache.set(cacheKey, interactions);
      log.info(`OmniPath returned ${interactions.length} kinase-substrate interaction(s).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      log.warn(`OmniPath enrichment failed: ${message}`);
      throw new Error("Failed to load OmniPath kinase data.");
    }
  } else {
    log.debug(`Using cached OmniPath interactions (${interactions.length})`);
  }

  return applyKinaseLinks(graphData, interactions, substrateProteinToNodeIds);
}
