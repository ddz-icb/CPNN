import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, afterEach, expect, test, vi } from "vitest";
vi.mock("3dmol/build/3Dmol.js", () => ({ createViewer: vi.fn(() => ({ clear() {}, render() {}, setBackgroundColor() {} })) }));
vi.mock("../../src/components/adapters/gui/hooks/useProteinDetails.js", () => ({
  useProteinDetails: () => ({ uniprotStatus: "done", isApiComplete: true }),
}));
vi.mock("../../src/components/domain/service/download/download.js", () => ({ downloadNodeIdsCsv: vi.fn() }));
vi.mock("../../src/components/domain/service/canvas_interaction/centerView.js", () => ({ centerOnNodes: vi.fn() }));
vi.mock("../../src/components/adapters/gui/reusable_components/sidebarComponents.jsx", () => ({
  Button: ({ text, ...props }) => <button {...props}>{text}</button>,
}));
import { ClickTooltip } from "../../src/components/adapters/gui/tooltip/clickTooltip.jsx";
import { useGraphState } from "../../src/components/adapters/state/graphState.js";
import { tooltipInit, useTooltipSettings } from "../../src/components/adapters/state/tooltipState.js";
import { Tooltips } from "../../src/components/adapters/gui/tooltip/tooltips.jsx";
import { communityStateInit, useCommunityState } from "../../src/components/adapters/state/communityState.js";
import { centerOnNodes } from "../../src/components/domain/service/canvas_interaction/centerView.js";
let root, host;
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  host?.remove();
  useTooltipSettings.getState().setAllTooltipSettings({ ...tooltipInit });
  useCommunityState.getState().setAllCommunityState({ ...communityStateInit });
  vi.clearAllMocks();
});
test("node popup switches between statistics, adjacency and details and updates with filters", async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const data = {
    nodes: [
      { id: "a", attribs: [] },
      { id: "b", attribs: ["plant"] },
    ],
    links: [{ source: "a", target: "b", attrib: "eats", directed: true }],
  };
  useGraphState.getState().setGraphState("graph", { data });
  useCommunityState.getState().setAllCommunityState({
    ...communityStateInit,
    idToCommunity: { a: "0", b: "0" },
    communityToNodeIds: { 0: ["a", "b"] },
    communities: [
      {
        id: "0",
        label: "Community 1",
        size: 2,
        linkCount: 1,
        externalLinkCount: 0,
        density: 1,
        topNodeAttribs: [{ name: "plant", count: 1 }],
        topLinkAttribs: [{ name: "eats", count: 1 }],
      },
    ],
  });
  useTooltipSettings.getState().setTooltipSettings("clickTooltipData", { node: "a", x: 30, y: 30 });
  useTooltipSettings.getState().setTooltipSettings("isClickTooltipActive", true);
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(<ClickTooltip />));
  expect(centerOnNodes).toHaveBeenCalledWith([data.nodes[0]], expect.objectContaining({
    appearance: expect.any(Object),
    renderState: expect.any(Object),
    container: expect.any(Object),
  }));
  const click = async (text) => act(async () => [...host.querySelectorAll("button")].find((b) => b.textContent === text).click());
  await click("Statistics");
  expect(centerOnNodes).toHaveBeenCalledTimes(1);
  expect(host.querySelector(".node-statistics").textContent).toContain("eats");
  expect(host.querySelector(".node-statistics").textContent).toContain("plant");
  expect(host.querySelector(".community-details")).toBeNull();
  expect(host.querySelector(".node-statistics-community").textContent).toContain("Community 1");
  expect(host.querySelector(".node-statistics").lastElementChild).toBe(host.querySelector(".node-statistics-community"));
  await click("community");
  expect(host.querySelector(".tooltip-popup-heading").textContent).toBe("Community 1");
  expect(host.querySelector(".community-details").textContent).toContain("Top node attributes");
  expect(host.querySelectorAll(".community-attribute-list li")).toHaveLength(2);
  expect([...host.querySelectorAll(".community-attribute-list strong")].map((entry) => entry.textContent)).toEqual(["1 50%", "1 100%"]);
  expect(host.querySelector(".community-attribute-bar")).toBeNull();
  await click("Statistics");
  await click("Neighbors");
  expect(host.querySelector(".tooltip-adjacent-node-id").textContent).toBe("b");
  await click("Statistics");
  await act(async () => useGraphState.getState().setGraphState("graph", { data: { ...data, links: [] } }));
  expect(host.querySelector(".node-statistics").textContent).toContain("No adjacent nodes.");
  await click("Back to node");
  expect(host.querySelector(".node-statistics")).toBeNull();
  expect(host.querySelector(".tooltip-popup-body-inner > div").hidden).toBe(false);
});

