import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { verifyGraph } from "../../../../../src/components/domain/service/verification/graphVerification.js";

function graphWithLink(link) {
  return {
    data: {
      nodes: [{ id: "P08590_MYL3" }, { id: "Q8WZ42_TTN" }],
      links: [{ source: "P08590_MYL3", target: "Q8WZ42_TTN", attrib: "phosphorylation", ...link }],
    },
  };
}

describe("verifyGraph", () => {
  test("preserves omitted link weights", () => {
    const graph = graphWithLink();

    verifyGraph(graph);

    assert.equal(Object.hasOwn(graph.data.links[0], "weight"), false);
  });

  test("rejects invalid explicit weights", () => {
    for (const weight of [null, NaN, Infinity, -Infinity, "1", "", false]) {
      assert.throws(() => verifyGraph(graphWithLink({ weight })), /invalid 'weight' property/);
    }
  });

  test("accepts finite weights including zero and negative values", () => {
    for (const weight of [0, -0.5, 0.5, 10]) {
      const graph = graphWithLink({ weight });
      verifyGraph(graph);
      assert.equal(graph.data.links[0].weight, weight);
    }
  });
});
