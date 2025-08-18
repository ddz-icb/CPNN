import UnionFind from "union-find";
import { getIdsSeparateEntries, getPhosphositesProtIdEntry, getProtIdAndNameEntry, getProtIdsWithIsoform } from "../parsing/nodeIdParsing.js";
import { getAdjacentData, getComponentData } from "./graphUtils.js";

export function filterByThreshold(graphData, linkThreshold) {
  if (linkThreshold === 0) return graphData;

  graphData = {
    ...graphData,
    links: graphData.links
      .map((link) => {
        const filteredAttribs = link.attribs.filter((_, i) => link.weights[i] >= linkThreshold);
        const filteredWeights = link.weights.filter((weight) => weight >= linkThreshold);

        return {
          ...link,
          attribs: filteredAttribs,
          weights: filteredWeights,
        };
      })
      .filter((link) => link.attribs.length > 0),
  };
  return graphData;
}

export function filterCompDensity(graphData, compDensity) {
  const [nodeIdToCompMap, compToCompSizeMap] = getComponentData(graphData);

  const componentEdgeCount = [];
  graphData.links.forEach((link) => {
    const sourceId = link.source.id || link.source;
    const targetId = link.target.id || link.target;
    const compSource = nodeIdToCompMap[sourceId];
    const compTarget = nodeIdToCompMap[targetId];
    if (compSource === compTarget) {
      componentEdgeCount[compSource] = (componentEdgeCount[compSource] || 0) + 1;
    }
  });

  const componentAvgDegree = [];
  for (let comp in compToCompSizeMap) {
    const n = compToCompSizeMap[comp];
    const m = componentEdgeCount[comp] || 0;
    componentAvgDegree[comp] = n > 0 ? (2 * m) / n : 0;
  }

  return {
    ...graphData,
    nodes: graphData.nodes.filter((node) => {
      const comp = nodeIdToCompMap[node.id];
      return componentAvgDegree[comp] >= compDensity;
    }),
  };
}

export function filterMinNeighborhood(graphData, minNeighborhoodSize) {
  if (minNeighborhoodSize <= 0) return graphData;

  const adjacentMap = getAdjacentData(graphData);

  return {
    ...graphData,
    nodes: graphData.nodes.filter((node) => adjacentMap.get(node.id) >= minNeighborhoodSize),
  };
}

export function filterNodesExist(graphData) {
  const nodeSet = new Set(graphData.nodes.map((node) => node.id));

  return {
    ...graphData,
    links: graphData.links.filter((link) => nodeSet.has(link.source.id || link.source) && nodeSet.has(link.target.id || link.target)),
  };
}

export function filterMinCompSize(graphData, minCompSize) {
  if (minCompSize === 1) return graphData;

  const [nodeIdToCompMap, compToCompSizeMap] = getComponentData(graphData);

  return {
    ...graphData,
    nodes: graphData.nodes.filter((node) => compToCompSizeMap[nodeIdToCompMap[node.id]] >= minCompSize),
  };
}

export function filterMaxCompSize(graphData, maxCompSize) {
  if (maxCompSize == "") return graphData;

  const [nodeIdToCompMap, compToCompSizeMap] = getComponentData(graphData);

  return {
    ...graphData,
    nodes: graphData.nodes.filter((node) => compToCompSizeMap[nodeIdToCompMap[node.id]] <= maxCompSize),
  };
}

