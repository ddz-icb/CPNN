import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { joinGraphDataList, joinGraphs } from "../../../../../src/components/domain/service/graph_calculations/joinGraph.js";
import { createGraph, nodeIds } from "../../../../support/graphFixtures.js";

function graphA() {
  return createGraph({
    nodes: [
      { id: "A", attribs: ["graph-a"] },
      { id: "Shared", attribs: ["shared-a"] },
    ],
    links: [{ source: "A", target: "Shared", weight: 0.2, attrib: "shared-edge" }],
  });
}

function graphB() {
  return createGraph({
    nodes: [
      { id: "A", attribs: ["graph-b"] },
      { id: "Shared", attribs: ["shared-b"] },
      { id: "B-only", attribs: ["only-b"] },
    ],
    links: [
      { source: "Shared", target: "A", weight: -0.9, attrib: "shared-edge" },
      { source: "Shared", target: "B-only", weight: 0.5, attrib: "b-edge" },
    ],
  });
}

function graphC() {
  return createGraph({
    nodes: [
      { id: "Shared", attribs: ["shared-c"] },
      { id: "C", attribs: ["graph-c"] },
    ],
    links: [{ source: "Shared", target: "C", weight: 0.4, attrib: "c-edge" }],
  });
}

describe("joinGraphs", () => {
  test("merges three graphs through the shared join pipeline", () => {
    const mergedThreeGraphs = joinGraphDataList([graphA(), graphB(), graphC()]);

    assert.deepEqual(nodeIds(mergedThreeGraphs), ["A", "Shared", "B-only", "C"]);
    assert.deepEqual(mergedThreeGraphs.nodes, [
      { id: "A", attribs: ["graph-a", "graph-b"] },
      { id: "Shared", attribs: ["shared-a", "shared-b", "shared-c"] },
      { id: "B-only", attribs: ["only-b"] },
      { id: "C", attribs: ["graph-c"] },
    ]);
    assert.deepEqual(mergedThreeGraphs.links, [
      { source: "A", target: "Shared", weight: -0.9, attrib: "shared-edge" },
      { source: "Shared", target: "B-only", weight: 0.5, attrib: "b-edge" },
      { source: "Shared", target: "C", weight: 0.4, attrib: "c-edge" },
    ]);
  });

  test("merges an already joined pair with another graph through the shared join pipeline", () => {
    const joinedPairThenThird = joinGraphs(joinGraphDataList([graphA(), graphB()]), graphC());
    const mergedThreeGraphs = joinGraphDataList([graphA(), graphB(), graphC()]);

    assert.deepEqual(joinedPairThenThird, mergedThreeGraphs);
  });
});
