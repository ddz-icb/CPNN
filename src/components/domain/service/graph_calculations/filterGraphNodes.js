import { getAdjacentData, getComponentData } from "./graphUtils.js";
import { filterNodesExist } from "./filterGraphLinks.js";

export function filterCompDensity(graphData, compDensity) {
  const [IdToComp, compToCompSize] = getComponentData(graphData);

  const componentEdgeCount = [];
  graphData.links.forEach((link) => {
    const sourceId = link.source.id || link.source;
    const targetId = link.target.id || link.target;
    const compSource = IdToComp[sourceId];
    const compTarget = IdToComp[targetId];
    if (compSource === compTarget) {
      componentEdgeCount[compSource] = (componentEdgeCount[compSource] || 0) + 1;
    }
  });

  const componentAvgDegree = [];
  for (let comp in compToCompSize) {
    const n = compToCompSize[comp];
    const m = componentEdgeCount[comp] || 0;
    componentAvgDegree[comp] = n > 0 ? (2 * m) / n : 0;
  }

  return {
    ...graphData,
    nodes: graphData.nodes.filter((node) => {
      const comp = IdToComp[node.id];
      return componentAvgDegree[comp] >= compDensity;
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

              if (node.groups.length == nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === "<") {
              const nextElement = andTerm[i + 1];

              if (node.groups.length < nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === "<=") {
              const nextElement = andTerm[i + 1];

              if (node.groups.length <= nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === ">=") {
              const nextElement = andTerm[i + 1];

              if (node.groups.length >= nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === ">") {
              const nextElement = andTerm[i + 1];

              if (node.groups.length > nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === "not") {
              const nextElement = andTerm[i + 1];

              if (nextElement instanceof Set) {
                for (const e of nextElement) {
                  if (!node.groups.some((group) => group.toString().toLowerCase().includes(e.toString().toLowerCase()))) {
                    meetsTerm = true;
                  }
                }
              } else if (!node.groups.some((group) => group.toString().toLowerCase().includes(nextElement.toString().toLowerCase()))) {
                meetsTerm = true;
              }
              i++;
            } else {
              if (element instanceof Set) {
                let allTrue = true;
                for (const e of element) {
                  if (!node.groups.some((group) => group.toString().toLowerCase().includes(e.toString().toLowerCase()))) {
                    allTrue = false;
                  }
                }
                if (allTrue) meetsTerm = true;
              } else {
                node.groups.forEach((group) => {
                  if (group.toString().toLowerCase().includes(element.toString().toLowerCase())) {
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
              groups: [],
            };
          }
        }

        // meets all terms
        return {
          ...node,
          groups: node.groups,
        };
      })
      .filter((node) => node.groups.length > 0),
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
