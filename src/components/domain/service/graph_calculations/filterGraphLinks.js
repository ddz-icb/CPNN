import { getDirectionsForIndices, getEndpointId } from "./graphUtils.js";
import { matchesAttribsFilter } from "./attribFilterMatching.js";
import { isAdditionalLinkAttrib } from "../enrichment/additionalLinkEnrichment.js";

function getFiniteThreshold(value) {
  if (value === "" || value === null || value === undefined) return null;

  const threshold = Number(value);
  return Number.isFinite(threshold) ? threshold : null;
}

export function filterThreshold(graphData, minLinkThreshold, maxLinkThreshold) {
  const minThreshold = getFiniteThreshold(minLinkThreshold);
  const maxThreshold = getFiniteThreshold(maxLinkThreshold);
  const hasMinThreshold = minThreshold !== null && minThreshold > 0;
  const hasMaxThreshold = maxThreshold !== null && maxThreshold >= 0;

  if (!hasMinThreshold && !hasMaxThreshold) return graphData;

  graphData = {
    ...graphData,
    links: graphData.links
      .map((link) => {
        const keep = link.weights.map((weight, index) => {
          if (isAdditionalLinkAttrib(link.attribs?.[index])) return true;

          const absoluteWeight = Math.abs(weight);
          return (!hasMinThreshold || absoluteWeight >= minThreshold) && (!hasMaxThreshold || absoluteWeight <= maxThreshold);
        });
        const filteredAttribs = link.attribs.filter((_, i) => keep[i]);
        const filteredWeights = link.weights.filter((_, i) => keep[i]);
        const keepIndices = keep.flatMap((shouldKeep, index) => (shouldKeep ? [index] : []));

        return {
          ...link,
          attribs: filteredAttribs,
          weights: filteredWeights,
          ...(Array.isArray(link.directions) ? { directions: getDirectionsForIndices(link, keepIndices) } : {}),
        };
      })
      .filter((link) => link.attribs.length > 0),
  };
  return graphData;
}

export function filterLinkAttribs(graphData, filterRequest) {
  // linkAttribs is true if the filterRequest was empty
  if (filterRequest === true) return graphData;

  return {
    ...graphData,
    links: graphData.links
      .map((link) => (matchesAttribsFilter(link.attribs, filterRequest) ? { ...link } : { ...link, attribs: [] }))
      .filter((link) => link.attribs.length > 0),
  };
}

export function filterNodesExist(graphData) {
  const nodeSet = new Set(graphData.nodes.map((node) => node.id));

  return {
    ...graphData,
    links: graphData.links.filter((link) => nodeSet.has(getEndpointId(link.source)) && nodeSet.has(getEndpointId(link.target))),
  };
}

export function filterIgnoreNegatives(graphData, ignoreNegatives) {
  if (!ignoreNegatives) return graphData;

  graphData.links = graphData.links.map((link) => {
    const keep = link.weights.map((weight) => weight >= 0);
    const filteredAttribs = link.attribs.filter((_, i) => keep[i]);
    const filteredWeights = link.weights.filter((_, i) => keep[i]);
    const keepIndices = keep.flatMap((shouldKeep, index) => (shouldKeep ? [index] : []));

    return {
      ...link,
      attribs: filteredAttribs,
      weights: filteredWeights,
      ...(Array.isArray(link.directions) ? { directions: getDirectionsForIndices(link, keepIndices) } : {}),
    };
  });
  return graphData;
}

export function filterLasso(graphData, selectedNodeIds) {
  if (!Array.isArray(selectedNodeIds) || selectedNodeIds.length === 0) {
    return graphData;
  }
  const selectedNodesSet = new Set(selectedNodeIds);
  graphData.nodes = graphData.nodes.filter((node) => selectedNodesSet.has(node.id));
  graphData.links = graphData.links.filter((link) => selectedNodesSet.has(getEndpointId(link.source)) && selectedNodesSet.has(getEndpointId(link.target)));
  return graphData;
}
