import assert from "node:assert/strict";
import { test } from "node:test";

import { calculateGraphStatistics } from "../../../../../src/components/domain/service/graph_calculations/graphStatistics.js";

test("summarizes connectivity and link composition", () => {
  const graph = {
    nodes: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }, { id: "isolated" }],
    links: [
      { source: "a", target: "b", directed: true, weight: -2 },
      { source: "a", target: "b", weight: 4 },
      { source: "b", target: "c", directed: true },
      { source: "c", target: "d" },
      { source: "d", target: "d" },
    ],
  };

  const statistics = calculateGraphStatistics(graph);

  assert.equal(statistics.isolatedNodeCount, 1);
  assert.equal(statistics.directedLinkCount, 2);
  assert.equal(statistics.directedLinkShare, 2 / 5);
  assert.equal(statistics.meanWeight, 1);
  assert.equal(statistics.selfLoopCount, 1);
});

test("returns neutral optional statistics for an empty graph", () => {
  const statistics = calculateGraphStatistics();

  assert.equal(statistics.directedLinkShare, 0);
  assert.equal(statistics.meanWeight, null);
  assert.equal(statistics.selfLoopCount, 0);
});
