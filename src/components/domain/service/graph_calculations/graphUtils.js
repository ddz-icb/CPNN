import UnionFind from "union-find";
import Graph from "graphology";
import louvain from "graphology-communities-louvain";

export function groupBy(nodes, keyFn) {
  const map = new Map();
  for (const node of nodes) {
    const key = keyFn(node);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(node);
  }
  return map;
}

export function getCentroid(nodes) {
  if (!nodes.length) return { x: 0, y: 0, z: 0, size: 0 };
  let x = 0,
    y = 0,
    z = 0;
  for (const n of nodes) {
    x += n.x;
    y += n.y;
    z += n.z ?? 0;
  }
  return { x: x / nodes.length, y: y / nodes.length, z: z / nodes.length, size: nodes.length };
}

export function getComponentData(graphData) {
  const idToIndexMap = {};
  graphData.nodes.forEach((node, index) => {
    idToIndexMap[node.id] = index;
  });

  const uf = new UnionFind(graphData.nodes.length);
  graphData.links.forEach((link) => {
    const sourceIndex = idToIndexMap[getEndpointId(link.source)];
    const targetIndex = idToIndexMap[getEndpointId(link.target)];
    uf.link(sourceIndex, targetIndex);
  });

  const IdToComp = [];
  const compToCompSize = [];
  graphData.nodes.forEach((node) => {
    const component = uf.find(idToIndexMap[node.id]);
    compToCompSize[component] = compToCompSize[component] ? compToCompSize[component] + 1 : 1;

    IdToComp[node.id] = component;
  });
  return [IdToComp, compToCompSize];
}

export function getComponentSizes(graphData) {
  const [, componentSizes] = getComponentData(graphData);
  return componentSizes.filter(Number.isFinite);
}

export function getNodeDegreeData(graphData) {
  const degrees = new Map((graphData.nodes ?? []).map((node) => [node.id, 0]));

  (graphData.links ?? []).forEach((link) => {
    const sourceId = getEndpointId(link.source);
    const targetId = getEndpointId(link.target);
    if (!degrees.has(sourceId) || !degrees.has(targetId)) return;
    degrees.set(sourceId, degrees.get(sourceId) + 1);
    degrees.set(targetId, degrees.get(targetId) + 1);
  });

  return degrees;
}

export function getAdjacentData(graphData) {
  const neighborCount = {};

  graphData.links.forEach((link) => {
    const sourceId = getEndpointId(link.source);
    const targetId = getEndpointId(link.target);
    neighborCount[sourceId] = (neighborCount[sourceId] || 0) + 1;
    neighborCount[targetId] = (neighborCount[targetId] || 0) + 1;
  });

  const idToNeighborCount = new Map();
  Object.keys(neighborCount).forEach((key) => {
    idToNeighborCount.set(key, neighborCount[key]);
  });

  return idToNeighborCount;
}

