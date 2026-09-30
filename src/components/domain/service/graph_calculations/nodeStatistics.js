import { getEndpointId } from "./graphUtils.js";

// Counts describe the supplied (currently filtered) graph, not the original asset.
export function getNodeStatistics(graphData, nodeId) {
  const nodes = new Map((graphData?.nodes ?? []).map((node) => [node.id, node]));
  if (!nodes.has(nodeId)) return null;
  const adjacency = new Map([...nodes.keys()].map((id) => [id, new Set()]));
  const linksByType = new Map();
  const totals = { outgoing: 0, incoming: 0, undirected: 0, links: 0 };
  const validLinks = [];
  for (const link of graphData?.links ?? []) {
    const source = getEndpointId(link.source);
    const target = getEndpointId(link.target);
    if (!nodes.has(source) || !nodes.has(target)) continue;
    validLinks.push([source, target]);
    adjacency.get(source).add(target);
    adjacency.get(target).add(source);
    if (source !== nodeId && target !== nodeId) continue;
    const type = link.attrib == null || link.attrib === "" ? "Unspecified" : String(link.attrib);
    if (!linksByType.has(type)) linksByType.set(type, { type, outgoing: 0, incoming: 0, undirected: 0, links: 0 });
    const row = linksByType.get(type);
    row.links++;
    totals.links++;
    const directions = link.directed
      ? [source === nodeId && "outgoing", target === nodeId && "incoming"].filter(Boolean)
      : ["undirected"];
    for (const direction of directions) {
      row[direction]++;
      totals[direction]++;
    }
  }
  const neighbors = [...adjacency.get(nodeId)].filter((id) => id !== nodeId);
  const nodesByType = new Map();
  for (const id of neighbors) {
    const raw = nodes.get(id).attribs;
    const types = [...new Set((Array.isArray(raw) ? raw : [raw]).filter((v) => v != null && v !== "").map(String))];
    for (const type of types.length ? types : ["Unspecified"]) {
      nodesByType.set(type, (nodesByType.get(type) ?? 0) + 1);
    }
  }
  const component = new Set([nodeId]);
  const queue = [nodeId];
  for (let i = 0; i < queue.length; i++) {
    for (const next of adjacency.get(queue[i])) {
      if (component.has(next)) continue;
      component.add(next);
      queue.push(next);
    }
  }
  return {
    ...totals,
    adjacentNodes: neighbors.length,
    componentNodes: component.size,
    componentLinks: validLinks.filter(([source]) => component.has(source)).length,
    linksByType: [...linksByType.values()].sort((a, b) => b.links - a.links || a.type.localeCompare(b.type)),
    nodesByType: [...nodesByType].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count || a.type.localeCompare(b.type)),
  };
}
