import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { filterThreshold } from "../../../../../src/components/domain/service/graph_calculations/filterGraphLinks.js";
import { STRING_DB_LINK_ATTRIB } from "../../../../../src/components/domain/service/enrichment/stringDbConfig.js";
import { createGraph, linkIds } from "../../../../support/graphFixtures.js";

describe("filterThreshold", () => {
  test("returns the original graph when no threshold is active", () => {
    const graph = createGraph({
      links: [{ id: "low", source: "A", target: "B", weight: 0.1 }],
    });

    assert.strictEqual(filterThreshold(graph, 0, null), graph);
    assert.strictEqual(filterThreshold(graph, "", undefined), graph);
    assert.strictEqual(filterThreshold(graph, null, undefined), graph);
  });

  test("keeps links whose absolute weights are inside the min and max thresholds", () => {
    const graph = createGraph({
      links: [
        { id: "too-low", source: "A", target: "B", weight: 0.2 },
        { id: "min-edge", source: "A", target: "C", weight: -0.5 },
        { id: "inside", source: "B", target: "C", weight: 0.8 },
        { id: "max-edge", source: "A", target: "B", weight: 1 },
        { id: "too-high", source: "A", target: "C", weight: -1.2 },
      ],
    });

    const filteredGraph = filterThreshold(graph, 0.5, 1);

    assert.deepEqual(linkIds(filteredGraph), ["min-edge", "inside", "max-edge"]);
    assert.deepEqual(linkIds(graph), ["too-low", "min-edge", "inside", "max-edge", "too-high"]);
  });

  test("treats a max threshold of zero as active", () => {
    const graph = createGraph({
      links: [
        { id: "zero", source: "A", target: "B", weight: 0 },
        { id: "positive", source: "B", target: "C", weight: 0.01 },
        { id: "negative", source: "A", target: "C", weight: -0.01 },
      ],
    });

    const filteredGraph = filterThreshold(graph, null, 0);

    assert.deepEqual(linkIds(filteredGraph), ["zero"]);
  });

  test("always keeps additional links", () => {
    const graph = createGraph({
      links: [
        { id: "regular-low", source: "A", target: "B", weight: 0.1 },
        { id: "string-db-low", source: "B", target: "C", weight: 0.1, attrib: STRING_DB_LINK_ATTRIB },
        { id: "regular-high", source: "A", target: "C", weight: 0.9 },
      ],
    });

    const filteredGraph = filterThreshold(graph, 0.5, null);

    assert.deepEqual(linkIds(filteredGraph), ["string-db-low", "regular-high"]);
  });
});
