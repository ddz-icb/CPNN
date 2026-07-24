import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { filterIgnoreNegatives } from "../../../../../src/components/domain/service/graph_calculations/filterGraphLinks.js";
import { createGraph, linkIds } from "../../../../support/graphFixtures.js";

describe("filterIgnoreNegatives", () => {
  test("returns the original graph when negative links should be kept", () => {
    const graph = createGraph({
      links: [{ id: "negative", source: "A", target: "B", weight: -1 }],
    });

    assert.strictEqual(filterIgnoreNegatives(graph, false), graph);
    assert.strictEqual(filterIgnoreNegatives(graph, null), graph);
  });

  test("removes links with negative weights", () => {
    const graph = createGraph({
      links: [
        { id: "negative", source: "A", target: "B", weight: -0.1 },
        { id: "zero", source: "B", target: "C", weight: 0 },
        { id: "positive", source: "A", target: "C", weight: 0.1 },
      ],
    });

    const filteredGraph = filterIgnoreNegatives(graph, true);

    assert.deepEqual(linkIds(filteredGraph), ["zero", "positive"]);
    assert.deepEqual(linkIds(graph), ["negative", "zero", "positive"]);
  });
});
