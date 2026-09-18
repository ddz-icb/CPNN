import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  getMatchingNodes,
  getMatchingLinks,
  getSearchNodeIds,
  getSearchLinkIds,
  getSearchNodeResults,
  getSearchLinkResults,
} from "../../../../../src/components/domain/service/search/search.js";

const nodes = [
  { id: "P31749_AKT1", name: "Alpha kinase", attribs: ["Kinase", "T2D group"] },
  { id: "P42345_MTOR", label: "Growth regulator", attribs: ["Kinase", "Predicted"] },
  { id: "P62136_PP1", attribs: ["Phosphatase"] },
  { id: "isolated" },
];
const links = [
  { name: "AKT pathway", source: nodes[0].id, target: nodes[1].id, attrib: "T2D group", directed: true },
  { label: "Shared pathway", source: nodes[1], target: nodes[2], attrib: "Predicted" },
  { source: nodes[0], target: nodes[2], attrib: "Inhibition", directed: true },
];

describe("node search", () => {
  test("matches case-insensitive substrings across IDs, names, labels, and attributes", () => {
    for (const [query, expected] of [
      ["  aKt  ", [nodes[0]]],
      ["alpha", [nodes[0]]],
      ["growth", [nodes[1]]],
      ["kinase", nodes.slice(0, 2)],
      ['"no match"', []],
    ]) {
      assert.deepEqual(getMatchingNodes(nodes, query), expected, query);
    }
  });

  test("restricts field searches and combines alternatives, exclusions, and quoted values", () => {
    assert.deepEqual(getMatchingNodes(nodes, 'name:"alpha kinase" and attr:"t2d group"'), [nodes[0]]);
    assert.deepEqual(getMatchingNodes(nodes, "(attr:kinase or attr:phosphatase) and not attr:predicted"), [nodes[0], nodes[2]]);
    assert.deepEqual(getMatchingNodes(nodes, "attr:AKT1"), []);
    assert.deepEqual(getMatchingNodes(nodes, 'name:"t2d group"'), []);
  });

  test("supports all attribute-count comparisons including absent attributes", () => {
    for (const [query, expected] of [
      ["attrs:=2", nodes.slice(0, 2)],
      ["attrs:!=2", nodes.slice(2)],
      ["attrs:>1", nodes.slice(0, 2)],
      ["attrs:>=1", nodes.slice(0, 3)],
      ["attrs:<1", [nodes[3]]],
      ["attrs:<=1", nodes.slice(2)],
    ]) {
      assert.deepEqual(getMatchingNodes(nodes, query), expected, query);
    }
  });

  test("counts distinct neighbors, ignoring parallel links, self-links, and unknown endpoints", () => {
    const repeatedLinks = [...links, { ...links[0] }, { source: nodes[0], target: nodes[0] }, { source: nodes[0], target: "missing" }];
    assert.deepEqual(getMatchingNodes(nodes, "neighbors:=2", repeatedLinks), nodes.slice(0, 3));
    assert.deepEqual(getMatchingNodes(nodes, "attr:kinase and neighbors:>=2 and not attr:predicted", repeatedLinks), [nodes[0]]);
    assert.deepEqual(getMatchingNodes(nodes, "neighbors:=0", repeatedLinks), [nodes[3]]);
    assert.deepEqual(getMatchingNodes(nodes, "neighbors:>2", repeatedLinks), []);
  });

  test("recomputes neighbor matches from the supplied filtered graph", () => {
    assert.deepEqual(getMatchingNodes(nodes, "neighbors:=2", links), nodes.slice(0, 3));
    assert.deepEqual(getMatchingNodes(nodes, "neighbors:=2", [links[0]]), []);
    assert.deepEqual(getMatchingNodes(nodes, "neighbors:=1", [links[0]]), nodes.slice(0, 2));
  });

  test("handles missing, empty, and numeric attribute values", () => {
    const sparseNodes = [{ id: "A", attribs: [null, undefined, "", " ", 0] }, { id: "B", attribs: null }, { id: "C" }];
    assert.deepEqual(getMatchingNodes(sparseNodes, "attrs:=0"), sparseNodes.slice(1));
    assert.deepEqual(getMatchingNodes(sparseNodes, "attr:0"), [sparseNodes[0]]);
  });
});

