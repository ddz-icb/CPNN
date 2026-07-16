import { getAdjacentData, getCommunityData, getComponentData, getEndpointId, getUniqueNeighborCountData } from "./graphUtils.js";
import { matchesAttribsFilter } from "./attribFilterMatching.js";
import { filterNodesExist } from "./filterGraphLinks.js";

function getGroupAvgDegree(graphData, idToGroup, groupToSize) {
  const groupEdgeCount = {};
  graphData.links.forEach((link) => {
    const sourceId = getEndpointId(link.source);
    const targetId = getEndpointId(link.target);
    const sourceGroup = idToGroup[sourceId];
    const targetGroup = idToGroup[targetId];
    if (sourceGroup === undefined || sourceGroup === null) return;
    if (sourceGroup === targetGroup) {
      groupEdgeCount[sourceGroup] = (groupEdgeCount[sourceGroup] || 0) + 1;
    }
  });

  const groupAvgDegree = {};
  for (const groupId in groupToSize) {
    const n = groupToSize[groupId];
    const m = groupEdgeCount[groupId] || 0;
    groupAvgDegree[groupId] = n > 0 ? (2 * m) / n : 0;
  }

  return groupAvgDegree;
}

function getComponentDensityData(graphData) {
  const [IdToComp, compToCompSize] = getComponentData(graphData);
  const componentAvgDegree = getGroupAvgDegree(graphData, IdToComp, compToCompSize);

  return { IdToComp, componentAvgDegree };
}

function getCommunitySizeData(graphData, communityResolution) {
  const resolutionValue = typeof communityResolution === "number" ? communityResolution : Number(communityResolution);
  if (Number.isFinite(resolutionValue) && resolutionValue === 0) {
    const [idToComponent, componentToSize] = getComponentData(graphData);
    return { idToCommunity: idToComponent, communityToSize: componentToSize };
  }

  const options = Number.isFinite(resolutionValue) ? { resolution: resolutionValue } : {};
  const [idToCommunity, communityToSize] = getCommunityData(graphData, options);
  return { idToCommunity, communityToSize };
}

export function filterComponentDensity(graphData, componentDensity) {
  if (componentDensity <= 0) return graphData;
  const { IdToComp, componentAvgDegree } = getComponentDensityData(graphData);
  return {
    ...graphData,
    nodes: graphData.nodes.filter((node) => {
      const comp = IdToComp[node.id];
      return componentAvgDegree[comp] >= componentDensity;
    }),
  };
}

export function filterCommunityDensity(graphData, communityDensity, communityResolution) {
  if (communityDensity <= 0) return graphData;

  const resolutionValue = typeof communityResolution === "number" ? communityResolution : Number(communityResolution);
  if (Number.isFinite(resolutionValue) && resolutionValue === 0) {
    return filterComponentDensity(graphData, communityDensity);
  }

  const options = Number.isFinite(resolutionValue) ? { resolution: resolutionValue } : {};
  const [idToCommunity, communityToSize] = getCommunityData(graphData, options);
  if (!idToCommunity || !communityToSize) return graphData;

  const communityAvgDegree = getGroupAvgDegree(graphData, idToCommunity, communityToSize);
  return {
    ...graphData,
    nodes: graphData.nodes.filter((node) => {
      const communityId = idToCommunity[node.id];
      return communityAvgDegree[communityId] >= communityDensity;
    }),
  };
}

export function filterCommunitySizeRange(graphData, minCommunitySize, maxCommunitySize, communityResolution) {
  const minValue = typeof minCommunitySize === "number" ? minCommunitySize : Number(minCommunitySize);
  const hasMin = Number.isFinite(minValue) && minValue > 0;

  const hasMaxInput = maxCommunitySize !== "" && maxCommunitySize !== null && maxCommunitySize !== undefined;
  const maxValue = typeof maxCommunitySize === "number" ? maxCommunitySize : Number(maxCommunitySize);
  const hasMax = hasMaxInput && Number.isFinite(maxValue) && maxValue > 0;

  if (!hasMin && !hasMax) return graphData;

  const { idToCommunity, communityToSize } = getCommunitySizeData(graphData, communityResolution);
  if (!idToCommunity || !communityToSize) return graphData;

  return {
    ...graphData,
    nodes: graphData.nodes.filter((node) => {
      const communityId = idToCommunity[node.id];
      const size = communityToSize?.[communityId];
      if (!Number.isFinite(size)) return true;
      if (hasMin && size < minValue) return false;
      if (hasMax && size > maxValue) return false;
      return true;
    }),
  };
}

