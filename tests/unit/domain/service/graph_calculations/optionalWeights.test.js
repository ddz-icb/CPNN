import assert from "node:assert/strict";
import { test } from "node:test";
import { applyGraphFilters } from "../../../../../src/components/domain/service/graph_calculations/filterGraphPipeline.js";
import { joinGraphs } from "../../../../../src/components/domain/service/graph_calculations/joinGraph.js";
import {
  getCommunityData,
  getLinkWeightMinMax,
  getLinkWeightMagnitudeExtent,
  getAdjacentNodes,
  formatWeight,
} from "../../../../../src/components/domain/service/graph_calculations/graphUtils.js";
import { getLinkDistance } from "../../../../../src/components/domain/service/physics_calculations/physicsGraph.js";
import { buildGraphJsonDownload } from "../../../../../src/components/domain/service/download/graphJsonDownload.js";
import { parseGraphFile } from "../../../../../src/components/domain/service/parsing/graphParsing.js";
import { formatSearchWeight } from "../../../../../src/components/domain/service/search/search.js";
import { createTextFile, installFileReaderMock } from "../../../../support/fileUploadTestUtils.js";

const nodes = [{ id: "A", attribs: [] }, { id: "B", attribs: [] }, { id: "C", attribs: [] }];
const unweighted = { source: "A", target: "B", attrib: "custom relationship" };

test("combined weight filters retain unweighted relationships without source-specific rules", () => {
  const links = [unweighted, ...[-0.8, 0, 0.2, 0.7, 1.2].map((weight) => ({ source: "B", target: "C", attrib: "measured", weight }))];
  const { graphData } = applyGraphFilters({
    graphData: { nodes, links },
    filter: { ignoreNegatives: true, minLinkThreshold: 0.5, maxLinkThreshold: 0.9 },
  });
  assert.deepEqual(graphData.links, [unweighted, links[4]]);
  const zeroOnly = applyGraphFilters({ graphData: { nodes, links }, filter: { maxLinkThreshold: 0 } });
  assert.deepEqual(zeroOnly.graphData.links, [unweighted, links[2]]);
});

test("weight statistics exclude unweighted links and distinguish zero from absence", () => {
  assert.deepEqual(getLinkWeightMinMax({ nodes, links: [unweighted, { ...unweighted, weight: 0 }, { ...unweighted, weight: -0.4 }] }), {
    minWeight: -0.4, maxWeight: 0, minAbsWeight: 0, maxAbsWeight: 0.4,
  });
  for (const links of [[], [unweighted]]) {
    assert.deepEqual(getLinkWeightMinMax({ nodes, links }), {
      minWeight: null, maxWeight: null, minAbsWeight: null, maxAbsWeight: null,
    });
  }
});

test("merging retains a real weight regardless of input order, including zero", () => {
  for (const weight of [0, -0.5, 0.8]) {
    const weighted = { ...unweighted, weight };
    for (const [first, second] of [[unweighted, weighted], [weighted, unweighted]]) {
      assert.deepEqual(joinGraphs({ nodes, links: [first] }, { nodes, links: [second] }).links, [weighted]);
    }
  }
  assert.deepEqual(joinGraphs({ nodes, links: [unweighted] }, { nodes, links: [unweighted] }).links, [unweighted]);
  assert.equal(Object.hasOwn(unweighted, "weight"), false);
});

test("unweighted links use base layout distance and participate in community detection", () => {
  const graphData = { nodes, links: [unweighted, { source: "B", target: "C", attrib: "custom relationship" }] };
  const original = structuredClone(graphData);
  assert.equal(getLinkDistance(100, unweighted, getLinkWeightMagnitudeExtent(graphData)), 100);
  assert.equal(getLinkDistance(100, unweighted, { min: 0.2, max: 0.9 }), 100);
  const [groups] = getCommunityData(graphData);
  assert.equal(groups.A, groups.B);
  assert.equal(groups.B, groups.C);
  assert.ok(Number.isFinite(groups.A));
  assert.deepEqual(graphData, original);
});

test("node details and search consistently display unweighted relationships", () => {
  const [adjacent] = getAdjacentNodes({ nodes, links: [unweighted] }, "A");
  assert.equal(formatWeight(adjacent.connections[0].weight), "Unweighted");
  assert.equal(formatSearchWeight(undefined), "Unweighted");
  assert.notEqual(formatSearchWeight(0), "Unweighted");
  assert.ok(Number.isFinite(adjacent.maxWeight));
});

test("JSON export and reimport preserve omitted weights, zero, and separate confidence", async (t) => {
  t.after(installFileReaderMock());
  const nodes = [{ id: "P1_AKT1" }, { id: "P2_MTOR" }];
  const links = [
    { source: "P1_AKT1", target: "P2_MTOR", attrib: "custom relationship", confidence: 0.9 },
    { source: "P1_AKT1", target: "P2_MTOR", attrib: "measured", weight: 0 },
  ];
  const download = buildGraphJsonDownload({ name: "mixed.json", data: { nodes, links } });
  const text = await download.blob.text();
  assert.deepEqual(JSON.parse(text).links, links);
  const imported = await parseGraphFile(createTextFile("mixed.json", text, "application/json"), { dataFormat: "json" });
  assert.deepEqual(imported.data.links, links);
});
