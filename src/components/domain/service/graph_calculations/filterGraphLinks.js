import { getDirectionalLinkEndpoints, getEndpointId, getLinkIdText } from "./graphUtils.js";
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
    links: graphData.links.filter((link) => {
      if (isAdditionalLinkAttrib(link.attrib)) return true;

      const absoluteWeight = Math.abs(link.weight);
      return (!hasMinThreshold || absoluteWeight >= minThreshold) && (!hasMaxThreshold || absoluteWeight <= maxThreshold);
    }),
  };
  return graphData;
}

export function filterLinkAttribs(graphData, filterRequest) {
  // linkAttribs is true if the filterRequest was empty
  if (filterRequest === true) return graphData;

  return {
    ...graphData,
    links: graphData.links.filter((link, index) => {
      const directionalEndpoints = getDirectionalLinkEndpoints(link);
      return matchesAttribsFilter([link.attrib], filterRequest, {
        name: [getLinkIdText(link, index), link.name, link.label].filter(
          (value) => value !== undefined && value !== null && value !== "",
        ),
        source: directionalEndpoints.sources,
        target: directionalEndpoints.targets,
      });
    }),
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

  graphData.links = graphData.links.filter((link) => link.weight >= 0);
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