export function filterByLinkAttribs(graphData, filterRequest) {
  // linkAttribs is true if the filterRequest was empty
  if (filterRequest === true) return graphData;

  graphData = {
    ...graphData,
    links: graphData.links
      .map((link) => {
        for (const andTerm of filterRequest) {
          let meetsTerm = false;

          for (let i = 0; i < andTerm.length; i++) {
            const element = andTerm[i];

            if (element === "=") {
              const nextElement = andTerm[i + 1];

              if (link.attribs.length == nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === "<") {
              const nextElement = andTerm[i + 1];

              if (link.attribs.length < nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === "<=") {
              const nextElement = andTerm[i + 1];

              if (link.attribs.length <= nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === ">=") {
              const nextElement = andTerm[i + 1];

              if (link.attribs.length >= nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === ">") {
              const nextElement = andTerm[i + 1];

              if (link.attribs.length > nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === "not") {
              const nextElement = andTerm[i + 1];

              if (nextElement instanceof Set) {
                for (const e of nextElement) {
                  if (!link.attribs.some((attrib) => attrib.toString().toLowerCase().includes(e.toString().toLowerCase()))) {
                    meetsTerm = true;
                  }
                }
              } else if (!link.attribs.some((attrib) => attrib.toString().toLowerCase().includes(nextElement.toString().toLowerCase()))) {
                meetsTerm = true;
              }
              i++;
            } else {
              if (element instanceof Set) {
                let allTrue = true;
                for (const e of element) {
                  if (!link.attribs.some((attrib) => attrib.toString().toLowerCase().includes(e.toString().toLowerCase()))) {
                    allTrue = false;
                  }
                }
                if (allTrue) meetsTerm = true;
              } else {
                link.attribs.forEach((attrib, i) => {
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
              ...link,
              attribs: [],
            };
          }
        }

        return {
          ...link,
        };
      })
      .filter((link) => link.attribs.length > 0),
  };

  return graphData;
}

export function filterByNodeAttribs(graphData, filterRequest) {
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

export function filterActiveNodesForPixi(circles, nodeLabels, showNodeLabels, graphData, nodeMap) {
  circles.children.forEach((circle) => (circle.visible = false));
  nodeLabels.children.forEach((label) => (label.visible = false));

  graphData.nodes.forEach((n) => {
    const { node, circle, nodeLabel } = nodeMap[n.id];
    circle.visible = true;
    if (showNodeLabels) {
      nodeLabel.visible = true;
    }
  });
}

export function filterMergeProteins(graphData, mergeProteins) {
  if (!mergeProteins) return graphData;

  const protIdToNodeMap = new Map();
  graphData.nodes.forEach((node) => {
    const protIds = getProtIdsWithIsoform(node.id);
    protIds.forEach((protId) => {
      if (!protIdToNodeMap.has(protId)) {
        protIdToNodeMap.set(protId, []);
      }
      protIdToNodeMap.get(protId).push(node.id);
    });
  });

  const nodeIndexMap = new Map(graphData.nodes.map((node, index) => [node.id, index]));
  const unionFind = new UnionFind(graphData.nodes.length);

  protIdToNodeMap.forEach((nodeIds) => {
    for (let i = 1; i < nodeIds.length; i++) {
      const index1 = nodeIndexMap.get(nodeIds[0]);
      const index2 = nodeIndexMap.get(nodeIds[i]);
      if (index1 !== undefined && index2 !== undefined) {
        unionFind.link(index1, index2);
      }
    }
  });
  const nodeIdToNodeObjectMap = new Map(graphData.nodes.map((node) => [node.id, node]));

  const groupsMap = new Map();
  graphData.nodes.forEach((node) => {
    const parentIndex = unionFind.find(nodeIndexMap.get(node.id));
    if (!groupsMap.has(parentIndex)) {
      groupsMap.set(parentIndex, []);
    }
    groupsMap.get(parentIndex).push(node.id);
  });

  const parentIndexToMergedNode = new Map();
  groupsMap.forEach((groupNodeIds, parentIndex) => {
    const protIdToPhosphositesMap = new Map();
    const combinedGroups = new Set();

    groupNodeIds.forEach((nodeId) => {
      const node = nodeIdToNodeObjectMap.get(nodeId);
      if (!node) return;

      node.groups.forEach((g) => combinedGroups.add(g));

      const entries = getIdsSeparateEntries(node.id);
      entries.forEach((entry) => {
        const protIdName = getProtIdAndNameEntry(entry);
        const phosphosites = getPhosphositesProtIdEntry(entry);

        if (!protIdToPhosphositesMap.has(protIdName)) {
          protIdToPhosphositesMap.set(protIdName, new Set());
        }
        phosphosites.forEach((site) => protIdToPhosphositesMap.get(protIdName).add(site));
      });
    });

    const newId = Array.from(protIdToPhosphositesMap.entries())
      .map(([protIdName, phosphoSet]) => {
        const phosphoArray = Array.from(phosphoSet);
        return phosphoArray.length > 0 ? `${protIdName}_${phosphoArray.join(", ")}` : protIdName;
      })
      .join("; ");

    parentIndexToMergedNode.set(parentIndex, {
      id: newId,
      groups: Array.from(combinedGroups),
    });
  });

  graphData.nodes = Array.from(parentIndexToMergedNode.values());

  const mergedLinksMap = new Map();

  graphData.links.forEach((link) => {
    const sourceParentIndex = unionFind.find(nodeIndexMap.get(link.source));
    const targetParentIndex = unionFind.find(nodeIndexMap.get(link.target));

    const sourceMergedNode = parentIndexToMergedNode.get(sourceParentIndex);
    const targetMergedNode = parentIndexToMergedNode.get(targetParentIndex);

    if (!sourceMergedNode || !targetMergedNode || sourceMergedNode.id === targetMergedNode.id) {
      return;
    }

    const sourceMergedId = sourceMergedNode.id;
    const targetMergedId = targetMergedNode.id;

    const key = sourceMergedId < targetMergedId ? `${sourceMergedId}---${targetMergedId}` : `${targetMergedId}---${sourceMergedId}`;

    const existingLink = mergedLinksMap.get(key);

    if (existingLink) {
      link.attribs.forEach((attrib, idx) => {
        const existingAttribIndex = existingLink.attribs.indexOf(attrib);
        if (existingAttribIndex !== -1) {
          const currentWeight = existingLink.weights[existingAttribIndex];
          const newWeight = link.weights[idx];
          existingLink.weights[existingAttribIndex] = Math.max(Math.abs(currentWeight), Math.abs(newWeight));
        } else {
          existingLink.attribs.push(attrib);
          existingLink.weights.push(link.weights[idx]);
        }
      });
    } else {
      // Kante ist neu: Füge sie zur Map hinzu
      mergedLinksMap.set(key, {
        source: sourceMergedId,
        target: targetMergedId,
        weights: [...link.weights],
        attribs: [...link.attribs],
      });
    }
  });

  graphData.links = Array.from(mergedLinksMap.values());

  return graphData;
}
