import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import { useAppearance, appearanceInit } from "../../../../../src/components/adapters/state/appearanceState.js";
import { filterInit, useFilter } from "../../../../../src/components/adapters/state/filterState.js";
import { physicsInit, usePhysics } from "../../../../../src/components/adapters/state/physicsState.js";
import { buildCurrentGraphSettingsExport } from "../../../../../src/components/application/services/graphSettingsService.js";
import {
  buildColorschemeTsvDownload,
  buildCsvFileDownload,
  buildNodeIdsCsvDownload,
  buildObjectJsonDownload,
  buildTsvFileDownload,
  serializeColorschemeTsv,
} from "../../../../../src/components/domain/service/download/dataDownload.js";
import {
  buildGraphJsonData,
  buildGraphJsonDownload,
} from "../../../../../src/components/domain/service/download/graphJsonDownload.js";

function createGraph() {
  return {
    name: "export-test.json",
    data: {
      nodes: [
        {
          id: "P1_AKT1",
          attribs: ["Kinase"],
          x: 1.234,
          y: 2.345,
          z: 3.456,
          vx: 10,
          vy: 11,
          vz: 12,
          index: 0,
        },
        {
          id: "P2_MAPK1",
          attribs: [],
          x: -4.321,
          y: 0.005,
          fx: 1,
          fy: 2,
          index: 1,
        },
      ],
      links: [
        {
          source: { id: "P1_AKT1" },
          target: { id: "P2_MAPK1" },
          weight: 0.75,
          attrib: "primary",
          directed: false,
          index: 3,
          __linkIndex: 0,
          __sourceId: "P1_AKT1",
          __targetId: "P2_MAPK1",
        },
        {
          source: "P2_MAPK1",
          target: "P1_AKT1",
          weight: 0.5,
          attrib: "feedback",
          directed: true,
        },
      ],
    },
  };
}

afterEach(() => {
  useAppearance.getState().setAllAppearance(appearanceInit);
  useFilter.getState().setAllFilter(filterInit);
  usePhysics.getState().setAllPhysics(physicsInit);
});

describe("downloadGraphJson", () => {
  test("exports graph JSON without coordinates by default", async () => {
    const download = buildGraphJsonDownload(createGraph());

    assert.equal(download.filename, "export-test.json");
    assert.equal(download.blob.type, "application/json");
    assert.deepEqual(JSON.parse(await download.blob.text()), {
      nodes: [{ id: "P1_AKT1", attribs: "Kinase" }, { id: "P2_MAPK1" }],
      links: [
        {
          weight: 0.75,
          attrib: "primary",
          source: "P1_AKT1",
          target: "P2_MAPK1",
        },
        {
          weight: 0.5,
          attrib: "feedback",
          source: "P2_MAPK1",
          target: "P1_AKT1",
          directed: true,
        },
      ],
    });
  });

  test("exports coordinates and supplied settings when requested", () => {
    const data = buildGraphJsonData(createGraph(), {
      includeCoordinates: true,
      settings: {
        appearance: { linkWidth: 2.5 },
        filter: { minKCoreSize: 2 },
        physics: { linkLength: 150 },
      },
    });

    assert.deepEqual(data, {
      nodes: [
        { id: "P1_AKT1", attribs: "Kinase", x: 1.23, y: 2.35, z: 3.46 },
        { id: "P2_MAPK1", x: -4.32, y: 0.01 },
      ],
      links: [
        {
          weight: 0.75,
          attrib: "primary",
          source: "P1_AKT1",
          target: "P2_MAPK1",
        },
        {
          weight: 0.5,
          attrib: "feedback",
          source: "P2_MAPK1",
          target: "P1_AKT1",
          directed: true,
        },
      ],
      appearance: { linkWidth: 2.5 },
      filter: { minKCoreSize: 2 },
      physics: { linkLength: 150 },
    });
  });

  test("exports current graph settings without runtime-only theme or text mirror values", () => {
    useAppearance.getState().setAllAppearance({
      ...appearanceInit,
      linkWidth: 2.5,
      linkWidthText: 2.5,
      showNodeLabels: false,
      themeName: "dark",
    });
    useFilter.getState().setAllFilter({
      ...filterInit,
      minKCoreSize: 2,
      minKCoreSizeText: 2,
    });
    usePhysics.getState().setAllPhysics({
      ...physicsInit,
      linkLength: 150,
      linkLengthText: 150,
    });

    const data = buildGraphJsonData(createGraph(), { includeCoordinates: true, settings: buildCurrentGraphSettingsExport() });

    assert.deepEqual(data.appearance, { showNodeLabels: false, linkWidth: 2.5 });
    assert.deepEqual(data.filter, { minKCoreSize: 2 });
    assert.deepEqual(data.physics, { linkLength: 150 });
    assert.equal(Object.hasOwn(data.appearance, "themeName"), false);
    assert.equal(Object.hasOwn(data.appearance, "linkWidthText"), false);
    assert.equal(Object.hasOwn(data.filter, "minKCoreSizeText"), false);
    assert.equal(Object.hasOwn(data.physics, "linkLengthText"), false);
  });
});

