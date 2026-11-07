import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getChevronRenderEntries,
  getFocusLinkWidthScale,
} from "../../../../../src/components/domain/service/canvas_drawing/lineGraphics.js";

test("chevron pass skips undirected links and keeps directed link order", () => {
  const links = [
    { source: "A", target: "B", directed: false },
    { source: "A", target: "B", directed: true },
    { source: "B", target: "A", directed: true },
  ];

  assert.deepEqual(getChevronRenderEntries(links).map(({ index }) => index), [2, 1]);
});

test("focused incident links are thicker while unrelated links keep their width", () => {
  const incidentLink = { source: "focused", target: "neighbor" };
  const unrelatedLink = { source: "other-a", target: "other-b" };

  assert.equal(getFocusLinkWidthScale(incidentLink, "focused"), 1.5);
  assert.equal(getFocusLinkWidthScale(unrelatedLink, "focused"), 1);
  assert.equal(getFocusLinkWidthScale(incidentLink, null), 1);
});
