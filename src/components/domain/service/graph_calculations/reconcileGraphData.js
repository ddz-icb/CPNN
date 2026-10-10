import { getEndpointId, hasSameLinkStructure } from "./graphUtils.js";

const simulationNodeFields = new Set(["x", "y", "z", "vx", "vy", "vz", "fx", "fy", "fz", "index"]);
const simulationLinkFields = new Set(["source", "target", "index"]);

function updateDataFields(current, next, preservedFields) {
  if (current === next) return;
  for (const key of Object.keys(current)) {
    if (!preservedFields.has(key) && !Object.hasOwn(next, key)) delete current[key];
  }
  for (const [key, value] of Object.entries(next)) {
    if (!preservedFields.has(key)) current[key] = value;
  }
}

// Call only after confirming that both graphs contain the same node IDs.
export function reconcileGraphDataPreservingSimulation(currentData, nextData) {
  const currentNodesById = new Map(currentData.nodes.map((node) => [node.id, node]));
  const nodes = nextData.nodes.map((nextNode) => {
    const node = currentNodesById.get(nextNode.id);
    updateDataFields(node, nextNode, simulationNodeFields);
    return node;
  });
  const sameNodeOrder = currentData.nodes.every((node, index) => node === nodes[index]);

  let links;
  if (hasSameLinkStructure(currentData, nextData)) {
    currentData.links.forEach((link, index) => updateDataFields(link, nextData.links[index], simulationLinkFields));
    links = currentData.links;
  } else {
    // Force links must resolve endpoints against the retained simulation nodes.
    links = nextData.links.map((link) => ({
      ...link,
      source: getEndpointId(link.source),
      target: getEndpointId(link.target),
    }));
  }

  return { ...nextData, nodes: sameNodeOrder ? currentData.nodes : nodes, links };
}
