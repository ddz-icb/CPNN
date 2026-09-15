import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  INVALID_FILE_INPUT_MESSAGE,
  createBatchUploadErrorMessage,
  processNamedFileUpload,
  uploadFileBatch,
} from "../../../../src/components/application/services/fileUploadService.js";

function createLogSpy() {
  return {
    infoMessages: [],
    errorMessages: [],
    info(...args) {
      this.infoMessages.push(args);
    },
    error(...args) {
      this.errorMessages.push(args);
    },
  };
}

describe("uploadFileBatch", () => {
  test("uploads every file and collects per-file failures", async () => {
    const result = await uploadFileBatch(
      [{ name: "valid.csv" }, { name: "invalid.csv" }, { name: "string-error.csv" }],
      async (file) => {
        if (file.name === "invalid.csv") throw new Error("Bad format");
        if (file.name === "string-error.csv") throw "Unexpected string failure";
        return { name: "valid" };
      },
    );

    assert.deepEqual(result, {
      uploadedItems: [{ name: "valid" }],
      failedUploads: [
        { fileName: "invalid.csv", errorMessage: "Bad format" },
        { fileName: "string-error.csv", errorMessage: "Unexpected string failure" },
      ],
    });
  });
});

describe("createBatchUploadErrorMessage", () => {
  test("reports partial upload success with failure details", () => {
    const message = createBatchUploadErrorMessage({
      entityLabel: "graph",
      totalFiles: 2,
      uploadedFiles: 1,
      failedUploads: [{ fileName: "bad.csv", errorMessage: "Bad format" }],
    });

    assert.equal(message, "Uploaded 1 of 2 graph file(s). Failed: bad.csv: Bad format");
  });
});

describe("processNamedFileUpload", () => {
  test("merges successful upload names and reports partial failures", async () => {
    const log = createLogSpy();
    let mergedNames = null;
    let errorMessage = null;

    await processNamedFileUpload({
      files: [{ name: "new.csv" }, { name: "bad.csv" }],
      entityLabel: "mapping",
      uploadSingleFile: async (file) => {
        if (file.name === "bad.csv") throw new Error("Missing headers");
        return { name: "new" };
      },
      getExistingNames: () => ["existing"],
      setMergedNames: (names) => {
        mergedNames = names;
      },
      log,
      setError: (message) => {
        errorMessage = message;
      },
    });

    assert.deepEqual(mergedNames, ["existing", "new"]);
    assert.equal(errorMessage, "Uploaded 1 of 2 mapping file(s). Failed: bad.csv: Missing headers");
    assert.equal(log.errorMessages.length, 1);
  });

  test("rejects empty file inputs before running upload callbacks", async () => {
    const log = createLogSpy();
    let uploadCalled = false;
    let errorMessage = null;

    await processNamedFileUpload({
      files: null,
      entityLabel: "graph",
      uploadSingleFile: async () => {
        uploadCalled = true;
      },
      getExistingNames: () => [],
      setMergedNames: () => {},
      log,
      setError: (message) => {
        errorMessage = message;
      },
    });

    assert.equal(uploadCalled, false);
    assert.equal(errorMessage, INVALID_FILE_INPUT_MESSAGE);
    assert.deepEqual(log.errorMessages, [[INVALID_FILE_INPUT_MESSAGE]]);
  });
});
