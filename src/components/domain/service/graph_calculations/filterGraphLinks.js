import { getDirectionalLinkEndpoints, getEndpointId, getLinkIdText, getLinkWeight, hasLinkWeight } from "./graphUtils.js";
import { matchesAttribsFilter } from "./attribFilterMatching.js";

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
      if (!hasLinkWeight(link)) return true;

      const absoluteWeight = getLinkWeight(link);
      return (!hasMinThreshold || absoluteWeight >= minThreshold) && (!hasMaxThreshold || absoluteWeight <= maxThreshold);
    }),
  };
  return graphData;
}

export function filterLinkSign(graphData, sign) {
  if (sign !== "positive" && sign !== "negative") return graphData;

  return {
    ...graphData,
    links: graphData.links.filter((link) => !hasLinkWeight(link) || (sign === "positive" ? link.weight > 0 : link.weight < 0)),
  };
}

export function filterTopLinkPercent(graphData, percent) {
  const percentage = Number(percent);
  if (!Number.isFinite(percentage) || percentage >= 100) return graphData;

  const weights = graphData.links.filter(hasLinkWeight).map(getLinkWeight).sort((left, right) => right - left);
  if (weights.length === 0) return graphData;

  const count = Math.ceil((weights.length * Math.max(0, percentage)) / 100);
  const cutoff = weights[count - 1];
  return {
    ...graphData,
    links: graphData.links.filter((link) => !hasLinkWeight(link) || (count > 0 && getLinkWeight(link) >= cutoff)),
  };
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

  return {
    ...graphData,
    links: graphData.links.filter((link) => !hasLinkWeight(link) || link.weight >= 0),
  };
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
