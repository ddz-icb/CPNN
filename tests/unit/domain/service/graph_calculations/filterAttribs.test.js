import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { filterLinkAttribs } from "../../../../../src/components/domain/service/graph_calculations/filterGraphLinks.js";
import { filterNodeAttribs } from "../../../../../src/components/domain/service/graph_calculations/filterGraphNodes.js";
import { parseAttribsFilter } from "../../../../../src/components/domain/service/parsing/attribsFilterParsing.js";
import { createGraph, linkIds, nodeIds } from "../../../../support/graphFixtures.js";

function filter(query) {
  return parseAttribsFilter(query);
}

const filterTargets = [
  {
    name: "nodes",
    applyFilter: filterNodeAttribs,
    getIds: nodeIds,
    createGraph: () =>
      createGraph({
        nodes: [
          { id: "AKT1", name: "Alpha kinase", attribs: ["Kinase", "T2D group"] },
          { id: "PTPN1", label: "Beta phosphatase", attribs: ["Phosphatase"] },
          { id: "PTEN", attribs: ["Predicted phosphatase"] },
          { id: "MTOR", attribs: [] },
        ],
      }),
    expected: {
      allIds: ["AKT1", "PTPN1", "PTEN", "MTOR"],
      multiWordAttr: ["AKT1"],
      name: ["AKT1"],
      combined: ["AKT1", "PTPN1"],
      set: ["AKT1"],
      hasAnyAttr: ["AKT1", "PTPN1", "PTEN"],
    },
  },
  {
    name: "links",
    applyFilter: filterLinkAttribs,
    getIds: linkIds,
    createGraph: () =>
      createGraph({
        links: [
          {
            id: "link-1",
            source: "A",
            target: "B",
            weight: 1,
            attrib: "Kinase; T2D group",
            name: "Alpha kinase interaction",
          },
          {
            id: "link-2",
            source: "B",
            target: "C",
            weight: 1,
            attrib: "Phosphatase",
            label: "Beta phosphatase interaction",
          },
          { id: "link-3", source: "C", target: "D", weight: 1, attrib: "Predicted phosphatase" },
          { id: "link-4", source: "D", target: "E", weight: 1, attrib: "" },
          { id: "link-5", source: "E", target: "F", weight: 1 },
        ],
      }),
    expected: {
      allIds: ["link-1", "link-2", "link-3", "link-4", "link-5"],
      multiWordAttr: ["link-1"],
      name: ["link-1"],
      combined: ["link-1", "link-2"],
      set: ["link-1"],
      hasAnyAttr: ["link-1", "link-2", "link-3"],
    },
  },
];

describe("attribute filters", () => {
  filterTargets.forEach(({ name, applyFilter, getIds, createGraph: buildGraph, expected }) => {
    describe(name, () => {
      test("returns the original graph when the filter is empty", () => {
        const graph = buildGraph();

        assert.strictEqual(applyFilter(graph, filter("")), graph);
      });

      test("keeps entries with matching multi-word attributes", () => {
        const graph = buildGraph();

        const filteredGraph = applyFilter(graph, filter('attr:"t2d group"'));

        assert.deepEqual(getIds(filteredGraph), expected.multiWordAttr);
        assert.deepEqual(getIds(graph), expected.allIds);
      });

      test("keeps entries with matching names or labels", () => {
        const graph = buildGraph();

        const filteredGraph = applyFilter(graph, filter('name:"alpha kinase"'));

        assert.deepEqual(getIds(filteredGraph), expected.name);
      });

      test("supports combined and, or, and not clauses", () => {
        const graph = buildGraph();

        const filteredGraph = applyFilter(graph, filter("(attr:kinase or attr:phosphatase) and not attr:predicted"));

        assert.deepEqual(getIds(filteredGraph), expected.combined);
      });

      test("supports set clauses that require all terms to match", () => {
        const graph = buildGraph();

        const filteredGraph = applyFilter(graph, filter('{attr:kinase, attr:"t2d group"}'));

        assert.deepEqual(getIds(filteredGraph), expected.set);
      });

      test("supports attribute count comparator clauses", () => {
        const graph = buildGraph();

        const filteredGraph = applyFilter(graph, filter("attrs:>=1"));

        assert.deepEqual(getIds(filteredGraph), expected.hasAnyAttr);
      });
    });
  });

  test("uses link direction when matching source and target fields", () => {
    const graph = createGraph({
      links: [
        { id: "undirected", source: "A", target: "B", weight: 1, attrib: "Edge" },
        { id: "directed-a-to-b", source: "A", target: "B", weight: 1, attrib: "Edge", directed: true },
        { id: "directed-b-to-a", source: "B", target: "A", weight: 1, attrib: "Edge", directed: true },
      ],
    });

    const linksFromB = filterLinkAttribs(graph, filter("source:B"));
    const linksToA = filterLinkAttribs(graph, filter("target:A"));

    assert.deepEqual(linkIds(linksFromB), ["undirected", "directed-b-to-a"]);
    assert.deepEqual(linkIds(linksToA), ["undirected", "directed-b-to-a"]);
  });

  test("uses unique node neighbor counts for node filters", () => {
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

  test("can filter nodes by having multiple attributes", () => {
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
