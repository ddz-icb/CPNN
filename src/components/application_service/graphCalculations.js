import UnionFind from "union-find";
import Graph from "graphology";
import louvain from "graphology-communities-louvain";

export function joinGraphs(graphData, newGraphData) {
  const nodeMap = new Map(graphData.nodes.map((node) => [node.id, { ...node }]));

  newGraphData.nodes.forEach((node) => {
    if (nodeMap.has(node.id)) {
      const baseNode = nodeMap.get(node.id);
      nodeMap.set(node.id, {
        ...baseNode,
        groups: [...new Set([...baseNode.groups, ...node.groups])],
      });
    } else {
      nodeMap.set(node.id, { ...node });
    }
  });

  const joinedNodes = Array.from(nodeMap.values());

  const linkMap = new Map(graphData.links.map((link) => [`${link.source}-${link.target}`, { ...link }]));

  newGraphData.links.forEach((link) => {
    const key1 = `${link.source}-${link.target}`;
    const key2 = `${link.target}-${link.source}`;
    const baseLink = linkMap.get(key1) || linkMap.get(key2);

    if (baseLink) {
      const newAttribs = [];
      const newWeights = [];
      for (let i = 0; i < link.attribs.length; i++) {
        if (!baseLink.attribs.includes(link.attribs[i])) {
          newAttribs.push(link.attribs[i]);
          newWeights.push(link.weights[i]);
        }
      }
      baseLink.attribs.push(...newAttribs);
      baseLink.weights.push(...newWeights);

      if (linkMap.has(key1)) {
        linkMap.set(key1, baseLink);
      } else {
        linkMap.set(key2, baseLink);
      }
    } else {
      linkMap.set(key1, { ...link });
    }
  });

  const joinedLinks = Array.from(linkMap.values());

  const joinedGraphData = {
    nodes: joinedNodes,
    links: joinedLinks,
  };

  return joinedGraphData;
}

export function joinGraphName(graphNames) {
  return graphNames.join("-");
}

export function returnComponentData(graphData) {
  const idToIndexMap = {};
  graphData.nodes.forEach((node, index) => {
    idToIndexMap[node.id] = index;
  });

  const uf = new UnionFind(graphData.nodes.length);
  graphData.links.forEach((link) => {
    // checking link.source.id and link.source for safety as d3 replaces the id in source with a graphics objects
    const sourceIndex = idToIndexMap[link.source.id || link.source];
    const targetIndex = idToIndexMap[link.target.id || link.target];
    uf.link(sourceIndex, targetIndex);
  });

  const componentArray = [];
  const componentSizeArray = [];
  graphData.nodes.forEach((node) => {
    const component = uf.find(idToIndexMap[node.id]);
    componentSizeArray[component] = componentSizeArray[component] ? componentSizeArray[component] + 1 : 1;

    componentArray[node.id] = component;
  });
  return [componentArray, componentSizeArray];
}

export function returnAdjacentData(graphData) {
  const adjacentData = {};

  graphData.links.forEach((link) => {
    adjacentData[link.source.id || link.source] = (adjacentData[link.source.id || link.source] || 0) + 1;
    adjacentData[link.target.id || link.target] = (adjacentData[link.target.id || link.target] || 0) + 1;
  });

  const adjacentMap = new Map();
  Object.keys(adjacentData).forEach((key) => {
    adjacentMap.set(key, adjacentData[key]);
  });

  return adjacentMap;
}

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
  const [componentArray, componentSizeArray] = returnComponentData(graphData);

  const componentEdgeCount = [];
  graphData.links.forEach((link) => {
    const sourceId = link.source.id || link.source;
    const targetId = link.target.id || link.target;
    const compSource = componentArray[sourceId];
    const compTarget = componentArray[targetId];
    if (compSource === compTarget) {
      componentEdgeCount[compSource] = (componentEdgeCount[compSource] || 0) + 1;
    }
  });

  const componentAvgDegree = [];
  for (let comp in componentSizeArray) {
    const n = componentSizeArray[comp];
    const m = componentEdgeCount[comp] || 0;
    componentAvgDegree[comp] = n > 0 ? (2 * m) / n : 0;
  }

  return {
    ...graphData,
    nodes: graphData.nodes.filter((node) => {
      const comp = componentArray[node.id];
      return componentAvgDegree[comp] >= compDensity;
    }),
  };
}

export function filterMinNeighborhood(graphData, minNeighborhoodSize) {
  if (minNeighborhoodSize <= 0) return graphData;

  const adjacentMap = returnAdjacentData(graphData);

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

  const [componentArray, componentSizeArray] = returnComponentData(graphData);

  return {
    ...graphData,
    nodes: graphData.nodes.filter((node) => componentSizeArray[componentArray[node.id]] >= minCompSize),
  };
}

