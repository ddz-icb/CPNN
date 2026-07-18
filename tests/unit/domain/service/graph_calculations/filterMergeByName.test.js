import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { filterMergeByName } from "../../../../../src/components/domain/service/graph_calculations/filterGraph.js";
import { createGraph, nodeIds } from "../../../../support/graphFixtures.js";

function findNode(graph, id) {
  return graph.nodes.find((node) => node.id === id);
}

function linkSummary(link) {
  return {
    source: link.source,
    target: link.target,
    weight: link.weight,
    attrib: link.attrib,
    directed: Boolean(link.directed),
  };
}

describe("filterMergeByName", () => {
  test("returns the original graph when merging is disabled", () => {
    const graph = createGraph({
      nodes: [
        { id: "P1_AKT1", attribs: ["Kinase"] },
        { id: "P2_AKT1", attribs: ["T2D group"] },
      ],
    });

    assert.strictEqual(filterMergeByName(graph, false), graph);
    assert.strictEqual(filterMergeByName(graph, null), graph);
    assert.deepEqual(nodeIds(graph), ["P1_AKT1", "P2_AKT1"]);
  });

  test("merges nodes that share a parsed name and combines their attributes", () => {
    const graph = createGraph({
      nodes: [
        { id: "P1_AKT1", attribs: ["Kinase"] },
        { id: "P2_AKT1_S473,T308", attribs: ["T2D group", "Kinase"] },
        { id: "P3_MTOR", attribs: ["Complex"] },
      ],
    });

    const mergedGraph = filterMergeByName(graph, true);
    const mergedNodeId = "P1_AKT1; P2_AKT1_S473, T308";

    assert.deepEqual(nodeIds(mergedGraph), [mergedNodeId, "P3_MTOR"]);
    assert.deepEqual(findNode(mergedGraph, mergedNodeId).attribs, ["Kinase", "T2D group"]);
  });

  test("remaps links to merged nodes and removes links inside the merged node", () => {
    const graph = createGraph({
      nodes: [
        { id: "P1_AKT1", attribs: ["Kinase"] },
        { id: "P2_AKT1", attribs: ["T2D group"] },
        { id: "P3_MTOR", attribs: ["Complex"] },
      ],
      links: [
        { source: "P1_AKT1", target: "P2_AKT1", weight: 1, attrib: "Internal" },
        { source: "P1_AKT1", target: "P3_MTOR", weight: 0.4, attrib: "Binding" },
      ],
    });

    const mergedGraph = filterMergeByName(graph, true);

    assert.deepEqual(mergedGraph.links.map(linkSummary), [
      {
        source: "P1_AKT1; P2_AKT1",
        target: "P3_MTOR",
        weight: 0.4,
        attrib: "Binding",
        directed: false,
      },
    ]);
  });

  test("merges duplicate remapped links and keeps the largest absolute weight", () => {
    const graph = createGraph({
      nodes: [
        { id: "P1_AKT1", attribs: ["Kinase"] },
        { id: "P2_AKT1", attribs: ["T2D group"] },
        { id: "P3_MTOR", attribs: ["Complex"] },
      ],
      links: [
        { source: "P1_AKT1", target: "P3_MTOR", weight: 0.4, attrib: "Binding" },
        { source: "P2_AKT1", target: "P3_MTOR", weight: -0.8, attrib: "Binding" },
      ],
    });

    const mergedGraph = filterMergeByName(graph, true);

    assert.deepEqual(mergedGraph.links.map(linkSummary), [
      {
        source: "P1_AKT1; P2_AKT1",
        target: "P3_MTOR",
        weight: -0.8,
        attrib: "Binding",
        directed: false,
      },
    ]);
  });

  test("keeps opposite directed links separate after merging", () => {
    const graph = createGraph({
      nodes: [
        { id: "P1_AKT1", attribs: ["Kinase"] },
        { id: "P2_AKT1", attribs: ["T2D group"] },
        { id: "P3_MTOR", attribs: ["Complex"] },
      ],
      links: [
        { source: "P1_AKT1", target: "P3_MTOR", weight: 0.4, attrib: "Binding", directed: true },
        { source: "P3_MTOR", target: "P2_AKT1", weight: 0.7, attrib: "Binding", directed: true },
      ],
    });

    const mergedGraph = filterMergeByName(graph, true);

    assert.deepEqual(mergedGraph.links.map(linkSummary), [
      {
        source: "P1_AKT1; P2_AKT1",
        target: "P3_MTOR",
        weight: 0.4,
        attrib: "Binding",
        directed: true,
      },
      {
        source: "P3_MTOR",
        target: "P1_AKT1; P2_AKT1",
        weight: 0.7,
        attrib: "Binding",
        directed: true,
      },
    ]);
  });

  test("preserves previous layout when the merged node id is unchanged", () => {
    const graph = createGraph({
      nodes: [
        { id: "P1_AKT1", attribs: ["Kinase"] },
        { id: "P2_AKT1", attribs: ["T2D group"] },
      ],
    });
    const previousGraphData = createGraph({
      nodes: [{ id: "P1_AKT1; P2_AKT1", attribs: ["Kinase"], x: 10, y: 20, z: 30, vx: 0.1, vy: 0.2, vz: 0.3 }],
    });

    const mergedGraph = filterMergeByName(graph, true, { previousGraphData });

    assert.deepEqual(findNode(mergedGraph, "P1_AKT1; P2_AKT1"), {
      id: "P1_AKT1; P2_AKT1",
      attribs: ["Kinase", "T2D group"],
      x: 10,
      y: 20,
      z: 30,
      vx: 0.1,
      vy: 0.2,
      vz: 0.3,
    });
  });
});
