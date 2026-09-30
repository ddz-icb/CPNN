import assert from "node:assert/strict";
import { test } from "node:test";
import { getNodeStatistics } from "../../../../../src/components/domain/service/graph_calculations/nodeStatistics.js";

const graph = {
  nodes: [{ id: "a" }, { id: "b", attribs: ["animal", "animal", "predator"] }, { id: "c", attribs: "plant" }, { id: "d" }, { id: "isolated" }],
  links: [
    { source: "a", target: "b", attrib: "eats", directed: true },
    { source: { id: "a" }, target: { data: { id: "b" } }, attrib: "eats", directed: true },
    { source: "b", target: "a", attrib: "eats", directed: true },
    { source: "a", target: "c", attrib: "near" },
    { source: "c", target: "d" },
    { source: "a", target: "a", attrib: "self", directed: true },
    { source: "a", target: "a" },
    { source: "a", target: "missing", directed: true },
  ],
};
test("counts multilinks, directions and loops without duplicating neighbors", () => {
  const s = getNodeStatistics(graph, "a");
  assert.deepEqual([s.links, s.outgoing, s.incoming, s.undirected, s.adjacentNodes], [6, 3, 2, 2, 2]);
  assert.deepEqual(s.linksByType.find((row) => row.type === "eats"), { type: "eats", links: 3, outgoing: 2, incoming: 1, undirected: 0 });
  assert.deepEqual(s.nodesByType, [{ type: "animal", count: 1 }, { type: "plant", count: 1 }, { type: "predator", count: 1 }]);
  assert.equal(s.componentNodes, 4);
  assert.equal(s.componentLinks, 7);
});
test("components ignore direction and respect the current filtered graph", () => {
  assert.equal(getNodeStatistics(graph, "b").componentNodes, 4);
  const filtered = { ...graph, nodes: graph.nodes.filter((node) => node.id !== "c") };
  assert.equal(getNodeStatistics(filtered, "a").componentNodes, 2);
  assert.equal(getNodeStatistics(filtered, "a").componentLinks, 5);
});
test("isolated and missing nodes have useful empty results", () => {
  const s = getNodeStatistics(graph, "isolated");
  assert.equal(s.componentNodes, 1);
  assert.equal(s.componentLinks, 0);
  assert.equal(s.links, 0);
  assert.deepEqual(s.nodesByType, []);
  assert.equal(getNodeStatistics(graph, "missing"), null);
  assert.equal(getNodeStatistics(null, "a"), null);
});
test("neighbors without types are counted as unspecified", () => {
  assert.deepEqual(getNodeStatistics(graph, "d").nodesByType, [{ type: "plant", count: 1 }]);
  assert.deepEqual(getNodeStatistics(graph, "c").nodesByType, [{ type: "Unspecified", count: 2 }]);
});
