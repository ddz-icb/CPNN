import { getNodeIdAndIsoformEntry, getNodeIdEntries } from "../parsing/nodeIdParsing.js";
import { isLikelyUniprotAccession } from "../parsing/nodeIdBioParsing.js";
import { STRING_DB_LINK_ATTRIB } from "./stringDbConfig.js";
import { getEdgeKey, normalizeProteinId } from "./stringDbHelpers.js";

function extractProteinIds(nodeId) {
  const nodeEntries = getNodeIdEntries(nodeId);
  const proteinIds = new Set();

  nodeEntries.forEach((entry) => {
    const rawProteinId = getNodeIdAndIsoformEntry(entry);
    const proteinId = normalizeProteinId(rawProteinId);
    if (!proteinId || !isLikelyUniprotAccession(proteinId)) return;
    proteinIds.add(proteinId);
  });

  return Array.from(proteinIds);
}

export function buildProteinToNodeIdsMap(nodes) {
  const proteinToNodeIds = new Map();

  nodes.forEach((node) => {
    const proteinIds = extractProteinIds(node?.id);
    proteinIds.forEach((proteinId) => {
      if (!proteinToNodeIds.has(proteinId)) {
        proteinToNodeIds.set(proteinId, new Set());
      }
      proteinToNodeIds.get(proteinId).add(node.id);
    });
  });

  return proteinToNodeIds;
}

function buildProteinIdLookup(proteinIds) {
  const lookup = new Map();
  proteinIds.forEach((proteinId) => {
    const normalized = normalizeProteinId(proteinId);
    if (!normalized) return;
    lookup.set(normalized.toUpperCase(), normalized);
  });
  return lookup;
}

function resolveProteinId(candidate, proteinIdLookup) {
  const normalized = normalizeProteinId(candidate);
  if (!normalized) return null;
  return proteinIdLookup.get(normalized.toUpperCase()) ?? null;
}

function getEndpointProteinId(interaction, endpointSuffix, proteinIdLookup) {
  const candidates = [
    interaction?.[`preferredName_${endpointSuffix}`],
    interaction?.[`preferredName${endpointSuffix}`],
    interaction?.[`queryItem_${endpointSuffix}`],
    interaction?.[`queryItem${endpointSuffix}`],
    interaction?.[`inputIdentifier_${endpointSuffix}`],
    interaction?.[`inputIdentifier${endpointSuffix}`],
  ];

  for (const candidate of candidates) {
    const proteinId = resolveProteinId(candidate, proteinIdLookup);
    if (proteinId) return proteinId;
  }

  return null;
}

export function buildEnrichmentLinks(interactions, proteinToNodeIds, minConfidence) {
  const linksByKey = new Map();
  const proteinIdLookup = buildProteinIdLookup(Array.from(proteinToNodeIds.keys()));

  interactions.forEach((interaction) => {
    const sourceProteinId = getEndpointProteinId(interaction, "A", proteinIdLookup);
    const targetProteinId = getEndpointProteinId(interaction, "B", proteinIdLookup);
    if (!sourceProteinId || !targetProteinId || sourceProteinId === targetProteinId) return;

    const score = Number(interaction?.score);
    if (Number.isFinite(score) && score < minConfidence) return;

    const sourceNodeIds = proteinToNodeIds.get(sourceProteinId);
    const targetNodeIds = proteinToNodeIds.get(targetProteinId);
    if (!sourceNodeIds?.size || !targetNodeIds?.size) return;

    sourceNodeIds.forEach((sourceNodeId) => {
      targetNodeIds.forEach((targetNodeId) => {
        if (!sourceNodeId || !targetNodeId || sourceNodeId === targetNodeId) return;

        const key = getEdgeKey(sourceNodeId, targetNodeId);
        if (linksByKey.has(key)) return;
        linksByKey.set(key, {
          source: sourceNodeId,
          target: targetNodeId,
          weights: [1],
          attribs: [STRING_DB_LINK_ATTRIB],
        });
      });
    });
  });

  return Array.from(linksByKey.values());
}
