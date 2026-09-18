import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import axios from "axios";

let stringDb;
let omniPath;
let moduleId = 0;
const enzyme = "P00533";
const substrate = "P04637_TP53_S15";
const graph = {
  nodes: [{ id: enzyme, attribs: ["original"] }, { id: substrate }, { id: "P04637_TP53_S20" }],
  links: [{ source: enzyme, target: substrate, attrib: "original", weight: 0.8 }],
};
const interaction = { preferredName_A: enzyme, preferredName_B: "P04637", score: 0.9 };
const term = { category: "Process", description: "Cell cycle", fdr: 0.01, inputGenes: [enzyme] };
const tsvHeader = "enzyme\tsubstrate\tresidue_type\tresidue_offset\tcuration_effort\n";

beforeEach(async (t) => {
  // Fresh service modules isolate their in-memory caches between tests.
  moduleId += 1;
  ({ enrichGraphWithStringDb: stringDb } = await import(
    `../../../../../src/components/domain/service/enrichment/stringDbEnrichment.js?test=${moduleId}`
  ));
  ({ enrichGraphWithOmniPath: omniPath } = await import(
    `../../../../../src/components/domain/service/enrichment/omniPathEnrichment.js?test=${moduleId}`
  ));
  t.mock.method(axios, "post", async () => {
    throw new Error("Unexpected STRING request");
  });
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected OmniPath request");
  });
});

test("disabled enrichment and graphs without protein IDs make no requests", async () => {
  for (const options of [{ enabled: false }, {}]) {
    assert.equal(await stringDb(graph, options), graph);
  }
  for (const options of [{ kinaseEnabled: false }, {}]) {
    assert.equal(await omniPath(graph, options), graph);
  }
  for (const input of [
    { nodes: [], links: [] },
    { nodes: [{ id: "unknown" }], links: [] },
  ]) {
    assert.equal(await stringDb(input, { enabled: true }), input);
    assert.equal(await omniPath(input, { kinaseEnabled: true }), input);
  }
  assert.equal(axios.post.mock.callCount(), 0);
  assert.equal(fetch.mock.callCount(), 0);
});

test("STRING adds unique links and evidence at the configured thresholds", async () => {
  axios.post.mock.mockImplementation(async (_url, params) => {
    assert.equal(params.get("species"), "10090");
    return {
      data: [
        { ...interaction, escore: 0.5, dscore: 0.49, tscore: NaN },
        interaction,
        { ...interaction, preferredName_B: "unknown" },
        { ...interaction, preferredName_B: enzyme },
      ],
    };
  });
  const result = await stringDb(graph, { enabled: true, includeEvidence: true, minConfidence: 0.9, minEvidenceScore: 0.5, speciesId: "10090" });
  assert.deepEqual(
    result.links.map((link) => link.attrib),
    ["original", "STRING-DB", "STRING Experimental", "STRING-DB", "STRING Experimental"],
  );
  assert.ok(result.links.slice(1).every((link) => !Object.hasOwn(link, "weight")));
  assert.ok(result.links.filter((link) => link.attrib === "STRING Experimental").every((link) => link.confidence === 0.5));
  assert.ok(result.links.filter((link) => link.attrib === "STRING-DB").every((link) => link.confidence === 0.9));
  assert.deepEqual(result.nodes, graph.nodes);
});

test("STRING rejects low, missing, and non-finite confidence scores", async () => {
  axios.post.mock.mockImplementation(async () => ({ data: [0.89, undefined, NaN, Infinity].map((score) => ({ ...interaction, score })) }));
  assert.deepEqual(await stringDb(graph, { enabled: true, minConfidence: 0.9 }), graph);
});

test("STRING annotations respect category, FDR, term limit, and identifier mapping", async () => {
  axios.post.mock.mockImplementation(async (url) => ({
    data: url.endsWith("/get_string_ids")
      ? [{ queryItem: enzyme, preferredName: "EGFR" }]
      : [
          { ...term, category: "Function" },
          { ...term, fdr: 0.051 },
          { ...term, fdr: NaN },
          { ...term, fdr: undefined },
          { ...term, description: "" },
          { ...term, inputGenes: ["unknown"] },
          { ...term, inputGenes: ["EGFR"], fdr: 0.05 },
          { ...term, description: "Second term" },
        ],
  }));
  const result = await stringDb(graph, {
    nodeAttributeEnabled: true,
    nodeAttributeCategory: "Process",
    nodeAttributeMaxFdr: 0.05,
    nodeAttributeMaxTerms: 1,
  });
  assert.deepEqual(result.nodes[0].attribs, ["original", "Cell cycle [GO Process]"]);
  assert.deepEqual(result.nodes.slice(1), graph.nodes.slice(1));
  assert.deepEqual(result.links, graph.links);
});

test("STRING adds attributes to nodes without existing attributes", async () => {
  axios.post.mock.mockImplementation(async (url) => ({ data: url.endsWith("/get_string_ids") ? [] : [{ ...term, inputGenes: ["P04637"] }] }));
  const result = await stringDb(graph, { nodeAttributeEnabled: true });
  assert.deepEqual(result.nodes[1].attribs, ["Cell cycle [GO Process]"]);
  assert.deepEqual(result.nodes[2].attribs, ["Cell cycle [GO Process]"]);
});

