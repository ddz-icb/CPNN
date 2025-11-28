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
    // checking link.source.id and link.source for safety as d3 replaces the id in source with a graphics objects
    const sourceIndex = idToIndexMap[link.source.id || link.source];
    const targetIndex = idToIndexMap[link.target.id || link.target];
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

export function getAdjacentData(graphData) {
  const neighborCount = {};

  graphData.links.forEach((link) => {
    neighborCount[link.source.id || link.source] = (neighborCount[link.source.id || link.source] || 0) + 1;
    neighborCount[link.target.id || link.target] = (neighborCount[link.target.id || link.target] || 0) + 1;
  });

  const idToNeighborCount = new Map();
  Object.keys(neighborCount).forEach((key) => {
    idToNeighborCount.set(key, neighborCount[key]);
  });

  return idToNeighborCount;
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

export function getCommunityData(graphData) {
  if (graphData.nodes.length == 0) return [null, null];

  console.log("GRAPHDATA", graphData);
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
  graph.links.sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target));
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
