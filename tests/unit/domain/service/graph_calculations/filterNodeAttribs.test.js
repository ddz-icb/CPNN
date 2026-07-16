import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { filterNodeAttribs } from "../../../../../src/components/domain/service/graph_calculations/filterGraphNodes.js";
import { parseAttribsFilter } from "../../../../../src/components/domain/service/parsing/attribsFilterParsing.js";
import { createGraph, nodeIds } from "../../../../support/graphFixtures.js";

function filter(query) {
  return parseAttribsFilter(query);
}

describe("filterNodeAttribs", () => {
  test("returns the original graph when the filter is empty", () => {
    const graph = createGraph({
      nodes: [{ id: "AKT1", attribs: ["Kinase"] }],
    });

    assert.strictEqual(filterNodeAttribs(graph, filter("")), graph);
  });

  test("keeps nodes with matching attributes", () => {
    const graph = createGraph({
      nodes: [
        { id: "AKT1", attribs: ["Kinase", "T2D group"] },
        { id: "MTOR", attribs: ["Kinase"] },
        { id: "PTEN", attribs: ["Phosphatase"] },
      ],
    });

    const filteredGraph = filterNodeAttribs(graph, filter('attr:"t2d group"'));

    assert.deepEqual(nodeIds(filteredGraph), ["AKT1"]);
    assert.deepEqual(nodeIds(graph), ["AKT1", "MTOR", "PTEN"]);
  });

  test("keeps nodes with matching names and labels", () => {
    const graph = createGraph({
      nodes: [
        { id: "node-1", name: "Alpha kinase", attribs: [] },
        { id: "node-2", label: "Beta phosphatase", attribs: [] },
        { id: "node-3", name: "Adapter", attribs: [] },
      ],
    });

    const nameMatches = filterNodeAttribs(graph, filter("name:alpha"));
    const labelMatches = filterNodeAttribs(graph, filter("name:beta"));

    assert.deepEqual(nodeIds(nameMatches), ["node-1"]);
    assert.deepEqual(nodeIds(labelMatches), ["node-2"]);
  });

  test("supports neighbor comparator clauses", () => {
    const graph = createGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
      links: [
        { source: "A", target: "B", weight: 1, attrib: "Edge" },
        { source: "A", target: "C", weight: 1, attrib: "Edge" },
        { source: "B", target: "C", weight: 1, attrib: "Edge" },
      ],
    });

    const filteredGraph = filterNodeAttribs(graph, filter("neighbors:>1"));

    assert.deepEqual(nodeIds(filteredGraph), ["A", "B", "C"]);
  });

  test("supports combined and, or, and not clauses", () => {
    const graph = createGraph({
      nodes: [
        { id: "AKT1", attribs: ["Kinase", "T2D group"] },
        { id: "PTEN", attribs: ["Phosphatase", "Predicted"] },
        { id: "PTPN1", attribs: ["Phosphatase"] },
        { id: "MTOR", attribs: ["Scaffold"] },
      ],
    });

    const filteredGraph = filterNodeAttribs(graph, filter("(attr:kinase or attr:phosphatase) and not attr:predicted"));

    assert.deepEqual(nodeIds(filteredGraph), ["AKT1", "PTPN1"]);
  });

  test("supports set clauses that require all terms to match", () => {
    const graph = createGraph({
      nodes: [
        { id: "AKT1", attribs: ["Kinase", "T2D group"] },
        { id: "MTOR", attribs: ["Kinase"] },
        { id: "GSK3B", attribs: ["T2D group"] },
      ],
    });

    const filteredGraph = filterNodeAttribs(graph, filter('{attr:kinase, attr:"t2d group"}'));

    assert.deepEqual(nodeIds(filteredGraph), ["AKT1"]);
  });

  test("supports attribute count comparator clauses", () => {
    const graph = createGraph({
      nodes: [
        { id: "AKT1", attribs: ["Kinase", "T2D group"] },
        { id: "MTOR", attribs: ["Kinase"] },
        { id: "PTEN", attribs: [] },
      ],
    });

    const filteredGraph = filterNodeAttribs(graph, filter("attrs:>=2"));

    assert.deepEqual(nodeIds(filteredGraph), ["AKT1"]);
  });
});