export function getNodeAttribsToColorIndices(graphData) {
  const attribSet = new Set();

  graphData.nodes.forEach((node) => {
    node.attribs.forEach((attrib) => {
      const key = String(attrib ?? "").trim();
      if (!key) return;
      attribSet.add(key);
    });
  });

  const sortedAttribs = Array.from(attribSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  const nodeAttribsToColorIndices = [];
  sortedAttribs.forEach((attrib, index) => {
    nodeAttribsToColorIndices[attrib] = index;
  });

  return nodeAttribsToColorIndices;
}

export function getLinkAttribsToColorIndices(graphData) {
  const attribSet = new Set();

  graphData.links.forEach((link) => {
    link.attribs.forEach((attrib) => {
      const key = String(attrib ?? "").trim();
      if (!key) return;
      attribSet.add(key);
    });
  });

  const sortedAttribs = Array.from(attribSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  const linkAttribsToColorIndices = [];
  sortedAttribs.forEach((attrib, index) => {
    linkAttribsToColorIndices[attrib] = index;
  });

  return linkAttribsToColorIndices;
}

export function getLinkWeightMinMax(graphData) {
  let minWeight = Infinity;
  let maxWeight = -Infinity;
  let minAbsWeight = Infinity;
  let maxAbsWeight = -Infinity;

  graphData.links.forEach((link) => {
    link.weights.forEach((w) => {
      if (w < minWeight) minWeight = w;
      if (w > maxWeight) maxWeight = w;
      const absWeight = Math.abs(w);
      if (absWeight < minAbsWeight) minAbsWeight = absWeight;
      if (absWeight > maxAbsWeight) maxAbsWeight = absWeight;
    });
  });

  return { minWeight, maxWeight, minAbsWeight, maxAbsWeight };
}

export function getLinkWeightMagnitudeExtent(graphData) {
  const { minAbsWeight, maxAbsWeight } = getLinkWeightMinMax(graphData);
  return { min: minAbsWeight, max: maxAbsWeight };
}

export function getCommunityData(graphData, options = {}) {
  if (graphData.nodes.length == 0) return [null, null];

  const communityOptions = {
    ...options,
    randomWalk: options.randomWalk ?? false,
  };

  const newGraph = new Graph();

  graphData.nodes.forEach((node) => {
    newGraph.addNode(node.id);
  });

  graphData.links.forEach((link) => {
    const sourceId = getEndpointId(link.source);
    const targetId = getEndpointId(link.target);

    if (newGraph.hasNode(sourceId) && newGraph.hasNode(targetId) && !newGraph.hasEdge(sourceId, targetId)) {
      const weight = getLinkWeight(link);
      newGraph.addUndirectedEdge(sourceId, targetId, { weight });
    }
  });

  louvain.assign(newGraph, communityOptions);

  const idToComm = {};
  const commToSize = {};

  newGraph.forEachNode((nodeId, attributes) => {
    const community = attributes.community;
    idToComm[nodeId] = community;

    commToSize[community] = (commToSize[community] || 0) + 1;
  });

  return [idToComm, commToSize];
}

export function sortGraph(graph) {
  graph.nodes.sort((a, b) => a.id.localeCompare(b.id));
  graph.links.sort(
    (a, b) =>
      String(getEndpointId(a.source) ?? "").localeCompare(String(getEndpointId(b.source) ?? "")) ||
      String(getEndpointId(a.target) ?? "").localeCompare(String(getEndpointId(b.target) ?? "")),
  );
}

export function getLinkWeight(link) {
  // if multilink: take max value

  if (Array.isArray(link.weights) && link.weights.length > 0) {
    return link.weights.reduce((maxWeight, current) => {
      const candidate = Math.abs(current);
      return candidate > maxWeight ? candidate : maxWeight;
    }, 0);
  }
  return Math.abs(link.weight);
}

export function formatWeight(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "n/a";
  if (Math.abs(value) >= 1) return value.toFixed(2);
  return value.toPrecision(2);
}

export function cloneLink(link) {
  return {
    ...link,
    weights: Array.isArray(link.weights) ? [...link.weights] : [],
    attribs: Array.isArray(link.attribs) ? [...link.attribs] : [],
  };
}

export function getEndpointId(endpoint) {
  if (endpoint == null) return endpoint;
  if (typeof endpoint === "object") {
    if (endpoint.id != null) return endpoint.id;
    if (endpoint.data?.id != null) return endpoint.data.id;
  }
  return endpoint;
}

export function getEndpointIdText(endpoint) {
  const endpointId = getEndpointId(endpoint);
  return endpointId == null ? "" : String(endpointId).trim();
}

export function getLinkIdText(link, index, sourceId = getEndpointIdText(link?.source), targetId = getEndpointIdText(link?.target)) {
  if (link?.id !== undefined && link?.id !== null && link.id !== "") return link.id.toString();
  return `${sourceId || "unknown"}::${targetId || "unknown"}::${index}`;
}

export function getUndirectedLinkKey(source, target, separator = "---") {
  const sourceId = String(source ?? "").trim();
  const targetId = String(target ?? "").trim();
  if (!sourceId || !targetId || sourceId === targetId) return null;
  return sourceId < targetId ? `${sourceId}${separator}${targetId}` : `${targetId}${separator}${sourceId}`;
}

function sameArrayValues(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function hasGraphStructureChanged(currentGraphData, nextGraphData) {
  if (!currentGraphData || !nextGraphData) return true;

  const currentNodes = currentGraphData.nodes ?? [];
  const nextNodes = nextGraphData.nodes ?? [];
  if (currentNodes.length !== nextNodes.length) return true;
  for (let i = 0; i < currentNodes.length; i++) {
    if (currentNodes[i]?.id !== nextNodes[i]?.id) return true;
  }

  const currentLinks = currentGraphData.links ?? [];
  const nextLinks = nextGraphData.links ?? [];
  if (currentLinks.length !== nextLinks.length) return true;

  for (let i = 0; i < currentLinks.length; i++) {
    const currentLink = currentLinks[i];
    const nextLink = nextLinks[i];

    if (getEndpointId(currentLink?.source) !== getEndpointId(nextLink?.source)) return true;
    if (getEndpointId(currentLink?.target) !== getEndpointId(nextLink?.target)) return true;
    if (!sameArrayValues(currentLink?.attribs ?? [], nextLink?.attribs ?? [])) return true;
    if (!sameArrayValues(currentLink?.weights ?? [], nextLink?.weights ?? [])) return true;
  }

  return false;
}

export function getAdjacentNodes(graphData, nodeId) {
  if (!graphData || !nodeId) return [];
  const { nodes = [], links = [] } = graphData;
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const adjacencyMap = new Map();

  links.forEach((link) => {
    const sourceId = getEndpointId(link.source);
    const targetId = getEndpointId(link.target);
    if (sourceId !== nodeId && targetId !== nodeId) return;

    const neighborId = sourceId === nodeId ? targetId : sourceId;
    if (!neighborId || neighborId === nodeId) return;

    const neighborNode = nodeMap.get(neighborId);
    if (!neighborNode) return;

    const entry = adjacencyMap.get(neighborId) ?? {
      node: neighborNode,
      connections: [],
      maxWeight: 0,
    };

    const attribs = Array.isArray(link.attribs) ? link.attribs : [];
    const weights = Array.isArray(link.weights) ? link.weights : [];
    attribs.forEach((attrib, index) => {
      entry.connections.push({
        type: attrib,
        weight: weights[index],
      });
    });

    entry.maxWeight = Math.max(entry.maxWeight, getLinkWeight(link) ?? 0);
    adjacencyMap.set(neighborId, entry);
  });

  return Array.from(adjacencyMap.values()).sort((a, b) => {
    if (b.maxWeight !== a.maxWeight) {
      return (b.maxWeight ?? 0) - (a.maxWeight ?? 0);
    }
    const labelA = a.node?.id ?? "";
    const labelB = b.node?.id ?? "";
    return labelA.localeCompare(labelB);
  });
}
