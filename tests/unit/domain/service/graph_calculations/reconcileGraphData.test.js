import assert from "node:assert/strict";
import { test } from "node:test";

import { hasGraphStructureChanged, hasSameLinkStructure, hasSameNodeIds } from "../../../../../src/components/domain/service/graph_calculations/graphUtils.js";
import { reconcileGraphDataPreservingSimulation } from "../../../../../src/components/domain/service/graph_calculations/reconcileGraphData.js";

test("same-structure updates retain simulation objects and layout while replacing graph data", () => {
  const source = { id: "A", attribs: ["Old"], label: "Old label", x: 12, y: 34, vx: 2, fx: 12, index: 0 };
  const target = { id: "B", attribs: [], x: 56, y: 78, index: 1 };
  const link = { source, target, attrib: "interaction", weight: 1, oldMetadata: true, index: 0 };
  const currentData = { nodes: [source, target], links: [link], metadata: { version: 1 } };
  const nextData = {
    nodes: [
      { id: "A", attribs: ["New"], label: "New label", x: 999, extra: true },
      { id: "B", attribs: ["Mapped"] },
    ],
    links: [{ source: "A", target: "B", attrib: "interaction", weight: 1, newMetadata: true }],
    metadata: { version: 2 },
  };

  assert.equal(hasGraphStructureChanged(currentData, nextData), false);
  const updated = reconcileGraphDataPreservingSimulation(currentData, nextData);

  assert.equal(updated.nodes, currentData.nodes);
  assert.equal(updated.links, currentData.links);
  assert.equal(updated.nodes[0], source);
  assert.equal(updated.links[0], link);
  assert.deepEqual(source.attribs, ["New"]);
  assert.equal(source.label, "New label");
  assert.equal(source.extra, true);
  assert.deepEqual([source.x, source.y, source.vx, source.fx, source.index], [12, 34, 2, 12, 0]);
  assert.deepEqual(target.attribs, ["Mapped"]);
  assert.equal(link.source, source);
  assert.equal(link.target, target);
  assert.equal(link.index, 0);
  assert.equal(link.newMetadata, true);
  assert.equal(Object.hasOwn(link, "oldMetadata"), false);
  assert.deepEqual(updated.metadata, { version: 2 });
});

test("a changed link set and reordered nodes reuse the live nodes", () => {
  const first = { id: "A", x: 12, vx: 2, attribs: ["Old"] };
  const second = { id: "B", y: 34, vy: 3, attribs: [] };
  const currentData = { nodes: [first, second], links: [{ source: first, target: second, weight: 1 }] };
  const nextData = {
    nodes: [{ id: "B", attribs: ["Mapped"] }, { id: "A", attribs: ["New"] }],
    links: [{ source: { id: "B" }, target: { id: "A" }, weight: 0.5 }],
  };

  assert.equal(hasSameNodeIds(currentData, nextData), true);
  assert.equal(hasSameLinkStructure(currentData, nextData), false);
  const updated = reconcileGraphDataPreservingSimulation(currentData, nextData);

  assert.deepEqual(updated.nodes, [second, first]);
  assert.notEqual(updated.nodes, currentData.nodes);
  assert.deepEqual([first.x, first.vx, second.y, second.vy], [12, 2, 34, 3]);
  assert.deepEqual([first.attribs, second.attribs], [["New"], ["Mapped"]]);
  assert.deepEqual(updated.links, [{ source: "B", target: "A", weight: 0.5 }]);
  assert.notEqual(updated.links, currentData.links);
});

test("node identity check rejects additions, removals and duplicate IDs", () => {
  const current = { nodes: [{ id: "A" }, { id: "B" }] };
  assert.equal(hasSameNodeIds(current, { nodes: [{ id: "B" }, { id: "A" }] }), true);
  assert.equal(hasSameNodeIds(current, { nodes: [{ id: "A" }, { id: "C" }] }), false);
  assert.equal(hasSameNodeIds(current, { nodes: [{ id: "A" }] }), false);
  assert.equal(hasSameNodeIds(current, { nodes: [{ id: "A" }, { id: "A" }] }), false);
});
