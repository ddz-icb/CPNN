import log from "../../../adapters/logging/logger.js";
import { cloneLink, getCommunityData, getComponentData } from "../graph_calculations/graphUtils.js";
import { applyAdditionalLinkRecords } from "./additionalLinkEnrichment.js";
import {
  fetchFunctionalEnrichmentAnnotations,
  fetchFunctionalEnrichmentLabels,
  fetchNetworkInteractions,
} from "./stringDbApi.js";
import { DEFAULT_SPECIES_ID } from "./stringDbConfig.js";
import { buildNodeIdToProteinIdsMap, buildProteinToNodeIdsMap, buildStringDbLinks } from "./stringDbMapping.js";
import {
  clampConfidence,
  clampEvidenceScore,
  clampGroupEnrichmentMaxFdr,
  clampNodeAttributeMaxTerms,
  normalizeStringDbCategory,
  normalizeProteinId,
} from "./stringDbHelpers.js";

const enrichmentCache = new Map();

function applyStringDbLinks(graphData, enrichmentLinks) {
  return applyAdditionalLinkRecords(graphData, enrichmentLinks);
}

function buildCacheKey(kind, proteinIds, ...parts) {
  return `${kind}::${parts.join("::")}::${[...proteinIds].sort((a, b) => a.localeCompare(b)).join("|")}`;
}

function buildGroupCacheKey(groups, ...parts) {
  const groupKey = groups
    .map((group) => `${group.groupId}:${[...(group.proteinIds ?? [])].sort((a, b) => a.localeCompare(b)).join(",")}`)
    .sort((a, b) => a.localeCompare(b))
    .join("|");
  return `string-groups::${parts.join("::")}::${groupKey}`;
}

function applyProteinAnnotations(graphData, annotations, proteinToNodeIds) {
  if (!Array.isArray(annotations) || annotations.length === 0) return graphData;

  const attribsByNodeId = new Map();
  annotations.forEach((annotation) => {
    const proteinId = normalizeProteinId(annotation?.proteinId);
    const attrib = String(annotation?.attrib ?? "").trim();
    if (!proteinId || !attrib) return;

    const nodeIds = proteinToNodeIds.get(proteinId);
    if (!nodeIds?.size) return;

    nodeIds.forEach((nodeId) => {
      if (!attribsByNodeId.has(nodeId)) {
        attribsByNodeId.set(nodeId, new Set());
      }
      attribsByNodeId.get(nodeId).add(attrib);
    });
  });

  return applyNodeAttribs(graphData, attribsByNodeId, "STRING-DB node annotation");
}

function applyGroupLabels(graphData, groupLabels, groups) {
  if (!Array.isArray(groupLabels) || groupLabels.length === 0) return graphData;

  const groupToNodeIds = new Map(groups.map((group) => [String(group.groupId), group.nodeIds ?? []]));
  const attribsByNodeId = new Map();

  groupLabels.forEach((label) => {
    const groupId = String(label?.groupId ?? "");
    const attrib = String(label?.attrib ?? "").trim();
    if (!groupId || !attrib) return;

    const nodeIds = groupToNodeIds.get(groupId);
    if (!nodeIds?.length) return;

    nodeIds.forEach((nodeId) => {
      if (!attribsByNodeId.has(nodeId)) {
        attribsByNodeId.set(nodeId, new Set());
      }
      attribsByNodeId.get(nodeId).add(attrib);
    });
  });

  return applyNodeAttribs(graphData, attribsByNodeId, "STRING-DB community enrichment");
}

function applyNodeAttribs(graphData, attribsByNodeId, label) {
  if (!attribsByNodeId?.size) return graphData;

  let addedAttribCount = 0;
  const updatedNodes = graphData.nodes.map((node) => {
    const addedAttribs = attribsByNodeId.get(node.id);
    if (!addedAttribs?.size) return node;

    const currentAttribs = Array.isArray(node.attribs) ? node.attribs : [];
    const nextAttribs = new Set(currentAttribs);
    addedAttribs.forEach((attrib) => nextAttribs.add(attrib));

    if (nextAttribs.size === currentAttribs.length) return node;
    addedAttribCount += nextAttribs.size - currentAttribs.length;
    return { ...node, attribs: Array.from(nextAttribs) };
  });

  if (addedAttribCount === 0) return graphData;

  log.info(`${label} added ${addedAttribCount} node attribute(s).`);
  return { ...graphData, nodes: updatedNodes };
}

function getGroupAssignments(graphData, resolution) {
  const resolutionValue = typeof resolution === "number" ? resolution : Number(resolution);
  if (Number.isFinite(resolutionValue) && resolutionValue === 0) {
    const [idToGroup, groupToSize] = getComponentData(graphData);
    return { idToGroup, groupToSize };
  }

  const options = Number.isFinite(resolutionValue) ? { resolution: resolutionValue } : {};
  const [idToGroup, groupToSize] = getCommunityData(graphData, options);
  return { idToGroup, groupToSize };
}

function buildProteinGroups(graphData, proteinToNodeIds, resolution) {
  const { idToGroup, groupToSize } = getGroupAssignments(graphData, resolution);
  if (!idToGroup || !groupToSize) return [];

  const nodeIdToProteinIds = buildNodeIdToProteinIdsMap(proteinToNodeIds);
  const groupsById = new Map();

  graphData.nodes.forEach((node) => {
    const groupId = idToGroup[node.id];
    if (groupId === undefined || groupId === null) return;
    const groupKey = String(groupId);

    if (!groupsById.has(groupKey)) {
      groupsById.set(groupKey, {
        groupId: groupKey,
        nodeIds: new Set(),
        proteinIds: new Set(),
        size: groupToSize[groupId] ?? 0,
      });
    }

    const group = groupsById.get(groupKey);
    group.nodeIds.add(node.id);
    nodeIdToProteinIds.get(node.id)?.forEach((proteinId) => group.proteinIds.add(proteinId));
  });

  return Array.from(groupsById.values()).map((group) => ({
    groupId: group.groupId,
    nodeIds: Array.from(group.nodeIds),
    proteinIds: Array.from(group.proteinIds),
    size: group.size,
  }));
}

