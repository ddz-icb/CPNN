import { getNodeIdAndIsoformEntry, getNodeIdEntries } from "../parsing/nodeIdParsing.js";
import { isLikelyUniprotAccession } from "../parsing/nodeIdBioParsing.js";
import { STRING_DB_EVIDENCE_ATTRIBS, STRING_DB_LINK_ATTRIB } from "./stringDbConfig.js";
import { getUndirectedLinkKey } from "../graph_calculations/graphUtils.js";
import { normalizeProteinId } from "./stringDbHelpers.js";

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

export function buildNodeIdToProteinIdsMap(proteinToNodeIds) {
  const nodeIdToProteinIds = new Map();

  proteinToNodeIds.forEach((nodeIds, proteinId) => {
    nodeIds.forEach((nodeId) => {
      if (!nodeIdToProteinIds.has(nodeId)) {
        nodeIdToProteinIds.set(nodeId, new Set());
      }
      nodeIdToProteinIds.get(nodeId).add(proteinId);
    });
  });

  return nodeIdToProteinIds;
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
  return buildStringDbLinks(interactions, proteinToNodeIds, { minConfidence });
}

function getEvidenceAttribs(interaction, minEvidenceScore) {
  const evidenceLinks = [];

  Object.entries(STRING_DB_EVIDENCE_ATTRIBS).forEach(([field, attrib]) => {
    const score = Number(interaction?.[field]);
    if (!Number.isFinite(score) || score < minEvidenceScore) return;
    evidenceLinks.push({ attrib, weight: score });
  });

  return evidenceLinks;
}

export function buildStringDbLinks(interactions, proteinToNodeIds, options = {}) {
  const linksByKey = new Map();
  const proteinIdLookup = buildProteinIdLookup(Array.from(proteinToNodeIds.keys()));
  const minConfidence = options.minConfidence ?? 0;
  const includeEvidence = options.includeEvidence ?? false;
  const minEvidenceScore = options.minEvidenceScore ?? 0;

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

        const key = getUndirectedLinkKey(sourceNodeId, targetNodeId);
        if (linksByKey.has(key)) return;
        const links = [{
          source: sourceNodeId,
          target: targetNodeId,
          weight: 1,
          attrib: STRING_DB_LINK_ATTRIB,
        }];
        if (includeEvidence) {
          getEvidenceAttribs(interaction, minEvidenceScore).forEach((evidence) => {
            links.push({
              source: sourceNodeId,
              target: targetNodeId,
              weight: evidence.weight,
              attrib: evidence.attrib,
            });
          });
        }
        linksByKey.set(key, links);
      });
    });
  });

  return Array.from(linksByKey.values()).flat();
}
