import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { filterLinkAttribs } from "../../../../../src/components/domain/service/graph_calculations/filterGraphLinks.js";
import { parseAttribsFilter } from "../../../../../src/components/domain/service/parsing/attribsFilterParsing.js";
import { createGraph, linkIds } from "../../../../support/graphFixtures.js";

function filter(query) {
  return parseAttribsFilter(query);
}

describe("filterLinkAttribs", () => {
  test("returns the original graph when the filter is empty", () => {
    const graph = createGraph({
      links: [{ id: "link-1", source: "A", target: "B", weight: 1, attrib: "Kinase" }],
    });

    assert.strictEqual(filterLinkAttribs(graph, filter("")), graph);
  });

  test("keeps links with matching attributes", () => {
    const graph = createGraph({
      links: [
        { id: "link-1", source: "A", target: "B", weight: 1, attrib: "Kinase" },
        { id: "link-2", source: "B", target: "C", weight: 1, attrib: "Phosphatase" },
      ],
    });

    const filteredGraph = filterLinkAttribs(graph, filter("kinase"));

    assert.deepEqual(linkIds(filteredGraph), ["link-1"]);
    assert.deepEqual(linkIds(graph), ["link-1", "link-2"]);
  });

  test("keeps links with matching link names", () => {
    const graph = createGraph({
      links: [
        { id: "link-1", source: "A", target: "B", weight: 1, attrib: "Edge", name: "Activation edge" },
        { id: "link-2", source: "B", target: "C", weight: 1, attrib: "Edge", name: "Inhibition edge" },
      ],
    });

    const filteredGraph = filterLinkAttribs(graph, filter("name:activation"));

    assert.deepEqual(linkIds(filteredGraph), ["link-1"]);
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

  test("supports combined and, or, and not clauses", () => {
    const graph = createGraph({
      links: [
        { id: "link-1", source: "A", target: "B", weight: 1, attrib: "Kinase", directed: true },
        { id: "link-2", source: "A", target: "C", weight: 1, attrib: "Phosphatase", directed: true },
        { id: "link-3", source: "A", target: "C", weight: 1, attrib: "Binding", directed: true },
        { id: "link-4", source: "B", target: "A", weight: 1, attrib: "Kinase", directed: true },
        { id: "link-5", source: "C", target: "A", weight: 1, attrib: "Phosphatase", directed: true },
      ],
    });
    const filterRequest = filter("(kinase or phosphatase) and source:A and not {phosphatase, target:C}");

    const filteredGraph = filterLinkAttribs(graph, filterRequest);

    assert.deepEqual(linkIds(filteredGraph), ["link-1"]);
  });

  test("supports set clauses that require all terms to match", () => {
    const graph = createGraph({
      links: [
        { id: "link-1", source: "A", target: "B", weight: 1, attrib: "Kinase", directed: true },
        { id: "link-2", source: "A", target: "C", weight: 1, attrib: "Kinase", directed: true },
        { id: "link-3", source: "B", target: "C", weight: 1, attrib: "Binding", directed: true },
      ],
    });

    const filteredGraph = filterLinkAttribs(graph, filter("{attr:kinase, target:B}"));

    assert.deepEqual(linkIds(filteredGraph), ["link-1"]);
  });

  test("supports attribute count comparator clauses", () => {
    const graph = createGraph({
      links: [
        { id: "link-1", source: "A", target: "B", weight: 1, attrib: "Kinase" },
        { id: "link-2", source: "B", target: "C", weight: 1, attrib: "" },
        { id: "link-3", source: "A", target: "C", weight: 1 },
      ],
    });

    const filteredGraph = filterLinkAttribs(graph, filter("attrs:>=1"));

    assert.deepEqual(linkIds(filteredGraph), ["link-1"]);
  });
});