describe("link search", () => {
  test("matches names, labels, attributes, and endpoint IDs", () => {
    for (const [query, expected] of [
      ['name:"AKT pathway"', [links[0]]],
      ["name:shared", [links[1]]],
      ["pathway", links.slice(0, 2)],
      ['attr:"T2D group"', [links[0]]],
      ["MTOR", links.slice(0, 2)],
      ['"no match"', []],
    ]) {
      assert.deepEqual(
        getMatchingLinks(links, query).map((entry) => entry.link),
        expected,
        query,
      );
    }
  });

  test("respects directed source/target and accepts either end of bidirectional links", () => {
    assert.deepEqual(
      getMatchingLinks(links, "source:AKT1 and target:MTOR").map((entry) => entry.link),
      [links[0]],
    );
    assert.deepEqual(getMatchingLinks(links, "source:MTOR and target:AKT1"), []);
    for (const query of ["source:MTOR and target:PP1", "source:PP1 and target:MTOR"]) {
      assert.deepEqual(
        getMatchingLinks(links, query).map((entry) => entry.link),
        [links[1]],
      );
    }
  });

  test("combines endpoint and attribute conditions with exclusions", () => {
    const matches = getMatchingLinks(links, '(attr:"t2d group" or attr:predicted) and target:MTOR and not name:shared');
    assert.deepEqual(
      matches.map((entry) => entry.link),
      [links[0]],
    );
    assert.equal(matches[0].link, links[0]);
  });

  test("handles absent attributes and keeps internal highlight keys stable across queries", () => {
    const sparseLink = { source: nodes[0], target: nodes[3] };
    assert.equal(getMatchingLinks([sparseLink], "attrs:=0")[0].link, sparseLink);
    assert.deepEqual(getMatchingLinks([sparseLink], "attr:kinase"), []);
    const byAttribute = getMatchingLinks(links, "attr:inhibition");
    const byEndpoint = getMatchingLinks(links, "target:PP1 and not attr:predicted");
    assert.deepEqual(getSearchLinkIds(byAttribute), getSearchLinkIds(byEndpoint));
  });
});

describe("search results", () => {
  test("empty queries or missing graph data return no matches", () => {
    for (const query of [undefined, null, "", "  "]) {
      assert.deepEqual(getMatchingNodes(nodes, query, links), []);
      assert.deepEqual(getMatchingLinks(links, query), []);
    }
    assert.deepEqual(getMatchingNodes(undefined, "kinase"), []);
    assert.deepEqual(getMatchingLinks(undefined, "kinase"), []);
  });

  test("invalid queries report parser errors for both nodes and links", () => {
    for (const query of ['attr:"unclosed', "attr:", "neighbors:NaN", "type:kinase", "kinase || predicted"]) {
      assert.throws(() => getMatchingNodes(nodes, query, links), /Invalid query:/, query);
      assert.throws(() => getMatchingLinks(links, query), /Invalid query:/, query);
    }
  });

  test("display limits preserve the full matches and highlight IDs without modifying the graph", () => {
    const original = structuredClone({ nodes, links });
    const matchingNodes = getMatchingNodes(nodes, "attr:kinase", links);
    const matchingLinks = getMatchingLinks(links, "pathway");
    const highlightIds = getSearchLinkIds(matchingLinks);
    assert.equal(getSearchNodeResults(matchingNodes, 1).length, 1);
    assert.equal(getSearchLinkResults(matchingLinks, 1).length, 1);
    assert.deepEqual(
      getSearchNodeIds(matchingNodes),
      nodes.slice(0, 2).map((node) => node.id),
    );
    assert.equal(new Set(highlightIds).size, matchingLinks.length);
    assert.deepEqual(getSearchLinkIds(matchingLinks), highlightIds);
    assert.deepEqual({ nodes, links }, original);
  });
});
