import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { createColorscheme } from "../../../../src/components/domain/models/colorscheme.js";
import { db } from "../../../../src/components/repository/colorschemeRepo.js";
import { mockUploadedFilesPersistence } from "../../../support/dexieTestUtils.js";
import { createTextFile, installFileReaderMock } from "../../../support/fileUploadTestUtils.js";

let restoreFileReader;

before(() => {
  restoreFileReader = installFileReaderMock();
});

after(() => {
  restoreFileReader();
});

describe("colorscheme uploads", () => {
  test("saves uploaded colorscheme data through Dexie", async (t) => {
    const { duplicateChecks, savedRecords } = mockUploadedFilesPersistence(t, db.uploadedFiles, { addReturnValue: 44 });
    const file = createTextFile("saved-palette.csv", ["hex", "#56B4E9", "#000000"].join("\n"), "text/csv");

    const colorscheme = await createColorscheme(file);

    assert.deepEqual(duplicateChecks, [{ indexName: "name", value: "saved-palette.csv" }]);
    assert.deepEqual(savedRecords, [
      {
        name: "saved-palette.csv",
        data: ["#56b4e9", "#000000"],
      },
    ]);
    assert.deepEqual(colorscheme, {
      name: "saved-palette.csv",
      data: savedRecords[0].data,
    });
  });
});