test("STRING keeps full annotation names with the source at the end", async () => {
  const description = "Actin cytoskeleton organization and regulation of cellular component assembly";
  axios.post.mock.mockImplementation(async (url) => ({
    data: url.endsWith("/get_string_ids") ? [] : [{ ...term, category: "COMPARTMENTS", description }],
  }));
  const result = await stringDb(graph, { nodeAttributeEnabled: true });
  assert.deepEqual(result.nodes[0].attribs, ["original", `${description} [COMPARTMENTS]`]);
});

test("STRING community labels apply only to eligible connected groups", async () => {
  axios.post.mock.mockImplementation(async () => ({
    data: [
      { ...term, fdr: NaN },
      { ...term, fdr: 0.051 },
      { ...term, fdr: 0.05 },
    ],
  }));
  const result = await stringDb(graph, { groupEnrichmentEnabled: true, communityResolution: 0, maxGroupEnrichmentFdr: 0.05 });
  assert.deepEqual(result.nodes[0].attribs, ["original", "Community: Cell cycle"]);
  assert.deepEqual(result.nodes[1].attribs, ["Community: Cell cycle"]);
  assert.deepEqual(result.nodes[2], graph.nodes[2]);
  assert.equal(axios.post.mock.callCount(), 1);
});

test("OmniPath matches sites and curation thresholds for kinase and phosphatase links", async () => {
  fetch.mock.mockImplementation(
    async () =>
      new Response(
        tsvHeader +
          [
            `${enzyme}\tP04637\tS\t15\t2`,
            `${enzyme}\tP04637\tS\t15\t2`,
            `${enzyme}\tP04637\tS\t20\t1`,
            `${enzyme}\tP04637\tS\t20\tNaN`,
            `${enzyme}\tP04637\tS\t20\t`,
            `${enzyme}\tP04637\tT\t15\t3`,
            `unknown\tP04637\tS\t15\t3`,
            `\tP04637\tS\t15\t3`,
          ].join("\n"),
      ),
  );
  const result = await omniPath(graph, { kinaseEnabled: true, phosphataseEnabled: true, minCurationEffort: 2 });
  assert.deepEqual(
    result.links.slice(1),
    ["Phosphorylation", "Dephosphorylation"].map((attrib) => ({ source: enzyme, target: substrate, attrib, directed: true })),
  );
  assert.deepEqual(result.nodes[0].attribs, ["original", "Kinase", "Phosphatase"]);
  assert.equal(fetch.mock.callCount(), 2);
});

test("combined enrichment preserves original data and does not duplicate cached results", async () => {
  const original = structuredClone(graph);
  axios.post.mock.mockImplementation(async () => ({ data: [interaction] }));
  fetch.mock.mockImplementation(async () => new Response(tsvHeader + `${enzyme}\tP04637\tS\t15\t2`));
  const withString = await stringDb(graph, { enabled: true });
  const result = await omniPath(withString, { kinaseEnabled: true });
  assert.deepEqual(
    result.links.map((link) => link.attrib),
    ["original", "STRING-DB", "STRING-DB", "Phosphorylation"],
  );
  const repeated = await omniPath(await stringDb(result, { enabled: true }), { kinaseEnabled: true });
  assert.deepEqual(repeated, result);
  assert.equal(axios.post.mock.callCount(), 1);
  assert.equal(fetch.mock.callCount(), 1);
  assert.deepEqual(graph, original);
});

test("empty API responses preserve the graph", async () => {
  axios.post.mock.mockImplementation(async () => ({ data: [] }));
  fetch.mock.mockImplementation(async () => new Response(tsvHeader));
  assert.deepEqual(await stringDb(graph, { enabled: true, nodeAttributeEnabled: true, groupEnrichmentEnabled: true, communityResolution: 0 }), graph);
  assert.deepEqual(await omniPath(graph, { kinaseEnabled: true, phosphataseEnabled: true }), graph);
});

for (const [options, message] of [
  [{ enabled: true }, "Failed to load STRING-DB enrichment data."],
  [{ nodeAttributeEnabled: true }, "Failed to load STRING-DB node enrichment."],
  [{ groupEnrichmentEnabled: true, communityResolution: 0 }, "Failed to load STRING-DB community enrichment labels."],
]) {
  test(`STRING reports request errors: ${message}`, async () => {
    axios.post.mock.mockImplementation(async () => {
      throw new Error("Network unavailable");
    });
    await assert.rejects(stringDb(graph, options), { message });
  });
}

for (const [options, message] of [
  [{ kinaseEnabled: true }, "Failed to load OmniPath kinase data."],
  [{ phosphataseEnabled: true }, "Failed to load OmniPath phosphatase data."],
]) {
  test(`OmniPath reports HTTP errors: ${message}`, async () => {
    fetch.mock.mockImplementation(async () => new Response("Unavailable", { status: 503 }));
    await assert.rejects(omniPath(graph, options), { message });
  });
}
