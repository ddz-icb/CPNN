import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { applyGraphFilters } from "../../../../../src/components/domain/service/graph_calculations/filterGraphPipeline.js";
import { STRING_DB_LINK_ATTRIB } from "../../../../../src/components/domain/service/enrichment/stringDbConfig.js";
import { parseAttribsFilter } from "../../../../../src/components/domain/service/parsing/attribsFilterParsing.js";
import { parseNodeIdFilters } from "../../../../../src/components/domain/service/parsing/nodeIdFilterParsing.js";
import { createGraph, linkIds, nodeIds } from "../../../../support/graphFixtures.js";

function attribFilter(query) {
  return parseAttribsFilter(query);
}

function applyFilters(graphData, filter = {}, options = {}) {
  return applyGraphFilters({
    graphData,
    originGraphData: graphData,
    filter,
    mergeByName: Boolean(options.mergeByName),
    mergeOptions: options.mergeOptions ?? {},
    communityResolution: options.communityResolution ?? 0,
  });
}

function linkSummaries(graphData) {
  return graphData.links.map((link) => ({
    id: link.id,
    source: link.source,
    target: link.target,
    weight: link.weight,
    attrib: link.attrib,
  }));
}

describe("combined graph filters", () => {
  test("applies overlapping lasso, id, weight, attribute, density, k-core, and size filters", () => {
    const graph = createGraph({
      nodes: [
        { id: "A", attribs: ["core"] },
        { id: "B", attribs: ["core"] },
        { id: "C", attribs: ["core"] },
        { id: "D", attribs: ["core"] },
        { id: "E", attribs: ["core"] },
        { id: "F", attribs: ["core"] },
        { id: "G", attribs: ["core"] },
        { id: "H", attribs: ["core"] },
        { id: "X", attribs: ["core"] },
      ],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 0.9, attrib: "primary" },
        { id: "a-c", source: "A", target: "C", weight: 0.82, attrib: "primary" },
        { id: "b-c", source: "B", target: "C", weight: 0.78, attrib: "primary" },
        { id: "a-d", source: "A", target: "D", weight: 0.7, attrib: "primary" },
        { id: "c-d", source: "C", target: "D", weight: 0.2, attrib: "primary" },
        { id: "b-e", source: "B", target: "E", weight: 0.86, attrib: "secondary" },
        { id: "e-f", source: "E", target: "F", weight: 0.88, attrib: "primary" },
        { id: "g-x", source: "G", target: "X", weight: 0.92, attrib: "primary" },
        { id: "c-h", source: "C", target: "H", weight: 0.95, attrib: "primary" },
      ],
    });

    const { graphData: filteredGraph } = applyFilters(graph, {
      lassoSelection: ["A", "B", "C", "D", "E", "F", "G", "X"],
      nodeIdFilters: parseNodeIdFilters("X"),
      minLinkThreshold: 0.75,
      linkFilter: attribFilter("attr:primary"),
      nodeFilter: attribFilter("attr:core"),
      componentDensity: 1.5,
      minKCoreSize: 2,
      minCompSize: 3,
      maxCompSize: 3,
    });

    assert.deepEqual(nodeIds(filteredGraph), ["A", "B", "C"]);
    assert.deepEqual(linkIds(filteredGraph), ["a-b", "a-c", "b-c"]);
    assert.deepEqual(nodeIds(graph), ["A", "B", "C", "D", "E", "F", "G", "H", "X"]);
  });

  test("merges by name before lasso, link attribute, threshold, and component filters run", () => {
    const mergedAktId = "P111_AKT1_S473; P222_AKT1_T308";
    const graph = createGraph({
      nodes: [
        { id: "P111_AKT1_S473", attribs: ["Kinase"] },
        { id: "P222_AKT1_T308", attribs: ["Signal"] },
        { id: "Q333_MAPK1_T202", attribs: ["Kinase"] },
        { id: "R444_PTEN_S380", attribs: ["Phosphatase"] },
      ],
      links: [
        { id: "akt-low-mapk", source: "P111_AKT1_S473", target: "Q333_MAPK1_T202", weight: 0.75, attrib: "primary" },
        { id: "akt-high-mapk", source: "P222_AKT1_T308", target: "Q333_MAPK1_T202", weight: 0.92, attrib: "primary" },
        { id: "akt-secondary-mapk", source: "P222_AKT1_T308", target: "Q333_MAPK1_T202", weight: 0.99, attrib: "secondary" },
        { id: "akt-pten", source: "P111_AKT1_S473", target: "R444_PTEN_S380", weight: 0.93, attrib: "primary" },
      ],
    });

    const { graphData: filteredGraph } = applyFilters(
      graph,
      {
        lassoSelection: [mergedAktId, "Q333_MAPK1_T202"],
        minLinkThreshold: 0.9,
        linkFilter: attribFilter("attr:primary"),
        nodeFilter: attribFilter("(attr:kinase or attr:signal)"),
        minCompSize: 2,
        maxCompSize: 2,
      },
      { mergeByName: true },
    );

    assert.deepEqual(nodeIds(filteredGraph), [mergedAktId, "Q333_MAPK1_T202"]);
    assert.deepEqual(linkSummaries(filteredGraph), [
      {
        id: "akt-low-mapk",
        source: mergedAktId,
        target: "Q333_MAPK1_T202",
        weight: 0.92,
        attrib: "primary",
      },
    ]);
  });

  test("excludes additional links from structural pruning but restores surviving additional links", () => {
    const graph = createGraph({
      nodes: [
        { id: "A", attribs: [] },
        { id: "B", attribs: [] },
        { id: "C", attribs: [] },
        { id: "D", attribs: [] },
        { id: "E", attribs: [] },
        { id: "F", attribs: [] },
        { id: "G", attribs: [] },
      ],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1, attrib: "primary" },
        { id: "b-c", source: "B", target: "C", weight: 1, attrib: "primary" },
        { id: "string-a-c", source: "A", target: "C", weight: 1, attrib: STRING_DB_LINK_ATTRIB },
        { id: "d-e", source: "D", target: "E", weight: 1, attrib: "primary" },
        { id: "e-f", source: "E", target: "F", weight: 1, attrib: "primary" },
        { id: "d-f", source: "D", target: "F", weight: 1, attrib: "primary" },
        { id: "string-d-f", source: "D", target: "F", weight: 1, attrib: STRING_DB_LINK_ATTRIB },
        { id: "string-d-g", source: "D", target: "G", weight: 1, attrib: STRING_DB_LINK_ATTRIB },
      ],
    });

    const { graphData: filteredGraph } = applyFilters(graph, {
      minKCoreSize: 2,
    });

    assert.deepEqual(nodeIds(filteredGraph), ["D", "E", "F"]);
    assert.deepEqual(linkIds(filteredGraph), ["d-e", "e-f", "d-f", "string-d-f"]);
  });

  test("combines component-backed community density, size, and visibility filters", () => {
    const graph = createGraph({
      nodes: [
        { id: "A", attribs: [] },
        { id: "B", attribs: [] },
        { id: "C", attribs: [] },
        { id: "D", attribs: [] },
        { id: "E", attribs: [] },
        { id: "F", attribs: [] },
        { id: "G", attribs: [] },
        { id: "H", attribs: [] },
      ],
      links: [
        { id: "a-b", source: "A", target: "B", weight: 1, attrib: "primary" },
        { id: "a-c", source: "A", target: "C", weight: 1, attrib: "primary" },
        { id: "b-c", source: "B", target: "C", weight: 1, attrib: "primary" },
        { id: "d-e", source: "D", target: "E", weight: 1, attrib: "primary" },
        { id: "d-f", source: "D", target: "F", weight: 1, attrib: "primary" },
        { id: "e-f", source: "E", target: "F", weight: 1, attrib: "primary" },
        { id: "g-h", source: "G", target: "H", weight: 1, attrib: "primary" },
      ],
    });

    const { communitySummary } = applyFilters(
      graph,
      {
        communityDensity: 1.5,
        minCommunitySize: 3,
        maxCommunitySize: 3,
      },
      { communityResolution: 0 },
    );
    const hiddenCommunityId = communitySummary.idToCommunity.D.toString();
    const { graphData: filteredGraph } = applyFilters(
      graph,
      {
        communityDensity: 1.5,
        minCommunitySize: 3,
        maxCommunitySize: 3,
        communityHiddenIds: [hiddenCommunityId],
      },
      { communityResolution: 0 },
    );

    assert.deepEqual(nodeIds(filteredGraph), ["A", "B", "C"]);
    assert.deepEqual(linkIds(filteredGraph), ["a-b", "a-c", "b-c"]);
  });
});