export async function enrichGraphWithStringDb(graphData, options = {}) {
  if (!graphData?.nodes || !graphData?.links) return graphData;
  const linkEnabled = options.enabled ?? false;
  const nodeAttributeEnabled = options.nodeAttributeEnabled ?? false;
  const groupEnrichmentEnabled = options.groupEnrichmentEnabled ?? false;
  if (!linkEnabled && !nodeAttributeEnabled && !groupEnrichmentEnabled) return graphData;

  const minConfidence = clampConfidence(options.minConfidence);
  const includeEvidence = options.includeEvidence ?? false;
  const minEvidenceScore = clampEvidenceScore(options.minEvidenceScore);
  const nodeAttributeMaxTerms = clampNodeAttributeMaxTerms(options.nodeAttributeMaxTerms);
  const nodeAttributeMaxFdr = clampGroupEnrichmentMaxFdr(options.nodeAttributeMaxFdr);
  const nodeAttributeCategory = normalizeStringDbCategory(options.nodeAttributeCategory);
  const maxGroupEnrichmentFdr = clampGroupEnrichmentMaxFdr(options.maxGroupEnrichmentFdr);
  const speciesId = options.speciesId ?? DEFAULT_SPECIES_ID;
  const proteinToNodeIds = buildProteinToNodeIdsMap(graphData.nodes);
  const proteinIds = Array.from(proteinToNodeIds.keys());
  if (proteinIds.length === 0) return graphData;

  log.debug(`Preparing STRING-DB enrichment for ${proteinIds.length} protein id(s), species ${speciesId}, min confidence ${minConfidence}`);

  let enrichedGraphData = graphData;

  if (nodeAttributeEnabled) {
    const cacheKey = buildCacheKey("string-node-enrichment", proteinIds, speciesId, nodeAttributeCategory, nodeAttributeMaxTerms, nodeAttributeMaxFdr);
    let annotations = enrichmentCache.get(cacheKey);
    if (!annotations) {
      try {
        annotations = await fetchFunctionalEnrichmentAnnotations(proteinIds, {
          speciesId,
          category: nodeAttributeCategory,
          maxTerms: nodeAttributeMaxTerms,
          maxFdr: nodeAttributeMaxFdr,
        });
        enrichmentCache.set(cacheKey, annotations);
        log.info(`STRING-DB node enrichment generated ${annotations.length} node annotation(s).`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        log.warn(`STRING-DB node enrichment failed: ${message}`);
        throw new Error("Failed to load STRING-DB node enrichment.");
      }
    } else {
      log.debug(`Using cached STRING-DB node enrichment (${annotations.length})`);
    }

    enrichedGraphData = applyProteinAnnotations(enrichedGraphData, annotations, proteinToNodeIds);
  }

  if (groupEnrichmentEnabled) {
    const groups = buildProteinGroups(enrichedGraphData, proteinToNodeIds, options.communityResolution);
    const cacheKey = buildGroupCacheKey(groups, speciesId, maxGroupEnrichmentFdr);
    let groupLabels = enrichmentCache.get(cacheKey);
    if (!groupLabels) {
      try {
        groupLabels = await fetchFunctionalEnrichmentLabels(groups, { speciesId, maxFdr: maxGroupEnrichmentFdr });
        enrichmentCache.set(cacheKey, groupLabels);
        log.info(`STRING-DB community enrichment generated ${groupLabels.length} group label(s).`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        log.warn(`STRING-DB community enrichment failed: ${message}`);
        throw new Error("Failed to load STRING-DB community enrichment labels.");
      }
    } else {
      log.debug(`Using cached STRING-DB community enrichment labels (${groupLabels.length})`);
    }

    enrichedGraphData = applyGroupLabels(enrichedGraphData, groupLabels, groups);
  }

  if (!linkEnabled || proteinIds.length < 2) return enrichedGraphData;

  const cacheKey = buildCacheKey("string-links", proteinIds, speciesId, minConfidence, includeEvidence, minEvidenceScore);
  const cachedLinks = enrichmentCache.get(cacheKey);
  if (cachedLinks) {
    log.debug(`Using cached STRING-DB enrichment links (${cachedLinks.length})`);
    return applyStringDbLinks(enrichedGraphData, cachedLinks);
  }

  try {
    const interactions = await fetchNetworkInteractions(proteinIds, minConfidence, speciesId);
    const enrichmentLinks = buildStringDbLinks(interactions, proteinToNodeIds, { minConfidence, includeEvidence, minEvidenceScore });

    if (interactions.length > 0 && enrichmentLinks.length === 0) {
      log.warn("STRING-DB returned interactions but none could be mapped back to the input UniProt IDs.");
    }
    log.info(`STRING-DB enrichment generated ${enrichmentLinks.length} additional link(s).`);

    enrichmentCache.set(
      cacheKey,
      enrichmentLinks.map((link) => cloneLink(link)),
    );

    return applyStringDbLinks(enrichedGraphData, enrichmentLinks);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log.warn(`STRING-DB enrichment failed: ${message}`);
    throw new Error("Failed to load STRING-DB enrichment data.");
  }
}
