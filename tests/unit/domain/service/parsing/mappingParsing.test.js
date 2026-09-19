import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { parseMapping, parseMappingFile } from "../../../../../src/components/domain/service/parsing/mappingParsing.js";
import { createTextFile, installFileReaderMock } from "../../../../support/fileUploadTestUtils.js";

let restoreFileReader;

before(() => {
  restoreFileReader = installFileReaderMock();
});

after(() => {
  restoreFileReader();
});

describe("parseMappingFile uploads", () => {
  test("combines repeated IDs and deduplicates attributes while preserving text IDs", () => {
    const data = parseMapping("id,attribs\n00123,Kinase; Signal\n00123,Signal; Other\nakt1,Lowercase\nAKT1,Uppercase");
    assert.deepEqual(data, {
      "00123": { attribs: ["Kinase", "Signal", "Other"] },
      akt1: { attribs: ["Lowercase"] },
      AKT1: { attribs: ["Uppercase"] },
    });
    assert.throws(() => parseMapping("id,attribs\nA,Kinase\nA,"), /has no attributes/);
  });

  test("loads CSV mapping uploads and splits semicolon-separated attributes", async () => {
    const file = createTextFile("mapping-upload.csv", ["id,attribs", "P1_AKT1,Kinase; T2D", "P2_MAPK1,Signal"].join("\n"), "text/csv");

    const mapping = await parseMappingFile(file);

    assert.deepEqual(mapping, {
      name: "mapping-upload",
      data: {
        P1_AKT1: { attribs: ["Kinase", "T2D"] },
        P2_MAPK1: { attribs: ["Signal"] },
      },
    });
  });

  test("rejects mapping uploads without required headers", async () => {
    const file = createTextFile("mapping-upload.csv", ["node,group", "P1_AKT1,Kinase"].join("\n"), "text/csv");

    await assert.rejects(() => parseMappingFile(file), /Mapping file must contain columns 'id' and 'attribs'/);
  });

  test("rejects mapping uploads with missing node IDs or missing attribute values", async () => {
    const missingIdFile = createTextFile("mapping-missing-id.csv", ["id,attribs", ",Kinase"].join("\n"), "text/csv");
    const missingAttribsFile = createTextFile("mapping-missing-attribs.csv", ["id,attribs", "P1_AKT1,"].join("\n"), "text/csv");

    await assert.rejects(() => parseMappingFile(missingIdFile), /missing a node ID/);
    await assert.rejects(() => parseMappingFile(missingAttribsFile), /has no attributes/);
  });
});
