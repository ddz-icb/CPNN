import assert from "node:assert/strict";
import { test } from "node:test";

import { getChevronRenderEntries } from "../../../../../src/components/domain/service/canvas_drawing/lineGraphics.js";

test("chevron pass skips undirected links and keeps directed link order", () => {
  const links = [
    { source: "A", target: "B", directed: false },
    { source: "A", target: "B", directed: true },
    { source: "B", target: "A", directed: true },
  ];

  assert.deepEqual(getChevronRenderEntries(links).map(({ index }) => index), [2, 1]);
});
