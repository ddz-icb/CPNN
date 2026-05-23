import log from "../../../adapters/logging/logger.js";
import { getUndirectedLinkKey } from "../graph_calculations/graphUtils.js";
import { getPhosphositesNodeIdEntry, isLikelyUniprotAccession } from "../parsing/nodeIdBioParsing.js";
import { getNodeIdAndIsoformEntry, getNodeIdEntries } from "../parsing/nodeIdParsing.js";
import { applyAdditionalLinks } from "./additionalLinkEnrichment.js";
import { clampMinReferences, fetchKinaseSubstrateInteractions } from "./omniPathApi.js";
import { OMNI_PATH_DEFAULT_ORGANISM_ID, OMNI_PATH_KINASE_ATTRIB, OMNI_PATH_PHOSPHO_ATTRIB } from "./omniPathConfig.js";
import { normalizeProteinId } from "./stringDbHelpers.js";
import { buildProteinToNodeIdsMap } from "./stringDbMapping.js";

const enrichmentCache = new Map();

function buildCacheKey(substrateIds, minReferences, organismId) {
  return `${organismId}::${minReferences}::${[...substrateIds].sort((a, b) => a.localeCompare(b)).join("|")}`;
}

function normalizePhosphosite(site) {
  return String(site ?? "").trim().toUpperCase();
}

function parsePhosphosite(site) {
  const match = normalizePhosphosite(site).match(/^([STY]+)(\d*)$/);
  if (!match) return null;
  return {
    residues: match[1],
    offset: match[2] ?? "",
  };
}

function getOmniPathRecordSite(record) {
  const residue = normalizePhosphosite(record?.residue_type);
  const offset = String(record?.residue_offset ?? "").trim();
  if (!/^[STY]$/.test(residue)) return null;
  return { residue, offset };
}

function phosphositeMatchesRecord(site, recordSite) {
  const parsedSite = parsePhosphosite(site);
  if (!parsedSite || !recordSite) return false;
  if (!parsedSite.residues.includes(recordSite.residue)) return false;
  return !parsedSite.offset || parsedSite.offset === recordSite.offset;
}

function buildProteinToSubstrateEntriesMap(nodes) {
  const proteinToSubstrateEntries = new Map();

  nodes.forEach((node) => {
    getNodeIdEntries(node?.id).forEach((entry) => {
      const rawProteinId = getNodeIdAndIsoformEntry(entry);
      const proteinId = normalizeProteinId(rawProteinId);
      if (!proteinId || !isLikelyUniprotAccession(proteinId)) return;

      if (!proteinToSubstrateEntries.has(proteinId)) {
        proteinToSubstrateEntries.set(proteinId, []);
      }

      proteinToSubstrateEntries.get(proteinId).push({
        nodeId: node.id,
        phosphosites: getPhosphositesNodeIdEntry(entry).map(normalizePhosphosite),
      });
    });
  });

  return proteinToSubstrateEntries;
}

function getMatchingSubstrateNodeIds(substrateEntries, record) {
  if (!substrateEntries?.length) return [];

  const recordSite = getOmniPathRecordSite(record);
  const matchingNodeIds = new Set();

  substrateEntries.forEach(({ nodeId, phosphosites }) => {
    if (!phosphosites.length || phosphosites.some((site) => phosphositeMatchesRecord(site, recordSite))) {
      matchingNodeIds.add(nodeId);
    }
  });

  return Array.from(matchingNodeIds);
}

function applyKinaseLinks(graphData, interactions, substrateProteinToEntries) {
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

    const substrateNodeIds = getMatchingSubstrateNodeIds(substrateProteinToEntries.get(substrateProteinId), record);
    if (!substrateNodeIds.length) return;

    const kinaseNodeIds = allProteinToNodeIds.get(kinaseProteinId);
    if (!kinaseNodeIds?.size) return;

    kinaseNodeIds.forEach((kinaseNodeId) => {
      taggedKinaseNodeIds.add(kinaseNodeId);
      substrateNodeIds.forEach((substrateNodeId) => {
        const key = getUndirectedLinkKey(kinaseNodeId, substrateNodeId);
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

  return applyAdditionalLinks(
    {
      ...graphData,
      nodes: updatedNodes,
    },
    linksToAdd,
    OMNI_PATH_PHOSPHO_ATTRIB,
    1,
  );
}

export async function enrichGraphWithOmniPath(graphData, options = {}) {
  if (!graphData?.nodes || !graphData?.links) return graphData;
  if (!options.enabled) return graphData;

  const minReferences = clampMinReferences(options.minReferences);
  const organismId = options.organismId ?? OMNI_PATH_DEFAULT_ORGANISM_ID;
  const substrateProteinToEntries = buildProteinToSubstrateEntriesMap(graphData.nodes);
  const substrateIds = Array.from(substrateProteinToEntries.keys());
  if (substrateIds.length === 0) return graphData;

  log.debug(
    `Preparing OmniPath kinase enrichment for ${substrateIds.length} graph protein id(s), organism ${organismId}, min references ${minReferences}`,
  );

  const cacheKey = buildCacheKey(substrateIds, minReferences, organismId);
  let interactions = enrichmentCache.get(cacheKey);

  if (!interactions) {
    try {
      interactions = await fetchKinaseSubstrateInteractions(substrateIds, { minReferences, organismId });
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

  return applyKinaseLinks(graphData, interactions, substrateProteinToEntries);
}
