import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { createGraph } from "../../../../src/components/domain/models/graph.js";
import { db } from "../../../../src/components/repository/graphRepo.js";
import { mockUploadedFilesPersistence } from "../../../support/dexieTestUtils.js";
import { createTextFile, installFileReaderMock } from "../../../support/fileUploadTestUtils.js";

let restoreFileReader;

before(() => {
  restoreFileReader = installFileReaderMock();
});

after(() => {
  restoreFileReader();
});

describe("graph uploads", () => {
  test("saves uploaded graph data through Dexie", async (t) => {
    const { duplicateChecks, savedRecords } = mockUploadedFilesPersistence(t, db.uploadedFiles, { addReturnValue: 42 });
    const file = createTextFile(
      "saved-upload.json",
      JSON.stringify({
        nodes: [{ id: "P1_AKT1" }, { id: "P2_MAPK1", attribs: ["Kinase"] }],
        links: [{ source: "P1_AKT1", target: "P2_MAPK1", weight: 0.75, attrib: "primary" }],
      }),
      "application/json",
    );

    const graph = await createGraph(file, { dataFormat: "json" });

    assert.deepEqual(duplicateChecks, [{ indexName: "name", value: "saved-upload" }]);
    assert.deepEqual(savedRecords, [
      {
        name: "saved-upload",
        data: {
          nodes: [
            { id: "P1_AKT1", attribs: [] },
            { id: "P2_MAPK1", attribs: ["Kinase"] },
          ],
          links: [{ source: "P1_AKT1", target: "P2_MAPK1", weight: 0.75, attrib: "primary" }],
        },
      },
    ]);
    assert.deepEqual(graph, {
      name: "saved-upload",
      data: savedRecords[0].data,
    });
  });
});
