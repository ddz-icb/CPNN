import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { filterNodesExist } from "../../../../../src/components/domain/service/graph_calculations/filterGraphLinks.js";
import { createGraph, linkIds } from "../../../../support/graphFixtures.js";

describe("filterNodesExist", () => {
  test("keeps links when both endpoints exist", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }],
      links: [{ id: "a-b", source: "A", target: "B", weight: 1 }],
    });

    const filteredGraph = filterNodesExist(graph);

    assert.deepEqual(linkIds(filteredGraph), ["a-b"]);
    assert.notStrictEqual(filteredGraph, graph);
  });

  test("removes links whose source or target node is missing", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }],
      links: [
        { id: "valid", source: "A", target: "B", weight: 1 },
        { id: "missing-source", source: "missing", target: "B", weight: 1 },
        { id: "missing-target", source: "A", target: "missing", weight: 1 },
      ],
    });

    const filteredGraph = filterNodesExist(graph);

    assert.deepEqual(linkIds(filteredGraph), ["valid"]);
    assert.deepEqual(linkIds(graph), ["valid", "missing-source", "missing-target"]);
  });

  test("supports links whose endpoints are node objects", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
      links: [
        { id: "object-id", source: { id: "A" }, target: { id: "B" }, weight: 1 },
        { id: "object-data-id", source: { data: { id: "B" } }, target: { data: { id: "C" } }, weight: 1 },
        { id: "missing-object-id", source: { id: "A" }, target: { data: { id: "missing" } }, weight: 1 },
      ],
    });

    const filteredGraph = filterNodesExist(graph);

    assert.deepEqual(linkIds(filteredGraph), ["object-id", "object-data-id"]);
  });
});
