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
  test("defaults missing link weight to one", () => {
    const graph = graphWithLink();

    verifyGraph(graph);

    assert.equal(graph.data.links[0].weight, 1);
  });

  test("rejects null link weight", () => {
    const graph = graphWithLink({ weight: null });

    assert.throws(() => verifyGraph(graph), /invalid 'weight' property/);
  });
});