export function filterMaxCompSize(graphData, maxCompSize) {
  if (maxCompSize == "") return graphData;

  const [componentArray, componentSizeArray] = returnComponentData(graphData);

  return {
    ...graphData,
    nodes: graphData.nodes.filter((node) => componentSizeArray[componentArray[node.id]] <= maxCompSize),
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

export function applyNodeMapping(graphData, mappingData) {
  if (!mappingData) {
    return graphData;
  }

  const nodeMapping = mappingData.nodeMapping;

  graphData.nodes.forEach((node) => {
    const entries = node.id.split(";");
    const protIdsForLookup = new Set(entries.map((entry) => entry.split("_")[0]));

    protIdsForLookup.forEach((protId) => {
      const isIsoform = protId.includes("-");
      if (isIsoform) {
        const protIdNoIsoform = protId.split("-")[0];
        protIdsForLookup.add(protIdNoIsoform);
      }
    });

    let groupsSet = new Set();
    protIdsForLookup.forEach((protId) => {
      const protIdStr = String(protId).trim();

      if (nodeMapping.hasOwnProperty(protIdStr)) {
        groupsSet = new Set([...groupsSet, ...nodeMapping[protIdStr].pathwayNames]);
      }
    });
    node.groups = Array.from(groupsSet);
  });

  return graphData;
}

export function getNodeAttribsToColorIndices(graphData) {
  const nodeAttribsToColorIndices = [];
  let i = 0;

  graphData.nodes.forEach((node) => {
    node.groups.forEach((group) => {
      if (!nodeAttribsToColorIndices.hasOwnProperty(group)) {
        nodeAttribsToColorIndices[group] = i;
        i += 1;
      }
    });
  });

  return nodeAttribsToColorIndices;
}

export function getLinkAttribsToColorIndices(graphData) {
  const linkAttribsToColorIndices = [];
  let i = 0;

  graphData.links.forEach((link) => {
    link.attribs.forEach((attrib) => {
      if (!linkAttribsToColorIndices.hasOwnProperty(attrib)) {
        linkAttribsToColorIndices[attrib] = i;
        i += 1;
      }
    });
  });

  return linkAttribsToColorIndices;
}

export function getIdsHavePhosphosites(graphData) {
  const nodeId = graphData.nodes[0].id;
  const firstNodeIdElement = nodeId.split(";")[0];
  const phosphosites = firstNodeIdElement.split("_")[2];
  return phosphosites ? true : false;
}

export function getProtIdsWithIsoform(nodeId) {
  return nodeId.split(";").map((id) => id.split("_")[0].trim());
}

export function getProtIdsWithIsoformEntry(entry) {
  return entry.split("_")[0].trim();
}

export function getIdsSeperateEntries(nodeId) {
  return nodeId.split(";").map((entry) => entry.trim());
}

export function getPhosphositesProtIdEntry(entry) {
  return entry
    .split("_")[2]
    .split(", ")
    .map((entry) => entry.trim());
}

export function getProtIdAndNameEntry(entry) {
  const parts = entry.split("_");
  return parts.slice(0, 2).join("_");
}

export function getNodeIdName(nodeId) {
  return nodeId.split("_")[1];
}

export function getNodeLabelOffsetY(nodeId) {
  return -25;
}

export function getLinkWeightMinMax(graphData) {
  let minWeight = Infinity;
  let maxWeight = -Infinity;

  graphData.links.forEach((link) => {
    link.weights.forEach((w) => {
      if (w < minWeight) minWeight = w;
      if (w > maxWeight) maxWeight = w;
    });
  });

  return { minWeight: minWeight, maxWeight: maxWeight };
}

export function mergeSameProteins(graphData) {
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

      const entries = getIdsSeperateEntries(node.id);
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

export function communityDetectionLouvain(graphData) {
  const newGraph = new Graph();

  graphData.nodes.forEach((node) => {
    newGraph.addNode(node.id);
  });

  graphData.links.forEach((link) => {
    const sourceId = link.source.id || link.source;
    const targetId = link.target.id || link.target;

    if (newGraph.hasNode(sourceId) && newGraph.hasNode(targetId) && !newGraph.hasEdge(sourceId, targetId)) {
      const weight = link.weights && link.weights.length > 0 ? Math.max(...link.weights) : 1.0;
      newGraph.addUndirectedEdge(sourceId, targetId, { weight });
    }
  });

  louvain.assign(newGraph);

  const communityMap = new Map();
  newGraph.forEachNode((nodeId, attributes) => {
    communityMap.set(nodeId, attributes.community);
  });

  return communityMap;
}
