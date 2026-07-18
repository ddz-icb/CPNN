import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { filterComponentDensity } from "../../../../../src/components/domain/service/graph_calculations/filterGraphNodes.js";
import { filterNodesExist } from "../../../../../src/components/domain/service/graph_calculations/filterGraphLinks.js";
import { createGraph, linkIds, nodeIds } from "../../../../support/graphFixtures.js";

describe("filterComponentDensity", () => {
  test("returns the original graph when the minimum density is inactive", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }],
      links: [{ id: "a-b", source: "A", target: "B", weight: 1 }],
    });

    assert.strictEqual(filterComponentDensity(graph, 0), graph);
    assert.strictEqual(filterComponentDensity(graph, null), graph);
  });

  test("returns the original graph when the maximum density is inactive", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }],
      links: [{ id: "a-b", source: "A", target: "B", weight: 1 }],
    });

    assert.strictEqual(filterComponentDensity(graph, 0, ""), graph);
    assert.strictEqual(filterComponentDensity(graph, 0, null), graph);
    assert.strictEqual(filterComponentDensity(graph, 0, undefined), graph);
  });

  test("keeps components whose average degree meets the threshold", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }, { id: "E" }, { id: "F" }],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1 },
        { id: "a-c", source: "A", target: "C", weight: 1 },
        { id: "b-c", source: "B", target: "C", weight: 1 },
        { id: "d-e", source: "D", target: "E", weight: 1 },
        { id: "e-f", source: "E", target: "F", weight: 1 },
      ],
    });

    const filteredGraph = filterComponentDensity(graph, 1.5);

    assert.deepEqual(nodeIds(filteredGraph), ["A", "B", "C"]);
    assert.deepEqual(nodeIds(graph), ["A", "B", "C", "D", "E", "F"]);
  });

  test("keeps components whose average degree does not exceed the maximum threshold", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }, { id: "E" }, { id: "F" }],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1 },
        { id: "a-c", source: "A", target: "C", weight: 1 },
        { id: "b-c", source: "B", target: "C", weight: 1 },
        { id: "d-e", source: "D", target: "E", weight: 1 },
        { id: "e-f", source: "E", target: "F", weight: 1 },
      ],
    });

    const filteredGraph = filterComponentDensity(graph, 0, 1.5);

    assert.deepEqual(nodeIds(filteredGraph), ["D", "E", "F"]);
    assert.deepEqual(nodeIds(graph), ["A", "B", "C", "D", "E", "F"]);
  });

  test("keeps an entire component when its density is exactly the threshold", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1 },
        { id: "a-c", source: "A", target: "C", weight: 1 },
        { id: "a-d", source: "A", target: "D", weight: 1 },
      ],
    });

    const filteredGraph = filterComponentDensity(graph, 1.5);

    assert.deepEqual(nodeIds(filteredGraph), ["A", "B", "C", "D"]);
  });

  test("keeps an entire component when its density is exactly the maximum threshold", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1 },
        { id: "a-c", source: "A", target: "C", weight: 1 },
        { id: "a-d", source: "A", target: "D", weight: 1 },
      ],
    });

    const filteredGraph = filterComponentDensity(graph, 0, 1.5);

    assert.deepEqual(nodeIds(filteredGraph), ["A", "B", "C", "D"]);
  });

  test("removes isolated components when the threshold is positive", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
      links: [{ id: "a-b", source: "A", target: "B", weight: 1 }],
    });

    const filteredGraph = filterComponentDensity(graph, 0.5);

    assert.deepEqual(nodeIds(filteredGraph), ["A", "B"]);
  });

  test("keeps isolated components when the maximum density is zero", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
      links: [{ id: "a-b", source: "A", target: "B", weight: 1 }],
    });

    const filteredGraph = filterComponentDensity(graph, 0, 0);

    assert.deepEqual(nodeIds(filteredGraph), ["C"]);
  });

  test("removes every node when every component is denser than the maximum threshold", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }],
      links: [{ id: "a-b", source: "A", target: "B", weight: 1 }],
    });

    const filteredGraph = filterComponentDensity(graph, 0, 0.5);

    assert.deepEqual(nodeIds(filteredGraph), []);
  });

  test("applies minimum and maximum density thresholds together", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }, { id: "E" }, { id: "F" }, { id: "G" }, { id: "H" }],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1 },
        { id: "a-c", source: "A", target: "C", weight: 1 },
        { id: "b-c", source: "B", target: "C", weight: 1 },
        { id: "d-e", source: "D", target: "E", weight: 1 },
        { id: "e-f", source: "E", target: "F", weight: 1 },
        { id: "g-h", source: "G", target: "H", weight: 1 },
      ],
    });

    const filteredGraph = filterComponentDensity(graph, 1.1, 1.5);

    assert.deepEqual(nodeIds(filteredGraph), ["D", "E", "F"]);
  });

  test("supports links whose endpoints are node objects", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
      links: [{ id: "a-b", source: { id: "A" }, target: { data: { id: "B" } }, weight: 1 }],
    });

    const filteredGraph = filterComponentDensity(graph, 1);

    assert.deepEqual(nodeIds(filteredGraph), ["A", "B"]);
  });

  test("uses maximum density with links whose endpoints are node objects", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
      links: [{ id: "a-b", source: { id: "A" }, target: { data: { id: "B" } }, weight: 1 }],
    });

    const filteredGraph = filterComponentDensity(graph, 0, 0);

    assert.deepEqual(nodeIds(filteredGraph), ["C"]);
  });

  test("works with filterNodesExist to remove links from filtered components", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }, { id: "E" }],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1 },
        { id: "a-c", source: "A", target: "C", weight: 1 },
        { id: "b-c", source: "B", target: "C", weight: 1 },
        { id: "d-e", source: "D", target: "E", weight: 1 },
      ],
    });

    const filteredGraph = filterNodesExist(filterComponentDensity(graph, 1.5));

    assert.deepEqual(nodeIds(filteredGraph), ["A", "B", "C"]);
    assert.deepEqual(linkIds(filteredGraph), ["a-b", "a-c", "b-c"]);
  });

  test("uses maximum density with filterNodesExist to remove links from filtered components", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }, { id: "E" }, { id: "F" }],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1 },
        { id: "a-c", source: "A", target: "C", weight: 1 },
        { id: "b-c", source: "B", target: "C", weight: 1 },
        { id: "d-e", source: "D", target: "E", weight: 1 },
        { id: "e-f", source: "E", target: "F", weight: 1 },
      ],
    });

    const filteredGraph = filterNodesExist(filterComponentDensity(graph, 0, 1.5));

    assert.deepEqual(nodeIds(filteredGraph), ["D", "E", "F"]);
    assert.deepEqual(linkIds(filteredGraph), ["d-e", "e-f"]);
  });
});
