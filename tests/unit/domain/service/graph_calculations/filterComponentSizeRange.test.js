import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { filterComponentSizeRange } from "../../../../../src/components/domain/service/graph_calculations/filterGraphNodes.js";
import { filterNodesExist } from "../../../../../src/components/domain/service/graph_calculations/filterGraphLinks.js";
import { createGraph, linkIds, nodeIds } from "../../../../support/graphFixtures.js";

describe("filterComponentSizeRange", () => {
  test("returns the original graph when the minimum component size filter is inactive", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }],
      links: [{ id: "a-b", source: "A", target: "B", weight: 1 }],
    });

    assert.strictEqual(filterComponentSizeRange(graph, 1, ""), graph);
  });

  test("returns the original graph when the maximum component size filter is inactive", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }],
      links: [{ id: "a-b", source: "A", target: "B", weight: 1 }],
    });

    assert.strictEqual(filterComponentSizeRange(graph, 1, ""), graph);
    assert.strictEqual(filterComponentSizeRange(graph, 1, null), graph);
    assert.strictEqual(filterComponentSizeRange(graph, 1, undefined), graph);
  });

  test("keeps components that meet the minimum size", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }, { id: "E" }],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1 },
        { id: "b-c", source: "B", target: "C", weight: 1 },
        { id: "d-e", source: "D", target: "E", weight: 1 },
      ],
    });

    const filteredGraph = filterComponentSizeRange(graph, 3, "");

    assert.deepEqual(nodeIds(filteredGraph), ["A", "B", "C"]);
    assert.deepEqual(nodeIds(graph), ["A", "B", "C", "D", "E"]);
  });

  test("keeps components that do not exceed the maximum size", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }, { id: "E" }],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1 },
        { id: "b-c", source: "B", target: "C", weight: 1 },
        { id: "d-e", source: "D", target: "E", weight: 1 },
      ],
    });

    const filteredGraph = filterComponentSizeRange(graph, 1, 2);

    assert.deepEqual(nodeIds(filteredGraph), ["D", "E"]);
    assert.deepEqual(nodeIds(graph), ["A", "B", "C", "D", "E"]);
  });

  test("keeps components whose size equals the minimum", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
      links: [{ id: "a-b", source: "A", target: "B", weight: 1 }],
    });

    const filteredGraph = filterComponentSizeRange(graph, 2, "");

    assert.deepEqual(nodeIds(filteredGraph), ["A", "B"]);
  });

  test("keeps components whose size equals the maximum", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }],
      links: [{ id: "a-b", source: "A", target: "B", weight: 1 }],
    });

    const filteredGraph = filterComponentSizeRange(graph, 1, 2);

    assert.deepEqual(nodeIds(filteredGraph), ["A", "B"]);
  });

  test("removes isolated nodes when the minimum size is greater than one", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
      links: [{ id: "a-b", source: "A", target: "B", weight: 1 }],
    });

    const filteredGraph = filterComponentSizeRange(graph, 2, "");

    assert.deepEqual(nodeIds(filteredGraph), ["A", "B"]);
  });

  test("removes every node when no component is large enough", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
      links: [{ id: "a-b", source: "A", target: "B", weight: 1 }],
    });

    const filteredGraph = filterComponentSizeRange(graph, 4, "");

    assert.deepEqual(nodeIds(filteredGraph), []);
  });

  test("removes every node when every component is larger than the maximum", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1 },
        { id: "b-c", source: "B", target: "C", weight: 1 },
      ],
    });

    const filteredGraph = filterComponentSizeRange(graph, 1, 1);

    assert.deepEqual(nodeIds(filteredGraph), []);
  });

  test("applies minimum and maximum component sizes together", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }, { id: "E" }, { id: "F" }],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1 },
        { id: "b-c", source: "B", target: "C", weight: 1 },
        { id: "d-e", source: "D", target: "E", weight: 1 },
      ],
    });

    const filteredGraph = filterComponentSizeRange(graph, 2, 2);

    assert.deepEqual(nodeIds(filteredGraph), ["D", "E"]);
  });

  test("supports links whose endpoints are node objects", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
      links: [{ id: "a-b", source: { id: "A" }, target: { data: { id: "B" } }, weight: 1 }],
    });

    const filteredGraph = filterComponentSizeRange(graph, 2, "");

    assert.deepEqual(nodeIds(filteredGraph), ["A", "B"]);
  });

  test("uses maximum size with links whose endpoints are node objects", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
      links: [{ id: "a-b", source: { id: "A" }, target: { data: { id: "B" } }, weight: 1 }],
    });

    const filteredGraph = filterComponentSizeRange(graph, 1, 1);

    assert.deepEqual(nodeIds(filteredGraph), ["C"]);
  });

  test("works with filterNodesExist to remove links from filtered components", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }, { id: "E" }],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1 },
        { id: "b-c", source: "B", target: "C", weight: 1 },
        { id: "d-e", source: "D", target: "E", weight: 1 },
      ],
    });

    const filteredGraph = filterNodesExist(filterComponentSizeRange(graph, 3, ""));

    assert.deepEqual(nodeIds(filteredGraph), ["A", "B", "C"]);
    assert.deepEqual(linkIds(filteredGraph), ["a-b", "b-c"]);
  });

  test("uses maximum size with filterNodesExist to remove links from filtered components", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }, { id: "E" }],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1 },
        { id: "b-c", source: "B", target: "C", weight: 1 },
        { id: "d-e", source: "D", target: "E", weight: 1 },
      ],
    });

    const filteredGraph = filterNodesExist(filterComponentSizeRange(graph, 1, 2));

    assert.deepEqual(nodeIds(filteredGraph), ["D", "E"]);
    assert.deepEqual(linkIds(filteredGraph), ["d-e"]);
  });
});
