import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { joinGraphDataList } from "../../../../../src/components/domain/service/graph_calculations/joinGraph.js";
import { applyGraphFilters } from "../../../../../src/components/domain/service/graph_calculations/filterGraphPipeline.js";
import { getGraphMetadataEntries } from "../../../../../src/components/domain/service/graph_calculations/graphMetadata.js";
import { buildGraphJsonData } from "../../../../../src/components/domain/service/download/graphJsonDownload.js";

const load = async (name) => JSON.parse(await readFile(new URL(`../../../../../src/assets/${name}.json`, import.meta.url), "utf8"));

for (const name of ["GloBISpeciesInteractions"]) {
  test(`${name}: source metadata survives filters and JSON export without settings`, async () => {
    const data = await load(name);
    const original = structuredClone(data.metadata);
    const graph = { name, data: applyGraphFilters({ graphData: data, filter: { minLinkThreshold: 0 } }).graphData };
    const exported = buildGraphJsonData(graph);
    assert.deepEqual(exported.metadata, original);
    assert.ok(original.references.some((reference) => reference.url.startsWith("https://")));
    assert.ok(original.licenses.length > 0);
    exported.metadata.title = "Changed copy";
    assert.equal(graph.data.metadata.title, original.title);
    const withSettings = buildGraphJsonData(graph, { settings: { metadata: { title: "Wrong source" } } });
    assert.deepEqual(withSettings.metadata, original);
  });
}

test("joining graphs retains available source metadata without duplicates", async () => {
  const first = await load("GloBISpeciesInteractions");
  const second = await load("TokyoRailwaySystem");
  const normalize = (data) => ({ ...data, nodes: data.nodes.map((n) => ({ ...n, attribs: Array.isArray(n.attribs) ? n.attribs : [n.attribs] })) });
  const joined = joinGraphDataList([normalize(first), normalize(second), normalize(first)]);
  const exported = buildGraphJsonData({ name: "combined", data: joined });
  const entries = getGraphMetadataEntries(exported.metadata);
  assert.deepEqual(entries, [first.metadata]);
  assert.ok(entries[0].licenses.length > 0);
  assert.equal(second.metadata, undefined);
});

test("graphs without metadata keep the same JSON shape", () => {
  const graph = { name: "plain", data: { nodes: [{ id: "a", attribs: [] }], links: [] } };
  assert.equal(Object.hasOwn(buildGraphJsonData(graph), "metadata"), false);
  const joined = joinGraphDataList([graph.data, graph.data]);
  assert.equal(Object.hasOwn(joined, "metadata"), false);
});
