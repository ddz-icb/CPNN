import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import { errorService } from "../../../../src/components/application/services/errorService.js";
import { mappingService } from "../../../../src/components/application/services/mappingService.js";
import { mappingDataInit, useMappingState } from "../../../../src/components/adapters/state/mappingState.js";
import { db } from "../../../../src/components/repository/mappingRepo.js";
import { mockUploadedFilesLookup } from "../../../support/dexieTestUtils.js";

afterEach(() => {
  useMappingState.getState().setAllMappingState(mappingDataInit);
  errorService.clearError();
});

describe("mappingService mapping selection", () => {
  test("loads a selected mapping", async (t) => {
    const mapping = {
      name: "saved-mapping",
      data: {
        P1_AKT1: { attribs: ["Kinase"] },
      },
    };
    const lookups = mockUploadedFilesLookup(t, db.uploadedFiles, { record: mapping });

    await mappingService.handleSelectMapping("saved-mapping");

    assert.deepEqual(lookups, [{ indexName: "name", value: "saved-mapping" }]);
    assert.deepEqual(mappingService.getMapping(), mapping);
    assert.equal(errorService.getError(), null);
  });

  test("removes the active mapping", async () => {
    mappingService.setMapping({
      name: "saved-mapping",
      data: {
        P1_AKT1: { attribs: ["Kinase"] },
      },
    });

    await mappingService.handleRemoveMapping();

    assert.equal(mappingService.getMapping(), null);
    assert.equal(errorService.getError(), null);
  });
});
