import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { parseGraphFile } from "../../../../../src/components/domain/service/parsing/graphParsing.js";
import { createTextFile, installFileReaderMock } from "../../../../support/fileUploadTestUtils.js";

let restoreFileReader;

before(() => {
  restoreFileReader = installFileReaderMock();
});

after(() => {
  restoreFileReader();
});

function graphNodeIds(graph) {
  return graph.data.nodes.map((node) => node.id);
}

function graphLinkSummaries(graph) {
  return graph.data.links.map((link) => ({
    source: link.source,
    target: link.target,
    weight: link.weight,
    attrib: link.attrib,
  }));
}

describe("parseGraphFile uploads", () => {
  test("loads JSON graph uploads and applies prefilters", async () => {
    const file = createTextFile(
      "custom-upload.json",
      JSON.stringify({
        nodes: [
          { id: "P1_AKT1", attribs: [] },
          { id: "P2_MAPK1", attribs: [] },
          { id: "N1_BAD", attribs: [] },
          { id: "N2_BAD", attribs: [] },
          { id: "S1_SOLO", attribs: [] },
        ],
        links: [
          { source: "P1_AKT1", target: "P2_MAPK1", weight: 0.8, attrib: "primary" },
          { source: "N1_BAD", target: "N2_BAD", weight: -0.9, attrib: "primary" },
          { source: "P2_MAPK1", target: "S1_SOLO", weight: 0.2, attrib: "primary" },
        ],
      }),
      "application/json",
    );

    const graph = await parseGraphFile(file, {
      dataFormat: "json",
      ignoreNegatives: true,
      minEdgeCorr: 0.5,
      maxEdgeCorr: 0.85,
      minCompSize: 2,
      maxCompSize: 2,
    });

    assert.equal(graph.name, "custom-upload");
    assert.deepEqual(graphNodeIds(graph), ["P1_AKT1", "P2_MAPK1"]);
    assert.deepEqual(graphLinkSummaries(graph), [
      {
        source: "P1_AKT1",
        target: "P2_MAPK1",
        weight: 0.8,
        attrib: "primary",
      },
    ]);
  });

  test("normalizes optional JSON node attributes", async () => {
    const file = createTextFile(
      "json-defaults.json",
      JSON.stringify({
        nodes: [{ id: "P1_AKT1" }, { id: "P2_MAPK1", attribs: "Kinase" }, { id: "P3_PTEN", attribs: ["Phosphatase", "T2D"] }],
        links: [
          { source: "P1_AKT1", target: "P2_MAPK1", attrib: "primary" },
          { source: "P2_MAPK1", target: "P3_PTEN", weight: 0.4, attrib: "secondary" },
        ],
      }),
      "application/json",
    );

    const graph = await parseGraphFile(file, { dataFormat: "json" });

    assert.deepEqual(graph.data.nodes, [
      { id: "P1_AKT1", attribs: [] },
      { id: "P2_MAPK1", attribs: ["Kinase"] },
      { id: "P3_PTEN", attribs: ["Phosphatase", "T2D"] },
    ]);
    assert.deepEqual(graphLinkSummaries(graph), [
      {
        source: "P1_AKT1",
        target: "P2_MAPK1",
        weight: undefined,
        attrib: "primary",
      },
      {
        source: "P2_MAPK1",
        target: "P3_PTEN",
        weight: 0.4,
        attrib: "secondary",
      },
    ]);
  });

  test("strips non-persistable settings from JSON graph uploads", async () => {
    const file = createTextFile(
      "json-settings.json",
      JSON.stringify({
        nodes: [{ id: "P1_AKT1" }, { id: "P2_MAPK1" }],
        links: [{ source: "P1_AKT1", target: "P2_MAPK1", attrib: "primary" }],
        appearance: {
          linkWidth: 2.5,
          themeName: "dark",
          cameraRef: { current: null },
        },
        colorscheme: {
          nodeColorscheme: null,
          uploadedColorschemeNames: ["custom"],
        },
      }),
      "application/json",
    );

    const graph = await parseGraphFile(file, { dataFormat: "json" });

    assert.deepEqual(graph.data.appearance, { linkWidth: 2.5 });
    assert.deepEqual(graph.data.colorscheme, { nodeColorscheme: null });
  });

  test("rejects JSON graph uploads with missing link attributes or empty node attributes", async () => {
    const missingLinkAttribFile = createTextFile(
      "missing-link-attrib.json",
      JSON.stringify({
        nodes: [{ id: "P1_AKT1" }, { id: "P2_MAPK1" }],
        links: [{ source: "P1_AKT1", target: "P2_MAPK1", weight: 1 }],
      }),
      "application/json",
    );
    const emptyNodeAttribFile = createTextFile(
      "empty-node-attrib.json",
      JSON.stringify({
        nodes: [{ id: "P1_AKT1", attribs: "" }, { id: "P2_MAPK1" }],
        links: [{ source: "P1_AKT1", target: "P2_MAPK1", weight: 1, attrib: "primary" }],
      }),
      "application/json",
    );

    await assert.rejects(() => parseGraphFile(missingLinkAttribFile, { dataFormat: "json" }), /missing the 'attrib' property/);
    await assert.rejects(() => parseGraphFile(emptyNodeAttribFile, { dataFormat: "json" }), /empty attribute/);
  });

  test("loads correlation matrix uploads and converts them to weighted graph links", async () => {
    const file = createTextFile(
      "matrix-upload.csv",
      ["id,P1_AKT1,P2_MAPK1,P3_PTEN", "P1_AKT1,1,0.75,-0.2", "P2_MAPK1,0.75,1,0.95", "P3_PTEN,-0.2,0.95,1"].join("\n"),
      "text/csv",
    );

    const graph = await parseGraphFile(file, {
      dataFormat: "matrix",
      minEdgeCorr: 0.5,
      maxEdgeCorr: 0.8,
      minCompSize: 2,
      maxCompSize: 2,
    });

    assert.equal(graph.name, "matrix-upload");
    assert.deepEqual(graphNodeIds(graph), ["P1_AKT1", "P2_MAPK1"]);
    assert.deepEqual(graphLinkSummaries(graph), [
      {
        source: "P2_MAPK1",
        target: "P1_AKT1",
        weight: 0.75,
        attrib: "matrix-upload",
      },
    ]);
  });

  test("excludes missing correlation matrix values instead of creating zero-weight links", async () => {
    const file = createTextFile(
      "matrix-missing-values.csv",
      ["id,P1_AKT1,P2_MAPK1,P3_PTEN,P4_MTOR", "P1_AKT1,1,NA,,N/A", "P2_MAPK1,NA,1,NaN,0.6", "P3_PTEN,,NaN,1,0.7", "P4_MTOR,N/A,0.6,0.7,1"].join("\n"),
      "text/csv",
    );

    const graph = await parseGraphFile(file, { dataFormat: "matrix" });

    assert.deepEqual(graphLinkSummaries(graph), [
      { source: "P4_MTOR", target: "P2_MAPK1", weight: 0.6, attrib: "matrix-missing-values" },
      { source: "P4_MTOR", target: "P3_PTEN", weight: 0.7, attrib: "matrix-missing-values" },
    ]);
  });

  test("keeps numeric zero but excludes pairs missing either matrix entry", async () => {
    const file = createTextFile("matrix-zero.csv", [
      "id,P1_AKT1,P2_MAPK1,P3_PTEN",
      "P1_AKT1,1,0,0.5",
      "P2_MAPK1,0,1,NA",
      "P3_PTEN,NA,0.8,1",
    ].join("\n"), "text/csv");
    const graph = await parseGraphFile(file, { dataFormat: "matrix" });
    assert.deepEqual(graph.data.links, [{ source: "P2_MAPK1", target: "P1_AKT1", weight: 0, attrib: "matrix-zero" }]);
  });

  test("rejects malformed matrix values instead of replacing them with zero", async () => {
    const file = createTextFile("invalid.csv", "id,P1_AKT1,P2_MAPK1\nP1_AKT1,1,bad\nP2_MAPK1,bad,1", "text/csv");
    await assert.rejects(parseGraphFile(file, { dataFormat: "matrix" }), /Expected a number/);
  });

  for (const takeSpearman of [false, true]) {
    test(`excludes uncomputable ${takeSpearman ? "Spearman" : "Pearson"} links without inserting filler weights`, async () => {
      const file = createTextFile("missing.csv", [
        "id,sample1,sample2,sample3",
        "P1_AKT1,1,2,3",
        "P2_MAPK1,2,4,6",
        "P3_PTEN,NA,NaN,",
        "P4_MTOR,5,5,5",
        "P5_OTHER,1,NA,",
      ].join("\n"), "text/csv");
      const graph = await parseGraphFile(file, { dataFormat: "tabular", takeSpearman, minLinkThreshold: 0 });
      assert.deepEqual(graph.data.links, [{ source: "P2_MAPK1", target: "P1_AKT1", weight: 1, attrib: "missing" }]);
    });
  }

  test("loads tabular data uploads by computing correlations before prefiltering", async () => {
    const file = createTextFile(
      "tabular-upload.tsv",
      ["id\tsample1\tsample2\tsample3", "P1_AKT1\t1\t2\t3", "P2_MAPK1\t2\t4\t6", "P3_PTEN\t3\t2\t1", "F1_FLAT\t5\t5\t5"].join("\n"),
      "text/tab-separated-values",
    );

    const graph = await parseGraphFile(file, {
      dataFormat: "tabular",
      ignoreNegatives: true,
      minEdgeCorr: 0.9,
      minCompSize: 2,
      maxCompSize: 2,
      takeSpearman: false,
    });

    assert.equal(graph.name, "tabular-upload");
    assert.deepEqual(graphNodeIds(graph), ["P1_AKT1", "P2_MAPK1"]);
    assert.deepEqual(graphLinkSummaries(graph), [
      {
        source: "P2_MAPK1",
        target: "P1_AKT1",
        weight: 1,
        attrib: "tabular-upload",
      },
    ]);
  });

  test("ignores NAN values in tabular data when computing correlations", async () => {
    const file = createTextFile(
      "tabular-missing-values.tsv",
      ["id\tsample1\tsample2\tsample3\tsample4", "P1_AKT1\t1\t2\tNA\t4", "P2_MAPK1\t2\t4\tN/A\t8", "P3_PTEN\tNaN\t\t3\t1"].join("\n"),
      "text/tab-separated-values",
    );

    const graph = await parseGraphFile(file, {
      dataFormat: "tabular",
      ignoreNegatives: true,
      minEdgeCorr: 0.9,
      minCompSize: 2,
      maxCompSize: 2,
    });

    assert.deepEqual(graphNodeIds(graph), ["P1_AKT1", "P2_MAPK1"]);
    assert.deepEqual(graphLinkSummaries(graph), [
      {
        source: "P2_MAPK1",
        target: "P1_AKT1",
        weight: 1,
        attrib: "tabular-missing-values",
      },
    ]);
  });

  test("rejects tabular data uploads with non-numeric measurement values", async () => {
    const file = createTextFile(
      "tabular-invalid.tsv",
      ["id\tsample1\tsample2", "P1_AKT1\t1\tbad", "P2_MAPK1\t2\t4"].join("\n"),
      "text/tab-separated-values",
    );

    await assert.rejects(() => parseGraphFile(file, { dataFormat: "tabular" }), /measurement values must be numeric/);
  });

  test("rejects uploads whose selected format does not match the file content", async () => {
    const file = createTextFile("not-a-matrix.csv", ["id,P1_AKT1,P2_MAPK1", "P1_AKT1,1,0.2", "P2_MAPK1,0.8,1"].join("\n"), "text/csv");

    await assert.rejects(
      () => parseGraphFile(file, { dataFormat: "matrix" }),
      /Selected data format is 'Correlation Matrix', but the uploaded TSV\/CSV does not match matrix format/,
    );
  });
});
