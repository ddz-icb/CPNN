import assert from "node:assert/strict";
import { test } from "node:test";
import { applyNodeMapping } from "../../../../../src/components/domain/service/graph_calculations/applyMapping.js";
import { parseMapping } from "../../../../../src/components/domain/service/parsing/mappingParsing.js";

test("full IDs add combined attributes without changing unmatched nodes", () => {
  const graph = { nodes: [
    { id: "P1_AKT1", attribs: ["Original", "Kinase"] },
    { id: "P1_AKT10", attribs: ["Unmatched"] },
    { id: "p1_akt1" },
  ], links: [] };
  const mapping = parseMapping("id,attribs\nP1_AKT1,Kinase\nP1_AKT1,Signal");

  applyNodeMapping(graph, mapping);
  applyNodeMapping(graph, mapping);

  assert.deepEqual(graph.nodes.map((node) => node.attribs), [
    ["Original", "Kinase", "Signal"], ["Unmatched"], ["Kinase", "Signal"],
  ]);
});

test("matching fields combine attributes across case variants and ignore empty mapping IDs", () => {
  const graph = { nodes: [{ id: "P1_AKT1_S10", attribs: ["Original"] }], links: [] };
  const mapping = {
    ...parseMapping("id,attribs\nakt1,Kinase\nAKT1,Signal\np1,Kinase; Signal"),
    "": { attribs: ["Invalid"] },
  };

  applyNodeMapping(graph, mapping);

  assert.deepEqual(graph.nodes[0].attribs, ["Original", "Kinase", "Signal"]);
});

for (const [query, matches, misses] of [
  ["akt1", "P31749_AKT1_S473", "P31749_AKT10_S473"],
  ["AKT1", "P2_AKT10; P1_AKT1", "P1_XAKT1"],
  ["s47", "P1_AKT1_S12,S47", "P1_AKT1_S473"],
  ["p1-2", "P1-2_AKT1", "P1-20_AKT1"],
  ["P1", "P1_AKT1", "P1-2_AKT1"],
  ["p1_akt1_s47", "P1_AKT1_S47", "P1_AKT1_S473"],
  ["A.B", "P1_A.B", "P1_AXB"],
  ["AKT", "P1_AKT", "P1_AKT-1"],
  ["p1_akt1", "P1_AKT1_S47", "P1_AKT10_S47"],
  ["akt1_s47", "P1_AKT1_S47", "P1_AKT1_S473"],
  ["AKT1_S47", "P1_AKT1_S12,S47", "P1_AKT10_S47"],
  ["p1_akt1_s47", "P1_AKT1_S12,S47", "P1_AKT1_S473"],
  ["P1-2_AKT1", "P1-2_AKT1_S47", "P1-20_AKT1_S47"],
  ["AKT1_S47", "P2_MAPK1_S12; P1_AKT1_S47", "P1_AKT1_S12; P2_MAPK1_S47"],
]) {
  test(`mapping '${query}' matches '${matches}' but not '${misses}'`, () => {
    const graph = { nodes: [{ id: matches }, { id: misses }], links: [] };
    applyNodeMapping(graph, { [query]: { attribs: ["Mapped"] } });
    assert.deepEqual(graph.nodes.map((node) => node.attribs), [["Mapped"], []]);
  });
}

test("does not match fragments inside fields or skip parts of the ID", () => {
  const graph = { nodes: [{ id: "P1-2_AKT1_S47,S12" }], links: [] };
  const mapping = Object.fromEntries(["P1", "2", "AKT", "S4", "47", "AKT_S47", "P1-2_AKT", "P1-2_S47"]
    .map((id) => [id, { attribs: ["Incorrect"] }]));
  applyNodeMapping(graph, mapping);
  assert.deepEqual(graph.nodes[0].attribs, []);
});
