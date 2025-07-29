import UnionFind from "union-find";
import log from "../../logger.js";
import { max } from "lodash";
import Graph from "graphology";
import louvain from "graphology-communities-louvain";

export function joinGraphs(graph, newGraph) {
  const nodeMap = new Map(graph.nodes.map((node) => [node.id, { ...node }]));

  newGraph.nodes.forEach((node) => {
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

  const combinedNodes = Array.from(nodeMap.values());

  const linkMap = new Map(graph.links.map((link) => [`${link.source}-${link.target}`, { ...link }]));

  newGraph.links.forEach((link) => {
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

  const combinedLinks = Array.from(linkMap.values());

  const reformattedGraph = {
    nodes: combinedNodes,
    links: combinedLinks,
  };

  return reformattedGraph;
}

export function returnComponentData(graph) {
  const idToIndexMap = {};
  graph.nodes.forEach((node, index) => {
    idToIndexMap[node.id] = index;
  });

  const uf = new UnionFind(graph.nodes.length);
  graph.links.forEach((link) => {
    // checking link.source.id and link.source for safety as d3 replaces the id in source with a graphics objects
    const sourceIndex = idToIndexMap[link.source.id || link.source];
    const targetIndex = idToIndexMap[link.target.id || link.target];
    uf.link(sourceIndex, targetIndex);
  });

  const componentArray = [];
  const componentSizeArray = [];
  graph.nodes.forEach((node) => {
    const component = uf.find(idToIndexMap[node.id]);
    componentSizeArray[component] = componentSizeArray[component] ? componentSizeArray[component] + 1 : 1;

    componentArray[node.id] = component;
  });
  return [componentArray, componentSizeArray];
}

export function returnAdjacentData(graph) {
  const adjacentData = {};

  graph.links.forEach((link) => {
    adjacentData[link.source.id || link.source] = (adjacentData[link.source.id || link.source] || 0) + 1;
    adjacentData[link.target.id || link.target] = (adjacentData[link.target.id || link.target] || 0) + 1;
  });

  const adjacentMap = new Map();
  Object.keys(adjacentData).forEach((key) => {
    adjacentMap.set(key, adjacentData[key]);
  });

  return adjacentMap;
}

export function filterByThreshold(graph, linkThreshold) {
  if (linkThreshold === 0) return graph;

  graph = {
    ...graph,
    links: graph.links
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
  return graph;
}

export function filterCompDensity(graph, compDensity) {
  const [componentArray, componentSizeArray] = returnComponentData(graph);

  const componentEdgeCount = [];
  graph.links.forEach((link) => {
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
    ...graph,
    nodes: graph.nodes.filter((node) => {
      const comp = componentArray[node.id];
      return componentAvgDegree[comp] >= compDensity;
    }),
  };
}

export function filterMinNeighborhood(graph, minNeighborhoodSize) {
  if (minNeighborhoodSize <= 0) return graph;

  const adjacentMap = returnAdjacentData(graph);

  return {
    ...graph,
    nodes: graph.nodes.filter((node) => adjacentMap.get(node.id) >= minNeighborhoodSize),
  };
}

export function filterNodesExist(graph) {
  const nodeSet = new Set(graph.nodes.map((node) => node.id));

  return {
    ...graph,
    links: graph.links.filter((link) => nodeSet.has(link.source.id || link.source) && nodeSet.has(link.target.id || link.target)),
  };
}

export function filterMinCompSize(graph, minCompSize) {
  if (minCompSize === 1) return graph;

  const [componentArray, componentSizeArray] = returnComponentData(graph, graph.nodes);

  graph = {
    ...graph,
    nodes: graph.nodes.filter((node) => componentSizeArray[componentArray[node.id]] >= minCompSize),
  };

  return graph;
}

export function filterMaxCompSize(graph, maxCompSize) {
  if (maxCompSize == "") return graph;

  const [componentArray, componentSizeArray] = returnComponentData(graph, graph.nodes);

  graph = {
    ...graph,
    nodes: graph.nodes.filter((node) => componentSizeArray[componentArray[node.id]] <= maxCompSize),
  };

  return graph;
}

export function filterByLinkAttribs(graph, filterRequest) {
  // linkAttribs is true if the filterRequest was empty
  if (filterRequest === true) return graph;

  graph = {
    ...graph,
    links: graph.links
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

  return graph;
}

export function filterByNodeAttribs(graph, filterRequest) {
  // filterRequest is true if the filter is empty
  if (filterRequest === true) return graph;

  graph = {
    ...graph,
    nodes: graph.nodes
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

  return graph;
}

export function filterActiveNodesForPixi(circles, nodeLabels, showNodeLabels, graph, nodeMap) {
  circles.children.forEach((circle) => (circle.visible = false));
  nodeLabels.children.forEach((label) => (label.visible = false));

  graph.nodes.forEach((n) => {
    const { node, circle, nodeLabel } = nodeMap[n.id];
    circle.visible = true;
    if (showNodeLabels) {
      nodeLabel.visible = true;
    }
  });
}

export function applyNodeMapping(graph, mapping) {
  if (mapping === null) {
    return graph;
  }

  const nodeMapping = mapping.nodeMapping;

  graph.nodes.forEach((node) => {
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

  return graph;
}

export function getNodeAttribsToColorIndices(graph) {
  const nodeAttribsToColorIndices = [];
  let i = 0;

  graph.nodes.forEach((node) => {
    node.groups.forEach((group) => {
      if (!nodeAttribsToColorIndices.hasOwnProperty(group)) {
        nodeAttribsToColorIndices[group] = i;
        i += 1;
      }
    });
  });

  return nodeAttribsToColorIndices;
}

export function getLinkAttribsToColorIndices(graph) {
  const linkAttribsToColorIndices = [];
  let i = 0;

  graph.links.forEach((link) => {
    link.attribs.forEach((attrib) => {
      if (!linkAttribsToColorIndices.hasOwnProperty(attrib)) {
        linkAttribsToColorIndices[attrib] = i;
        i += 1;
      }
    });
  });

  return linkAttribsToColorIndices;
}

export function getIdsHavePhosphosites(graph) {
  const nodeId = graph.nodes[0].id;
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

export function getDifferenceGraph(graph1, graph2) {
  const nodeMap = new Map();

  graph1.nodes.forEach((node) => {
    nodeMap.set(node.id, { ...node, groups: new Set(node.groups) });
  });

  graph2.nodes.forEach((node) => {
    if (nodeMap.has(node.id)) {
      const existing = nodeMap.get(node.id);
      node.groups.forEach((g) => existing.groups.add(g));
    } else {
      nodeMap.set(node.id, { ...node, groups: new Set(node.groups) });
    }
  });

  const nodes = Array.from(nodeMap.values()).map((node) => ({
    ...node,
    groups: Array.from(node.groups),
  }));

  const getKey = (link) => {
    const src = link.source.id || link.source;
    const tgt = link.target.id || link.target;
    return [src, tgt].sort().join("-");
  };

  const linkMap = new Map();

  graph1.links.forEach((link) => {
    const key = getKey(link);
    const maxVal = Math.max(...link.weights);
    linkMap.set(key, {
      source: link.source,
      target: link.target,
      weights: [maxVal],
      attribs: ["difference"],
    });
  });

  graph2.links.forEach((link) => {
    const key = getKey(link);
    const maxVal2 = Math.max(...link.weights);
    if (linkMap.has(key)) {
      const link1 = linkMap.get(key);
      const diff = link1.weights[0] - maxVal2;
      linkMap.set(key, {
        source: link1.source,
        target: link1.target,
        weights: [diff],
        attribs: ["difference"],
      });
    } else {
      linkMap.set(key, {
        source: link.source,
        target: link.target,
        weights: [maxVal2],
        attribs: ["difference"],
      });
    }
  });

  const links = Array.from(linkMap.values());
  return { nodes, links };
}

export function getLinkWeightMinMax(graph) {
  let minWeight = Infinity;
  let maxWeight = -Infinity;

  graph.links.forEach((link) => {
    link.weights.forEach((w) => {
      if (w < minWeight) minWeight = w;
      if (w > maxWeight) maxWeight = w;
    });
  });

  return { minWeight: minWeight, maxWeight: maxWeight };
}

export function mergeSameProteins(graph) {
  const protIdToNodeMap = new Map();

  // map protIds onto nodes containg this protId
  graph.nodes.forEach((node) => {
    const protIds = getProtIdsWithIsoform(node.id);
    protIds.forEach((protId) => {
      if (!protIdToNodeMap.has(protId)) {
        protIdToNodeMap.set(protId, []);
      }
      protIdToNodeMap.get(protId).push(node.id);
    });
  });

  const unionFind = new UnionFind(graph.nodes.length);
  const nodeIndexMap = new Map(graph.nodes.map((node, index) => [node.id, index]));

  // merge nodes that share the same protId
  protIdToNodeMap.forEach((nodeIds) => {
    for (let i = 1; i < nodeIds.length; i++) {
      const index1 = nodeIndexMap.get(nodeIds[0]);
      const index2 = nodeIndexMap.get(nodeIds[i]);
      unionFind.link(index1, index2);
    }
  });

  // iterate through all nodes to group them by their union-find parent
  const mergedNodes = new Map();
  const groupsMap = new Map();
  graph.nodes.forEach((node) => {
    const parentIndex = unionFind.find(nodeIndexMap.get(node.id));
    if (!groupsMap.has(parentIndex)) {
      groupsMap.set(parentIndex, []);
    }
    groupsMap.get(parentIndex).push(node.id);
  });

  // Create merged nodes from grouped nodes
  groupsMap.forEach((group, parentIndex) => {
    const protIdToPhosphositesMap = new Map();

    group.forEach((nodeId) => {
      const node = graph.nodes.find((n) => n.id === nodeId);
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

    // create new id of node
    const newId = Array.from(protIdToPhosphositesMap.entries())
      .map(([protIdName, phosphoSet]) => {
        const phosphoArray = Array.from(phosphoSet);
        if (phosphoArray.length > 0) {
          return `${protIdName}_${phosphoArray.join(", ")}`;
        }
        return protIdName;
      })
      .join("; ");

    mergedNodes.set(parentIndex, {
      id: newId,
      groups: new Set(group.flatMap((nodeId) => graph.nodes.find((n) => n.id === nodeId)?.groups || [])),
    });
  });

  graph.nodes = Array.from(mergedNodes.values()).map((node) => ({
    id: node.id,
    groups: Array.from(node.groups),
  }));

  const newLinks = [];
  graph.links.forEach((link) => {
    const sourceParentIndex = unionFind.find(nodeIndexMap.get(link.source));
    const targetParentIndex = unionFind.find(nodeIndexMap.get(link.target));

    const sourceMergedId = mergedNodes.get(sourceParentIndex).id;
    const targetMergedId = mergedNodes.get(targetParentIndex).id;

    // delete links to same merged node
    if (sourceMergedId && targetMergedId && sourceMergedId !== targetMergedId) {
      const existingLink = newLinks.find(
        (l) => (l.source === sourceMergedId && l.target === targetMergedId) || (l.source === targetMergedId && l.target === sourceMergedId)
      );

      if (existingLink) {
        // merge weights and attributes
        link.attribs.forEach((attrib, idx) => {
          const existingAttribIndex = existingLink.attribs.indexOf(attrib);
          if (existingAttribIndex !== -1) {
            existingLink.weights[existingAttribIndex] = Math.max(Math.abs(existingLink.weights[existingAttribIndex], link.weights[idx]));
          } else {
            existingLink.attribs.push(attrib);
            existingLink.weights.push(link.weights[idx]);
          }
        });
      } else {
        newLinks.push({
          source: sourceMergedId,
          target: targetMergedId,
          weights: [...link.weights],
          attribs: [...link.attribs],
        });
      }
    }
  });

  graph.links = newLinks;

  return graph;
}

export function communityDetectionLouvain(graph) {
  const newGraph = new Graph();

  graph.nodes.forEach((node) => {
    newGraph.addNode(node.id);
  });

  graph.links.forEach((link) => {
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
