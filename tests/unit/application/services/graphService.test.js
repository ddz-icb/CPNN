import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import { defaultExampleGraphName } from "../../../../src/assets/exampleGraphMetadata.js";
import { errorService } from "../../../../src/components/application/services/errorService.js";
import { graphService } from "../../../../src/components/application/services/graphService.js";
import { graphFlagsStateInit, useGraphFlags } from "../../../../src/components/adapters/state/graphFlagsState.js";
import { graphStateInit, useGraphState } from "../../../../src/components/adapters/state/graphState.js";
import { db } from "../../../../src/components/repository/graphRepo.js";
import { mockUploadedFilesLookup } from "../../../support/dexieTestUtils.js";

afterEach(() => {
  useGraphState.getState().setAllGraphState(graphStateInit);
  useGraphFlags.getState().setAllGraphFlags(graphFlagsStateInit);
  errorService.clearError();
});

describe("graphService active graph selection", () => {
  test("loads one graph by name", async (t) => {
    const savedGraph = {
      name: "graph-a",
      data: {
        nodes: [
          { id: "P1_AKT1", attribs: [] },
          { id: "P2_MAPK1", attribs: [] },
        ],
        links: [{ source: "P1_AKT1", target: "P2_MAPK1", weight: 0.5, attrib: "primary" }],
      },
    };
    const lookups = mockUploadedFilesLookup(t, db.uploadedFiles, { record: savedGraph });

    const graph = await graphService.getJoinedGraph(["graph-a"]);

    assert.deepEqual(lookups, [{ indexName: "name", value: "graph-a" }]);
    assert.deepEqual(graph, savedGraph);
  });

  test("selects one graph and keeps merge by name unchanged", async () => {
    graphService.setMergeByName(true);

    await graphService.handleSelectGraph("graph-a");

    assert.deepEqual(graphService.getActiveGraphNames(), ["graph-a"]);
    assert.equal(graphService.getMergeByName(), true);
    assert.equal(errorService.getError(), null);
  });

  test("adds a graph to another active graph", async () => {
    graphService.setActiveGraphNames(["graph-a"]);

    await graphService.handleAddActiveGraph("graph-b");

    assert.deepEqual(graphService.getActiveGraphNames(), ["graph-a", "graph-b"]);
    assert.equal(errorService.getError(), null);
  });

  test("removes one graph from multiple active graphs", async () => {
    graphService.setActiveGraphNames(["graph-a", "graph-b", "graph-c"]);

    await graphService.handleRemoveActiveGraph("graph-b");

    assert.deepEqual(graphService.getActiveGraphNames(), ["graph-a", "graph-c"]);
    assert.equal(errorService.getError(), null);
  });

  test("falls back to the default graph when removing the only active graph", async () => {
    graphService.setActiveGraphNames(["graph-a"]);

    await graphService.handleRemoveActiveGraph("graph-a");

    assert.deepEqual(graphService.getActiveGraphNames(), [defaultExampleGraphName]);
    assert.equal(errorService.getError(), null);
  });
});
