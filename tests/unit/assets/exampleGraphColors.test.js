import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  getLinkAttribsToColorIndices,
  getNodeAttribsToColorIndices,
} from "../../../src/components/domain/service/graph_calculations/graphUtils.js";
import { getMatchingNodes } from "../../../src/components/domain/service/search/search.js";
import { getNodeIdName } from "../../../src/components/domain/service/parsing/nodeIdParsing.js";

const examples = [
  ["GloBISpeciesInteractions", 11],
  ["TokyoRailwaySystem", 88],
  ["PalmerPenguinsSimilarityGraph", 8],
];

for (const [name, maxNodeAttributes] of examples) {
  test(`${name} assigns a palette color to every node and link attribute`, async () => {
    const graph = JSON.parse(await readFile(new URL(`../../../src/assets/${name}.json`, import.meta.url), "utf8"));
    const { colorscheme } = graph;
    const mappings = [
      [getNodeAttribsToColorIndices(graph, colorscheme.nodeAttribsToColorIndices), colorscheme.nodeColorscheme.data],
      [getLinkAttribsToColorIndices(graph, colorscheme.linkAttribsToColorIndices), colorscheme.linkColorscheme.data],
    ];

    assert.ok(Object.keys(mappings[0][0]).length <= maxNodeAttributes);
    for (const [mapping, palette] of mappings) {
      assert.ok(Object.keys(mapping).length > 0);
      assert.ok(Object.values(mapping).every((index) => Number.isInteger(index) && index >= 0 && index < palette.length));
    }
  });
}

test("GloBI groups redundant directed interaction types and keeps searchable common names", async () => {
  const graph = JSON.parse(await readFile(new URL("../../../src/assets/GloBISpeciesInteractions.json", import.meta.url), "utf8"));
  assert.equal(graph.nodes.length, graph.metadata.statistics.nodes);
  assert.equal(graph.links.length, graph.metadata.statistics.links);
  assert.ok(graph.nodes.length >= 800);
  const typeCounts = Map.groupBy(graph.links, (link) => link.attrib);
  assert.deepEqual(new Set(typeCounts.keys()), new Set([
    "eats", "hasParasite", "hasPathogen", "hostOf", "laysEggsOn", "pollinates", "visits",
  ]));
  assert.ok(typeCounts.get("eats").length >= 600);
  assert.ok(typeCounts.get("pollinates").length >= 50);
  assert.ok(typeCounts.get("hasPathogen").length >= 100);
  assert.deepEqual(new Set(graph.colorscheme.linkAttribsToColorIndices && Object.keys(graph.colorscheme.linkAttribsToColorIndices)), new Set(typeCounts.keys()));
  assert.ok(graph.links.every((link) => link.directed));
  assert.equal(new Set(graph.links.map(({ source, target, attrib }) => `${source}|${target}|${attrib}`)).size, graph.links.length);
  assert.deepEqual(new Set(graph.links.flatMap((link) => link.sourceInteractionTypes ?? [link.attrib])), new Set([
    "eatenBy", "eats", "hasEndoparasite", "hasParasite", "hasPathogen", "hostOf",
    "laysEggsOn", "pollinates", "preyedUponBy", "preysOn", "visits", "visitsFlowersOf",
  ]));
  const byNumber = new Map(graph.nodes.map((node) => [node.id.split("_")[0], node]));
  assert.deepEqual(graph.links.find(({ source, target, attrib }) => source === byNumber.get("106").id && target === byNumber.get("215").id && attrib === "eats")?.sourceInteractionTypes, ["eatenBy"]);
  assert.deepEqual(graph.links.find(({ source, target, attrib }) => source === byNumber.get("215").id && target === byNumber.get("110").id && attrib === "eats")?.sourceInteractionTypes, ["eats", "preysOn"]);
  assert.ok(graph.nodes.every((node) => getNodeIdName(node.id).includes(" (") &&
    ["scientificName", "name", "commonName", "commonNameSource"].every((field) => !(field in node))));
  const ids = new Set(graph.nodes.map((node) => node.id));
  assert.equal(ids.size, graph.nodes.length);
  assert.ok(graph.links.every(({ source, target }) => ids.has(source) && ids.has(target)));
  const lion = byNumber.get("231");
  assert.equal(lion?.id, "231_Lion (Panthera leo)");
  assert.equal(byNumber.get("104")?.id, "104_Fungus (Exserohilum turcicum)");
  assert.ok(getMatchingNodes(graph.nodes, "lion", graph.links).some(({ id }) => id === lion.id));
  assert.ok(getMatchingNodes(graph.nodes, "monarch", graph.links).some(({ id }) => id.includes("(Danaus plexippus)")));
});

test("GloBI expanded links trace to GloBI queries and form shared interaction clusters", async () => {
  const graph = JSON.parse(await readFile(new URL("../../../src/assets/GloBISpeciesInteractions.json", import.meta.url), "utf8"));
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const adjacency = new Map(graph.nodes.map((node) => [node.id, new Set()]));
  for (const link of graph.links) {
    adjacency.get(link.source).add(link.target);
    adjacency.get(link.target).add(link.source);
    if (link.evidence) assert.ok(link.evidence.queryUrl.startsWith("https://api.globalbioticinteractions.org/interaction.csv?"));
  }

  const remaining = new Set(nodes.keys());
  const sizes = [];
  while (remaining.size) {
    const pending = [remaining.values().next().value];
    const component = new Set();
    while (pending.length) {
      const id = pending.pop();
      if (component.has(id)) continue;
      component.add(id);
      remaining.delete(id);
      pending.push(...adjacency.get(id));
    }
    sizes.push(component.size);
  }
  sizes.sort((a, b) => b - a);

  assert.deepEqual(sizes, graph.metadata.statistics.componentSizes);
  assert.ok(sizes[0] >= 750);
  assert.ok(graph.metadata.sourceTaxa.length >= 15);
  assert.ok(graph.links.filter((link) => link.evidence).length >= 600);
});
