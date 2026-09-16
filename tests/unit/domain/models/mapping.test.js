import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { createMapping } from "../../../../src/components/domain/models/mapping.js";
import { db } from "../../../../src/components/repository/mappingRepo.js";
import { mockUploadedFilesPersistence } from "../../../support/dexieTestUtils.js";
import { createTextFile, installFileReaderMock } from "../../../support/fileUploadTestUtils.js";

let restoreFileReader;

before(() => {
  restoreFileReader = installFileReaderMock();
});

after(() => {
  restoreFileReader();
});

describe("mapping uploads", () => {
  test("saves uploaded mapping data through Dexie", async (t) => {
    const { duplicateChecks, savedRecords } = mockUploadedFilesPersistence(t, db.uploadedFiles, { addReturnValue: 43 });
    const file = createTextFile("saved-mapping.csv", ["id,attribs", "P1_AKT1,Kinase; T2D", "P2_MAPK1,Signal"].join("\n"), "text/csv");

    const mapping = await createMapping(file);

    assert.deepEqual(duplicateChecks, [{ indexName: "name", value: "saved-mapping" }]);
    assert.deepEqual(savedRecords, [
      {
        name: "saved-mapping",
        data: {
          P1_AKT1: { attribs: ["Kinase", "T2D"] },
          P2_MAPK1: { attribs: ["Signal"] },
        },
      },
    ]);
    assert.deepEqual(mapping, {
      name: "saved-mapping",
      data: savedRecords[0].data,
    });
  });
});
