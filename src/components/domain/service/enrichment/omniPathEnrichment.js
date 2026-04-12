import log from "../../../adapters/logging/logger.js";
import { fetchKinaseSubstrateInteractions } from "./omniPathApi.js";
import { OMNI_PATH_KINASE_ATTRIB, OMNI_PATH_PHOSPHO_ATTRIB } from "./omniPathConfig.js";
import { normalizeProteinId } from "./stringDbHelpers.js";
import { buildProteinToNodeIdsMap } from "./stringDbMapping.js";

const enrichmentCache = new Map();

function buildCacheKey(substrateIds) {
  return [...substrateIds].sort((a, b) => a.localeCompare(b)).join("|");
}

function applyKinaseLinks(graphData, interactions, substrateProteinToNodeIds) {
  if (!interactions.length) return graphData;

  // Build protein map for the full graph so existing kinase nodes are found.
  const allProteinToNodeIds = buildProteinToNodeIdsMap(graphData.nodes);

  const taggedKinaseNodeIds = new Set(); // existing node IDs identified as kinases
  const linksToAdd = [];
  const seenLinkKeys = new Set();

  interactions.forEach((record) => {
    const kinaseProteinId = normalizeProteinId(record.enzyme);
    const substrateProteinId = normalizeProteinId(record.substrate);
    if (!kinaseProteinId || !substrateProteinId || kinaseProteinId === substrateProteinId) return;

    const substrateNodeIds = substrateProteinToNodeIds.get(substrateProteinId);
    if (!substrateNodeIds?.size) return;

    const kinaseNodeIds = allProteinToNodeIds.get(kinaseProteinId);
    if (!kinaseNodeIds?.size) return;

    kinaseNodeIds.forEach((kinaseNodeId) => {
      taggedKinaseNodeIds.add(kinaseNodeId);
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

  log.info(`OmniPath enrichment tagged ${taggedKinaseNodeIds.size} existing kinase node(s) and ${linksToAdd.length} phosphorylation link(s).`);

  const updatedNodes = graphData.nodes.map((node) => {
    if (!taggedKinaseNodeIds.has(node.id)) return node;
    if (node.attribs?.includes(OMNI_PATH_KINASE_ATTRIB)) return node;
    return { ...node, attribs: [...(node.attribs ?? []), OMNI_PATH_KINASE_ATTRIB] };
  });

  return {
    ...graphData,
    nodes: updatedNodes,
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
