import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  collectNodesWithinPolygon,
  isPointInPolygon,
} from "../../../../../src/components/domain/service/canvas_interaction/lassoSelection.js";

function nodeEntry(id, x, y, visible = true) {
  return {
    node: { id },
    circle: { x, y, visible },
  };
}

describe("lasso selection geometry", () => {
  test("returns an empty selection when the polygon cannot enclose an area", () => {
    const nodeMap = {
      A: nodeEntry("A", 1, 1),
    };

    assert.deepEqual(collectNodesWithinPolygon(nodeMap, null), []);
    assert.deepEqual(collectNodesWithinPolygon(nodeMap, [{ x: 0, y: 0 }, { x: 1, y: 1 }]), []);
  });

  test("detects whether a point is inside a lasso polygon", () => {
    const triangle = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 10 },
    ];

    assert.equal(isPointInPolygon({ x: 2, y: 2 }, triangle), true);
    assert.equal(isPointInPolygon({ x: 8, y: 8 }, triangle), false);
  });

  test("collects visible nodes inside the drawn polygon", () => {
    const nodeMap = {
      inside: nodeEntry("inside", 2, 2),
      outsideShape: nodeEntry("outside-shape", 8, 8),
      outsideBounds: nodeEntry("outside-bounds", 20, 20),
      hidden: nodeEntry("hidden", 3, 3, false),
      missingCircle: { node: { id: "missing-circle" } },
    };
    const triangle = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 10 },
    ];

    assert.deepEqual(collectNodesWithinPolygon(nodeMap, triangle), ["inside"]);
  });
});
