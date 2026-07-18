import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { filterLasso } from "../../../../../src/components/domain/service/graph_calculations/filterGraph.js";
import { createGraph, linkIds, nodeIds } from "../../../../support/graphFixtures.js";

describe("filterLasso", () => {
  test("returns the original graph when no lasso selection is active", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }],
      links: [{ id: "a-b", source: "A", target: "B", weight: 1 }],
    });

    assert.strictEqual(filterLasso(graph, []), graph);
    assert.strictEqual(filterLasso(graph, null), graph);
  });

  test("keeps selected nodes and links between selected nodes", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1 },
        { id: "b-c", source: "B", target: "C", weight: 1 },
        { id: "c-d", source: "C", target: "D", weight: 1 },
      ],
    });

    const filteredGraph = filterLasso(graph, ["A", "B", "C"]);

    assert.deepEqual(nodeIds(filteredGraph), ["A", "B", "C"]);
    assert.deepEqual(linkIds(filteredGraph), ["a-b", "b-c"]);
  });

  test("removes links when either endpoint is outside the selection", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1 },
        { id: "b-c", source: "B", target: "C", weight: 1 },
      ],
    });

    const filteredGraph = filterLasso(graph, ["A"]);

    assert.deepEqual(nodeIds(filteredGraph), ["A"]);
    assert.deepEqual(linkIds(filteredGraph), []);
  });

  test("ignores selected ids that are not in the graph", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }],
      links: [{ id: "a-b", source: "A", target: "B", weight: 1 }],
    });

    const filteredGraph = filterLasso(graph, ["A", "missing"]);

    assert.deepEqual(nodeIds(filteredGraph), ["A"]);
    assert.deepEqual(linkIds(filteredGraph), []);
  });

  test("supports links whose endpoints are node objects", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
      links: [
        { id: "a-b", source: { id: "A" }, target: { id: "B" }, weight: 1 },
        { id: "b-c", source: { data: { id: "B" } }, target: { data: { id: "C" } }, weight: 1 },
      ],
    });

    const filteredGraph = filterLasso(graph, ["A", "B"]);

    assert.deepEqual(nodeIds(filteredGraph), ["A", "B"]);
    assert.deepEqual(linkIds(filteredGraph), ["a-b"]);
  });
});
