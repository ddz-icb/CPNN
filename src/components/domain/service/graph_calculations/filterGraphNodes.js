import { getAdjacentData, getCommunityData, getComponentData } from "./graphUtils.js";
import { filterNodesExist } from "./filterGraphLinks.js";

function getGroupAvgDegree(graphData, idToGroup, groupToSize) {
  const groupEdgeCount = {};
  graphData.links.forEach((link) => {
    const sourceId = link.source.id || link.source;
    const targetId = link.target.id || link.target;
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

export function filterMinCompSize(graphData, minCompSize) {
  if (minCompSize === 1) return graphData;

  const [IdToComp, compToCompSize] = getComponentData(graphData);

  return {
    ...graphData,
    nodes: graphData.nodes.filter((node) => compToCompSize[IdToComp[node.id]] >= minCompSize),
  };
}

export function filterMaxCompSize(graphData, maxCompSize) {
  if (maxCompSize == "") return graphData;

  const [IdToComp, compToCompSize] = getComponentData(graphData);

  return {
    ...graphData,
    nodes: graphData.nodes.filter((node) => compToCompSize[IdToComp[node.id]] <= maxCompSize),
  };
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

  graphData = {
    ...graphData,
    nodes: graphData.nodes
      .map((node) => {
        for (const andTerm of filterRequest) {
          let meetsTerm = false;

          for (let i = 0; i < andTerm.length; i++) {
            const element = andTerm[i];

            if (element === "=") {
              const nextElement = andTerm[i + 1];

              if (node.attribs.length == nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === "<") {
              const nextElement = andTerm[i + 1];

              if (node.attribs.length < nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === "<=") {
              const nextElement = andTerm[i + 1];

              if (node.attribs.length <= nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === ">=") {
              const nextElement = andTerm[i + 1];

              if (node.attribs.length >= nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === ">") {
              const nextElement = andTerm[i + 1];

              if (node.attribs.length > nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === "not") {
              const nextElement = andTerm[i + 1];

              if (nextElement instanceof Set) {
                for (const e of nextElement) {
                  if (!node.attribs.some((attrib) => attrib.toString().toLowerCase().includes(e.toString().toLowerCase()))) {
                    meetsTerm = true;
                  }
                }
              } else if (!node.attribs.some((attrib) => attrib.toString().toLowerCase().includes(nextElement.toString().toLowerCase()))) {
                meetsTerm = true;
              }
              i++;
            } else {
              if (element instanceof Set) {
                let allTrue = true;
                for (const e of element) {
                  if (!node.attribs.some((attrib) => attrib.toString().toLowerCase().includes(e.toString().toLowerCase()))) {
                    allTrue = false;
                  }
                }
                if (allTrue) meetsTerm = true;
              } else {
                node.attribs.forEach((attrib) => {
                  if (attrib.toString().toLowerCase().includes(element.toString().toLowerCase())) {
                    meetsTerm = true;
                  }
                });
              }
            }
          }

          if (meetsTerm === false) {
            // doensn't meet all terms
            return {
              ...node,
              attribs: [],
            };
          }
        }

        // meets all terms
        return {
          ...node,
          attribs: node.attribs,
        };
      })
      .filter((node) => node.attribs.length > 0),
  };

  return graphData;
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

export function filterActiveNodesForPixi(showNodeLabels, graphData, nodeMap) {
  if (!nodeMap || !graphData?.nodes) return;

  Object.values(nodeMap).forEach(({ circle, nodeLabel }) => {
    if (circle) circle.visible = false;
    if (nodeLabel) nodeLabel.visible = false;
  });

  graphData.nodes.forEach((n) => {
    const entry = nodeMap[n.id];
    if (!entry) return;
    const { circle, nodeLabel } = entry;
    if (circle) {
      circle.visible = true;
    }
    if (showNodeLabels && nodeLabel) {
      nodeLabel.visible = true;
    }
  });
}
