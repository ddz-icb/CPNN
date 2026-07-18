import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { filterMinNeighborhood } from "../../../../../src/components/domain/service/graph_calculations/filterGraphNodes.js";
import { createGraph, linkIds, nodeIds } from "../../../../support/graphFixtures.js";

describe("filterMinNeighborhood", () => {
  test("returns the original graph when the minimum k-core size is inactive", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }],
      links: [{ id: "a-b", source: "A", target: "B", weight: 1 }],
    });

    assert.strictEqual(filterMinNeighborhood(graph, 0), graph);
    assert.strictEqual(filterMinNeighborhood(graph, null), graph);
  });

  test("removes leaf nodes and their links", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1 },
        { id: "b-c", source: "B", target: "C", weight: 1 },
        { id: "a-c", source: "A", target: "C", weight: 1 },
        { id: "a-d", source: "A", target: "D", weight: 1 },
      ],
    });

    const filteredGraph = filterMinNeighborhood(graph, 2);

    assert.deepEqual(nodeIds(filteredGraph), ["A", "B", "C"]);
    assert.deepEqual(linkIds(filteredGraph), ["a-b", "b-c", "a-c"]);
    assert.deepEqual(nodeIds(graph), ["A", "B", "C", "D"]);
  });

  test("keeps pruning until the remaining graph satisfies the minimum k-core size", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1 },
        { id: "b-c", source: "B", target: "C", weight: 1 },
        { id: "c-d", source: "C", target: "D", weight: 1 },
      ],
    });

    const filteredGraph = filterMinNeighborhood(graph, 2);

    assert.deepEqual(nodeIds(filteredGraph), []);
    assert.deepEqual(linkIds(filteredGraph), []);
  });

  test("removes every node when the requested k-core size is too high", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1 },
        { id: "b-c", source: "B", target: "C", weight: 1 },
        { id: "a-c", source: "A", target: "C", weight: 1 },
      ],
    });

    const filteredGraph = filterMinNeighborhood(graph, 3);

    assert.deepEqual(nodeIds(filteredGraph), []);
    assert.deepEqual(linkIds(filteredGraph), []);
  });
});
