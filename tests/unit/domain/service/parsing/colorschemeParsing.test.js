import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { parseColorschemeFile } from "../../../../../src/components/domain/service/parsing/colorschemeParsing.js";
import { createTextFile, installFileReaderMock } from "../../../../support/fileUploadTestUtils.js";

let restoreFileReader;

before(() => {
  restoreFileReader = installFileReaderMock();
});

after(() => {
  restoreFileReader();
});

describe("parseColorschemeFile uploads", () => {
  test("loads color scheme uploads and normalizes hex values", async () => {
    const file = createTextFile("palette-upload.csv", ["hex", "#56B4E9", "#000000"].join("\n"), "text/csv");

    const colorscheme = await parseColorschemeFile(file);

    assert.deepEqual(colorscheme, {
      name: "palette-upload.csv",
      data: ["#56b4e9", "#000000"],
    });
  });

  test("rejects invalid hex color uploads", async () => {
    const file = createTextFile("palette-upload.csv", ["hex", "#56b4e9", "blue"].join("\n"), "text/csv");

    await assert.rejects(() => parseColorschemeFile(file), /Invalid hex color value at row 3/);
  });
});
