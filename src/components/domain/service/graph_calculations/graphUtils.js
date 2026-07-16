import UnionFind from "union-find";
import Graph from "graphology";
import louvain from "graphology-communities-louvain";

export const LINK_DIRECTIONS = Object.freeze({
  FORWARD: "forward",
  BOTH: "both",
});

export function getLinkDirection(link) {
  return link?.directed ? LINK_DIRECTIONS.FORWARD : LINK_DIRECTIONS.BOTH;
}

export function getDirectionalLinkEndpoints(link) {
  const source = getEndpointIdText(link?.source);
  const target = getEndpointIdText(link?.target);
  if (link?.directed) {
    return {
      sources: source ? [source] : [],
      targets: target ? [target] : [],
    };
  }

  return {
    sources: [source, target].filter(Boolean),
    targets: [source, target].filter(Boolean),
  };
}

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

export function getUniqueNeighborCountData(graphData) {
  const neighborIdsByNodeId = new Map((graphData.nodes ?? []).map((node) => [node.id, new Set()]));

  (graphData.links ?? []).forEach((link) => {
    const sourceId = getEndpointId(link.source);
    const targetId = getEndpointId(link.target);
    if (sourceId === targetId || !neighborIdsByNodeId.has(sourceId) || !neighborIdsByNodeId.has(targetId)) return;
    neighborIdsByNodeId.get(sourceId).add(targetId);
    neighborIdsByNodeId.get(targetId).add(sourceId);
  });

  return new Map(Array.from(neighborIdsByNodeId, ([nodeId, neighborIds]) => [nodeId, neighborIds.size]));
}

function getSortedAttribKeys(items) {
  const attribSet = new Set();

  (items ?? []).forEach((item) => {
    const attribs = Array.isArray(item?.attribs) ? item.attribs : item?.attrib !== undefined && item?.attrib !== null ? [item.attrib] : [];
    attribs.forEach((attrib) => {
      const key = String(attrib ?? "").trim();
      if (!key) return;
      attribSet.add(key);
    });
  });

  return Array.from(attribSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function normalizeColorIndex(value) {
  const colorIndex = Number(value);
  return Number.isInteger(colorIndex) && colorIndex >= 0 ? colorIndex : null;
}

export function getAttribsToColorIndices(items, previousAttribsToColorIndices = null) {
  const sortedAttribs = getSortedAttribKeys(items);
  const nextAttribsToColorIndices = {};
  const usedColorIndices = new Set();

  sortedAttribs.forEach((attrib) => {
    if (!previousAttribsToColorIndices || !Object.hasOwn(previousAttribsToColorIndices, attrib)) return;

    const colorIndex = normalizeColorIndex(previousAttribsToColorIndices[attrib]);
    if (colorIndex === null || usedColorIndices.has(colorIndex)) return;

    nextAttribsToColorIndices[attrib] = colorIndex;
    usedColorIndices.add(colorIndex);
  });

  let nextColorIndex = 0;
  sortedAttribs.forEach((attrib) => {
    if (Object.hasOwn(nextAttribsToColorIndices, attrib)) return;

    while (usedColorIndices.has(nextColorIndex)) {
      nextColorIndex += 1;
    }

    nextAttribsToColorIndices[attrib] = nextColorIndex;
    usedColorIndices.add(nextColorIndex);
  });

  return nextAttribsToColorIndices;
}

export function getNodeAttribsToColorIndices(graphData, previousAttribsToColorIndices = null) {
  return getAttribsToColorIndices(graphData.nodes, previousAttribsToColorIndices);
}

export function getLinkAttribsToColorIndices(graphData, previousAttribsToColorIndices = null) {
  return getAttribsToColorIndices(graphData.links, previousAttribsToColorIndices);
}

export function getLinkWeightMinMax(graphData) {
  let minWeight = Infinity;
  let maxWeight = -Infinity;
  let minAbsWeight = Infinity;
  let maxAbsWeight = -Infinity;

  graphData.links.forEach((link) => {
    const w = link.weight;
    if (w < minWeight) minWeight = w;
    if (w > maxWeight) maxWeight = w;
    const absWeight = Math.abs(w);
    if (absWeight < minAbsWeight) minAbsWeight = absWeight;
    if (absWeight > maxAbsWeight) maxAbsWeight = absWeight;
  });

  return { minWeight, maxWeight, minAbsWeight, maxAbsWeight };
}

export function getLinkWeightMagnitudeExtent(graphData) {
  const { minAbsWeight, maxAbsWeight } = getLinkWeightMinMax(graphData);
  return { min: minAbsWeight, max: maxAbsWeight };
}

export function getCommunityData(graphData, options = {}) {
  if (graphData.nodes.length === 0 || !graphData.links?.length) return [null, null];

  const communityOptions = {
    ...options,
    randomWalk: options.randomWalk ?? false,
  };

  const newGraph = new Graph();

  graphData.nodes.forEach((node) => {
    newGraph.addNode(node.id);
  });

  const edgeWeights = new Map();
  graphData.links.forEach((link) => {
    const sourceId = getEndpointId(link.source);
    const targetId = getEndpointId(link.target);
    const edgeKey = getUndirectedLinkKey(sourceId, targetId);
    if (!edgeKey) return;
    const weight = getLinkWeight(link);
    edgeWeights.set(edgeKey, Math.max(edgeWeights.get(edgeKey) ?? 0, weight));
  });

  edgeWeights.forEach((weight, edgeKey) => {
    const [sourceId, targetId] = edgeKey.split("---");

    if (newGraph.hasNode(sourceId) && newGraph.hasNode(targetId) && !newGraph.hasEdge(sourceId, targetId)) {
      newGraph.addUndirectedEdge(sourceId, targetId, { weight });
    }
  });

  if (newGraph.size === 0) return [null, null];

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
      String(getEndpointId(a.target) ?? "").localeCompare(String(getEndpointId(b.target) ?? "")) ||
      String(a.attrib ?? "").localeCompare(String(b.attrib ?? "")) ||
      Number(Boolean(a.directed)) - Number(Boolean(b.directed)) ||
      (Number(a.weight) || 0) - (Number(b.weight) || 0),
  );
}

export function getLinkWeight(link) {
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
    if (currentLink?.attrib !== nextLink?.attrib) return true;
    if (currentLink?.weight !== nextLink?.weight) return true;
    if (Boolean(currentLink?.directed) !== Boolean(nextLink?.directed)) return true;
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

    entry.connections.push({
      attribs: link.attrib === undefined || link.attrib === null ? [] : [link.attrib],
      weight: link.weight,
      directed: Boolean(link.directed),
      direction: link.directed ? (sourceId === nodeId ? "outgoing" : "incoming") : "undirected",
      sourceId,
      targetId,
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
