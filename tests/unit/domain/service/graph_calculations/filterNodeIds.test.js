import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { filterNodeIds } from "../../../../../src/components/domain/service/graph_calculations/filterGraphNodes.js";
import { filterNodesExist } from "../../../../../src/components/domain/service/graph_calculations/filterGraphLinks.js";
import { parseNodeIdFilters } from "../../../../../src/components/domain/service/parsing/nodeIdFilterParsing.js";
import { createGraph, linkIds, nodeIds } from "../../../../support/graphFixtures.js";

function parseFilters(input) {
  return parseNodeIdFilters(input);
}

describe("filterNodeIds", () => {
  test("returns the original graph when no filters are active", () => {
    const graph = createGraph({
      nodes: [{ id: "P31749_AKT1" }, { id: "P42345_MTOR" }],
    });

    assert.strictEqual(filterNodeIds(graph, parseFilters("")), graph);
  });

  test("excludes nodes by encoded name or id substring", () => {
    const graph = createGraph({
      nodes: [
        { id: "P31749_AKT1" },
        { id: "P42345_MTOR" },
        { id: "Q06187_BTK" },
      ],
    });

    const filteredByName = filterNodeIds(graph, parseFilters("akt1"));
    const filteredById = filterNodeIds(graph, parseFilters("P42345"));

    assert.deepEqual(nodeIds(filteredByName), ["P42345_MTOR", "Q06187_BTK"]);
    assert.deepEqual(nodeIds(filteredById), ["P31749_AKT1", "Q06187_BTK"]);
    assert.deepEqual(nodeIds(graph), ["P31749_AKT1", "P42345_MTOR", "Q06187_BTK"]);
  });

  test("supports multiple comma and line separated filters", () => {
    const graph = createGraph({
      nodes: [
        { id: "P31749_AKT1" },
        { id: "P42345_MTOR" },
        { id: "P62993_GRB2" },
        { id: "Q06187_BTK" },
      ],
    });

    const filteredGraph = filterNodeIds(graph, parseFilters("AKT1, BTK\nGRB2"));

    assert.deepEqual(nodeIds(filteredGraph), ["P42345_MTOR"]);
  });

  test("matches filters case-insensitively", () => {
    const graph = createGraph({
      nodes: [{ id: "P31749_AKT1" }, { id: "P42345_MTOR" }],
    });

    const filteredGraph = filterNodeIds(graph, parseFilters("akt1"));

    assert.deepEqual(nodeIds(filteredGraph), ["P42345_MTOR"]);
  });

  test("leaves nodes when none of the substrings match", () => {
    const graph = createGraph({
      nodes: [{ id: "P31749_AKT1" }, { id: "P42345_MTOR" }],
    });

    const filteredGraph = filterNodeIds(graph, parseFilters("PTEN"));

    assert.deepEqual(nodeIds(filteredGraph), ["P31749_AKT1", "P42345_MTOR"]);
  });

  test("works with filterNodesExist to remove links for excluded nodes", () => {
    const graph = createGraph({
      nodes: [
        { id: "P31749_AKT1" },
        { id: "P42345_MTOR" },
        { id: "Q06187_BTK" },
      ],
      links: [
        { id: "akt-mtor", source: "P31749_AKT1", target: "P42345_MTOR", weight: 1 },
        { id: "mtor-btk", source: "P42345_MTOR", target: "Q06187_BTK", weight: 1 },
      ],
    });

    const filteredGraph = filterNodesExist(filterNodeIds(graph, parseFilters("AKT1")));

    assert.deepEqual(nodeIds(filteredGraph), ["P42345_MTOR", "Q06187_BTK"]);
    assert.deepEqual(linkIds(filteredGraph), ["mtor-btk"]);
  });
});
