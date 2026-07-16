import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { getAdjacentNodes } from "../../../../../src/components/domain/service/graph_calculations/graphUtils.js";
import { createGraph } from "../../../../support/graphFixtures.js";

describe("getAdjacentNodes", () => {
  test("returns connection attributes as attribs", () => {
    const graph = createGraph({
      links: [{ source: "A", target: "B", weight: 1, attrib: "Kinase" }],
    });

    const [adjacentNode] = getAdjacentNodes(graph, "A");

    assert.deepEqual(adjacentNode.connections[0].attribs, ["Kinase"]);
    assert.equal(Object.hasOwn(adjacentNode.connections[0], "type"), false);
  });
});