export function filterMinNeighborhood(graphData, minKCoreSize) {
  if (minKCoreSize <= 0) return graphData;

  let prevNodeCount = -1;
  let filteredGraph = graphData;

  while (filteredGraph.nodes.length !== prevNodeCount) {
    prevNodeCount = filteredGraph.nodes.length;

    const idToNeighborCount = getAdjacentData(filteredGraph);

    filteredGraph = {
      ...filteredGraph,
      nodes: filteredGraph.nodes.filter((node) => idToNeighborCount.get(node.id) >= minKCoreSize),
    };
    filteredGraph = filterNodesExist(filteredGraph);
  }

  return filteredGraph;
}

export function filterComponentSizeRange(graphData, minCompSize, maxCompSize) {
  const applyMin = minCompSize !== 1;
  const applyMax = maxCompSize != "";

  if (!applyMin && !applyMax) return graphData;

  const [IdToComp, compToCompSize] = getComponentData(graphData);

  return {
    ...graphData,
    nodes: graphData.nodes.filter((node) => {
      const size = compToCompSize[IdToComp[node.id]];
      if (applyMin && size < minCompSize) return false;
      if (applyMax && size > maxCompSize) return false;
      return true;
    }),
  };
}

export function filterNodeAttribs(graphData, filterRequest) {
  // filterRequest is true if the filter is empty
  if (filterRequest === true) return graphData;

  const neighborCounts = getUniqueNeighborCountData(graphData);
  return {
    ...graphData,
    nodes: graphData.nodes.filter((node) =>
      matchesAttribsFilter(node.attribs, filterRequest, {
        neighbors: neighborCounts.get(node.id) ?? 0,
        name: [node.id, node.name, node.label].filter((value) => value !== undefined && value !== null && value !== ""),
      }),
    ),
  };
}

export function filterNodeIds(graphData, nodeIdFilters) {
  if (!Array.isArray(nodeIdFilters) || nodeIdFilters.length === 0) return graphData;

  const normalizedFilters = nodeIdFilters
    .map((filter) => {
      if (!filter) return null;
      if (typeof filter === "string") return filter.toLowerCase();
      if (typeof filter === "object" && filter.normalizedValue) return filter.normalizedValue;
      if (typeof filter === "object" && filter.value) return filter.value.toString().toLowerCase();
      return null;
    })
    .filter((value) => typeof value === "string" && value.length > 0);

  if (normalizedFilters.length === 0) return graphData;

  const filteredNodes = graphData.nodes.filter((node) => {
    const nodeId = node?.id?.toString().toLowerCase() || "";
    return !normalizedFilters.some((normalizedValue) => nodeId.includes(normalizedValue));
  });

  return {
    ...graphData,
    nodes: filteredNodes,
  };
}

export function filterCommunityVisibility(graphData, idToCommunity, hiddenCommunityIds) {
  if (!graphData || !idToCommunity) {
    return graphData;
  }

  const hiddenIds = Array.isArray(hiddenCommunityIds) ? hiddenCommunityIds : hiddenCommunityIds != null ? [hiddenCommunityIds] : [];
  if (hiddenIds.length === 0) {
    return graphData;
  }

  const hiddenSet = new Set(hiddenIds.map((id) => id?.toString()).filter(Boolean));
  if (hiddenSet.size === 0) {
    return graphData;
  }

  const filteredGraph = {
    ...graphData,
    nodes: graphData.nodes?.filter((node) => {
      const communityId = idToCommunity[node.id];
      if (communityId === undefined || communityId === null) return true;
      return !hiddenSet.has(communityId.toString());
    }),
  };

  if (!filteredGraph.nodes || !filteredGraph.links) {
    return filteredGraph;
  }

  return filterNodesExist(filteredGraph);
}