describe("data download builders", () => {
  test("builds JSON object downloads from objects and JSON strings", async () => {
    const objectDownload = buildObjectJsonDownload({ nodes: ["A"], settings: { linkWidth: 2 } }, "graph.json");
    const stringDownload = buildObjectJsonDownload('{"nodes":["A"]}', "graph-string.json");

    assert.equal(objectDownload.filename, "graph.json");
    assert.equal(objectDownload.blob.type, "application/json");
    assert.deepEqual(JSON.parse(await objectDownload.blob.text()), { nodes: ["A"], settings: { linkWidth: 2 } });
    assert.deepEqual(JSON.parse(await stringDownload.blob.text()), { nodes: ["A"] });
  });

  test("builds CSV and TSV downloads with normalized extensions", async () => {
    const csvDownload = buildCsvFileDownload("id\nA", "nodes.tsv");
    const tsvDownload = buildTsvFileDownload("id\tattribs\nA\tKinase", "mapping.csv");

    assert.equal(csvDownload.filename, "nodes.csv");
    assert.equal(csvDownload.blob.type, "text/csv;charset=utf-8;");
    assert.equal(await csvDownload.blob.text(), "id\nA");
    assert.equal(tsvDownload.filename, "mapping.tsv");
    assert.equal(tsvDownload.blob.type, "text/tab-separated-values;charset=utf-8;");
    assert.equal(await tsvDownload.blob.text(), "id\tattribs\nA\tKinase");
  });

  test("builds colorscheme TSV downloads and rejects missing color data", async () => {
    const colorscheme = { name: "palette.csv", data: ["#111111", "#222222"] };
    const download = buildColorschemeTsvDownload(colorscheme, "node_colorscheme");

    assert.equal(serializeColorschemeTsv(colorscheme), "hex\n#111111\n#222222\n");
    assert.equal(download.filename, "palette_node_colorscheme.tsv");
    assert.equal(await download.blob.text(), "hex\n#111111\n#222222\n");
    assert.throws(() => serializeColorschemeTsv(null), /No color scheme selected/);
    assert.throws(() => serializeColorschemeTsv({ data: [] }), /at least one color/);
  });

  test("builds node id CSV downloads and skips missing node lists", async () => {
    const download = buildNodeIdsCsvDownload([{ id: "P1_AKT1" }, { id: "P2_MAPK1" }], "graph.json");

    assert.equal(download.filename, "graph_node_ids.csv");
    assert.equal(await download.blob.text(), "P1_AKT1\nP2_MAPK1");
    assert.equal(buildNodeIdsCsvDownload(null, "graph.json"), null);
  });
});
