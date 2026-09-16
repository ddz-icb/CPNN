import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import { colorschemeService, updateAttribColorMapping } from "../../../../src/components/application/services/colorschemeService.js";
import { errorService } from "../../../../src/components/application/services/errorService.js";
import { colorschemeStateInit, useColorschemeState } from "../../../../src/components/adapters/state/colorschemeState.js";
import { db } from "../../../../src/components/repository/colorschemeRepo.js";
import { mockUploadedFilesLookup } from "../../../support/dexieTestUtils.js";

afterEach(() => {
  useColorschemeState.getState().setAllColorschemeState(colorschemeStateInit);
  errorService.clearError();
});

describe("colorschemeService color scheme selection", () => {
  test("loads selected node and link colorschemes independently", async (t) => {
    const nodeColorscheme = { name: "node-palette", data: ["#111111", "#222222"] };
    const linkColorscheme = { name: "link-palette", data: ["#aaaaaa", "#bbbbbb"] };
    const lookups = mockUploadedFilesLookup(t, db.uploadedFiles, {
      record: ({ value }) => ({ "node-palette": nodeColorscheme, "link-palette": linkColorscheme })[value],
    });

    await colorschemeService.handleSelectNodeColorscheme("node-palette");
    await colorschemeService.handleSelectLinkColorscheme("link-palette");

    assert.deepEqual(lookups, [
      { indexName: "name", value: "node-palette" },
      { indexName: "name", value: "link-palette" },
    ]);
    assert.deepEqual(colorschemeService.getNodeColorscheme(), nodeColorscheme);
    assert.deepEqual(colorschemeService.getLinkColorscheme(), linkColorscheme);
    assert.equal(errorService.getError(), null);
  });
});

describe("updateAttribColorMapping", () => {
  const colorschemeData = ["#111111", "#222222", "#333333"];

  test("swaps existing node color assignments when moving an attribute onto an occupied color", () => {
    const nextMapping = updateAttribColorMapping({
      attribsToColorIndices: { Kinase: 0, Signal: 1, Complex: 2 },
      colorschemeData,
      colorIndex: 1,
      newAttribute: "Kinase",
    });

    assert.deepEqual(nextMapping, { Kinase: 1, Signal: 0, Complex: 2 });
  });

  test("moves a displaced link attribute to the first free color", () => {
    const nextMapping = updateAttribColorMapping({
      attribsToColorIndices: { activation: 0, inhibition: 1 },
      colorschemeData,
      colorIndex: 0,
      newAttribute: "binding",
    });

    assert.deepEqual(nextMapping, { activation: 2, inhibition: 1, binding: 0 });
  });

  test("drops a displaced attribute when no color is free", () => {
    const nextMapping = updateAttribColorMapping({
      attribsToColorIndices: { activation: 0, inhibition: 1 },
      colorschemeData: ["#111111", "#222222"],
      colorIndex: 0,
      newAttribute: "binding",
    });

    assert.deepEqual(nextMapping, { inhibition: 1, binding: 0 });
  });

  test("ignores empty attributes and invalid color indices", () => {
    const currentMapping = { activation: 0, inhibition: 1 };

    assert.deepEqual(
      updateAttribColorMapping({
        attribsToColorIndices: currentMapping,
        colorschemeData,
        colorIndex: 1,
        newAttribute: "",
      }),
      currentMapping,
    );
    assert.deepEqual(
      updateAttribColorMapping({
        attribsToColorIndices: currentMapping,
        colorschemeData,
        colorIndex: 99,
        newAttribute: "activation",
      }),
      currentMapping,
    );
  });
});
