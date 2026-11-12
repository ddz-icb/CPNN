import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { UploadGraph } from "../../src/components/adapters/gui/sidebar/uploadGraph.jsx";
import { graphService } from "../../src/components/application/services/graphService.js";
import { parseAttribsFilter } from "../../src/components/domain/service/parsing/attribsFilterParsing.js";
import { parseNodeIdFilters } from "../../src/components/domain/service/parsing/nodeIdFilterParsing.js";

let root;
let host;
let uploadSpy;
const originalRangeRect = Range.prototype.getBoundingClientRect;
const originalRangeRects = Range.prototype.getClientRects;

beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const rect = { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
  Range.prototype.getBoundingClientRect = () => rect;
  Range.prototype.getClientRects = () => [];
  uploadSpy = vi.spyOn(graphService, "handleCreateGraph").mockResolvedValue(undefined);
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(<UploadGraph />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  uploadSpy.mockRestore();
  if (originalRangeRect) Range.prototype.getBoundingClientRect = originalRangeRect;
  else delete Range.prototype.getBoundingClientRect;
  if (originalRangeRects) Range.prototype.getClientRects = originalRangeRects;
  else delete Range.prototype.getClientRects;
});

function clickButton(text) {
  const button = [...document.querySelectorAll("button")].find((item) => item.textContent === text);
  expect(button, `Button ${text}`).toBeDefined();
  return act(async () => button.click());
}

function getBlock(text) {
  const block = [...document.querySelectorAll(".block-section")].find((item) => item.querySelector(".label")?.textContent === text);
  expect(block, `Control ${text}`).toBeDefined();
  return block;
}

async function setNumber(text, value) {
  const input = getBlock(text).querySelector('input[type="number"]');
  await act(async () => input.focus());
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(value));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => input.blur());
}

async function applyQuery(text, query) {
  const block = getBlock(text);
  const editor = block.querySelector(".CodeMirror")?.CodeMirror;
  expect(editor, `Editor ${text}`).toBeDefined();
  await act(async () => editor.setValue(query));
  await act(async () => block.querySelector("button.button-rect").click());
}

test("upload defaults to minimum component size 1 and forwards the additional prefilters", async () => {
  await clickButton("Upload Graph");
  await clickButton("Prefilter Graph");

  expect(getBlock("Minimum component size").querySelector('input[type="number"]').value).toBe("1");
  const advanced = document.querySelector("details.filter-advanced");
  expect(advanced?.open).toBe(false);
  expect(advanced?.textContent).toContain("Maximum absolute link weight");
  expect(advanced?.textContent).toContain("Maximum component size");
  expect(document.body.textContent).not.toContain("Max Component Density");
  await setNumber("Min k-Core Size", 2);
  await setNumber("Min Component Density", 1);
  await setNumber("Maximum absolute link weight", 3);
  await setNumber("Maximum component size", 4);
  expect(advanced.querySelector("summary").textContent).toBe("Advanced filters (active)");
  await applyQuery("Filter Links by Attributes", "attr:keep");
  await applyQuery("Filter Nodes by Attributes", "attr:core");
  await applyQuery("Exclude Nodes by Name / ID", "BAD");

  await clickButton("Back");
  const fileInput = [...document.querySelectorAll('input[type="file"]')].find((input) => input.multiple);
  expect(fileInput).toBeDefined();
  Object.defineProperty(fileInput, "files", { configurable: true, value: [new File(["{}"], "example.json", { type: "application/json" })] });
  await act(async () => fileInput.dispatchEvent(new Event("change", { bubbles: true })));

  expect(uploadSpy).toHaveBeenCalledOnce();
  const settings = uploadSpy.mock.calls[0][1];
  expect(settings).toMatchObject({
    minCompSize: 1,
    minKCoreSize: 2,
    componentDensity: 1,
    maxEdgeCorr: 3,
    maxCompSize: 4,
    linkFilter: parseAttribsFilter("attr:keep"),
    nodeFilter: parseAttribsFilter("attr:core"),
    nodeIdFilters: parseNodeIdFilters("BAD"),
  });
});
