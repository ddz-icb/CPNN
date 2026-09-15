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

  test("rejects uploads whose selected format does not match the file content", async () => {
    const file = createTextFile("not-a-matrix.csv", ["id,P1_AKT1,P2_MAPK1", "P1_AKT1,1,0.2", "P2_MAPK1,0.8,1"].join("\n"), "text/csv");

    await assert.rejects(
      () => parseGraphFile(file, { dataFormat: "matrix" }),
      /Selected data format is 'Correlation Matrix', but the uploaded TSV\/CSV does not match matrix format/,
    );
  });
});