test("node history survives closing and reopening without duplicate entries", async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  useGraphState.getState().setGraphState("graph", { data: { nodes: [{ id: "a" }, { id: "b" }], links: [] } });
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(<Tooltips />));
  const open = async (node) =>
    act(async () => {
      useTooltipSettings.getState().setTooltipSettings("clickTooltipData", { node, x: 30, y: 30 });
      useTooltipSettings.getState().setTooltipSettings("isClickTooltipActive", true);
    });
  const close = async () => act(async () => host.querySelector('[aria-label="Close tooltip"]').click());
  const back = () => [...host.querySelectorAll("button")].find((button) => button.textContent === "Go to previous");
  await open("a");
  expect(back()).toBeUndefined();
  await close();
  expect(host.querySelector(".tooltip-popup")).toBeNull();
  expect(useTooltipSettings.getState().tooltipSettings.clickTooltipHistory.map((entry) => entry.node)).toEqual(["a"]);
  await open("a");
  expect(back()).toBeUndefined();
  await close();
  await open("b");
  expect(back()).toBeDefined();
  await act(async () => back().click());
  expect(host.querySelector(".tooltip-popup-heading").textContent).toBe("a");
  expect(back()).toBeUndefined();
  await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  expect(host.querySelector(".tooltip-popup")).toBeNull();
  await open("b");
  expect(back()).toBeDefined();
  expect(useTooltipSettings.getState().tooltipSettings.clickTooltipHistory.map((entry) => entry.node)).toEqual(["a", "b"]);
});

test("compact focus opens details, hides them, and clears with Escape", async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  useGraphState.getState().setGraphState("graph", { data: { nodes: [{ id: "a" }, { id: "b" }], links: [] } });
  useTooltipSettings.getState().setTooltipSettings("clickTooltipData", { node: "a", x: 30, y: 30 });
  useTooltipSettings.getState().setTooltipSettings("isNodeFocusOnly", true);
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(<Tooltips />));
  const click = async (text) => act(async () => [...document.querySelectorAll("button")].find((button) => button.textContent === text).click());
  expect(document.querySelector(".tooltip-popup")).toBeNull();
  expect(document.querySelector(".node-focus-bar").textContent).toContain("Focused: a");
  // History must work even when details have never been opened.
  await act(async () => useTooltipSettings.getState().setTooltipSettings("clickTooltipData", { node: "b", x: 50, y: 50 }));
  await click("Go to previous");
  expect(useTooltipSettings.getState().tooltipSettings.clickTooltipData.node).toBe("a");
  expect(document.querySelector(".tooltip-popup")).toBeNull();
  await click("Details");
  expect(document.querySelector(".tooltip-popup")).not.toBeNull();
  expect(document.querySelector(".node-focus-bar")).not.toBeNull();
  await click("Hide details");
  expect(document.querySelector(".tooltip-popup")).toBeNull();
  // Dragging must preserve compact focus.
  await act(async () => useTooltipSettings.getState().setTooltipSettings("isClickTooltipActive", false));
  expect(useTooltipSettings.getState().tooltipSettings.isNodeFocusOnly).toBe(true);
  await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  expect(document.querySelector(".node-focus-bar")).toBeNull();
  expect(useTooltipSettings.getState().tooltipSettings.isNodeFocusOnly).toBe(false);
});

test("focus clears when its node is removed by a filter", async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  useGraphState.getState().setGraphState("graph", { data: { nodes: [{ id: "a" }], links: [] } });
  useTooltipSettings.getState().setTooltipSettings("clickTooltipData", { node: "a", x: 30, y: 30 });
  useTooltipSettings.getState().hideTooltipKeepFocus();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(<Tooltips />));
  expect(document.querySelector(".node-focus-bar")).not.toBeNull();
  await act(async () => useGraphState.getState().setGraphState("graph", { data: { nodes: [], links: [] } }));
  expect(document.querySelector(".node-focus-bar")).toBeNull();
  expect(useTooltipSettings.getState().tooltipSettings.isNodeFocusOnly).toBe(false);
});
