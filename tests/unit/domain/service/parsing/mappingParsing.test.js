import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { parseMappingFile } from "../../../../../src/components/domain/service/parsing/mappingParsing.js";
import { createTextFile, installFileReaderMock } from "../../../../support/fileUploadTestUtils.js";

let restoreFileReader;

before(() => {
  restoreFileReader = installFileReaderMock();
});

after(() => {
  restoreFileReader();
});

describe("parseMappingFile uploads", () => {
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
});
