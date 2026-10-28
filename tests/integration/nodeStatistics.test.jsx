import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, afterEach, expect, test, vi } from "vitest";
vi.mock("3dmol/build/3Dmol.js", () => ({ createViewer: vi.fn(() => ({ clear() {}, render() {}, setBackgroundColor() {} })) }));
vi.mock("../../src/components/adapters/gui/hooks/useProteinDetails.js", () => ({
  useProteinDetails: () => ({ uniprotStatus: "done", isApiComplete: true }),
}));
vi.mock("../../src/components/domain/service/download/download.js", () => ({ downloadNodeIdsCsv: vi.fn() }));
vi.mock("../../src/components/domain/service/canvas_interaction/centerView.js", () => ({
  centerOnNodes: vi.fn(),
  clearViewOrbitCenter: vi.fn(),
  captureViewState: vi.fn(() => ({ saved: true })),
  restoreViewState: vi.fn(),
}));
vi.mock("../../src/components/adapters/gui/reusable_components/sidebarComponents.jsx", () => ({
  Button: ({ text, ...props }) => <button {...props}>{text}</button>,
}));
import { useGraphState } from "../../src/components/adapters/state/graphState.js";
import { tooltipInit, useTooltipSettings } from "../../src/components/adapters/state/tooltipState.js";
import { Tooltips } from "../../src/components/adapters/gui/tooltip/tooltips.jsx";
import { communityStateInit, useCommunityState } from "../../src/components/adapters/state/communityState.js";
import { centerOnNodes, clearViewOrbitCenter, captureViewState, restoreViewState } from "../../src/components/domain/service/canvas_interaction/centerView.js";
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
  await act(async () => root.render(<Tooltips />));
  expect(centerOnNodes).not.toHaveBeenCalled();
  const click = async (text) => act(async () => [...host.querySelectorAll("button")].find((b) => b.textContent === text).click());
  await click("Node statistics");
  expect(centerOnNodes).not.toHaveBeenCalled();
  expect(host.querySelector(".node-statistics").textContent).toContain("eats");
  expect(host.querySelector(".node-statistics").textContent).toContain("plant");
  expect(host.querySelector(".community-details")).toBeNull();
  await click("community");
  expect(host.querySelector(".tooltip-popup-heading").textContent).toBe("Community 1");
  expect(host.querySelector(".community-details").textContent).toContain("Top node attributes");
  expect(host.querySelectorAll(".community-attribute-list li")).toHaveLength(2);
  expect([...host.querySelectorAll(".community-attribute-list strong")].map((entry) => entry.textContent)).toEqual(["1 50%", "1 100%"]);
  expect(host.querySelector(".community-attribute-bar")).toBeNull();
  await click("Node statistics");
  await click("Neighbors");
  expect(host.querySelector(".tooltip-adjacent-node-id").textContent).toBe("b");
  await click("Node statistics");
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
  const close = async () => act(async () => host.querySelector('[aria-label="Collapse sidebar"]').click());
  const back = () => [...host.querySelectorAll("button")].find((button) => button.textContent === "Previous");
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

test("Focus view follows node selections only while enabled", async () => {
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
  expect(document.querySelector(".node-focus-name").textContent).toBe("a");
  expect(centerOnNodes).not.toHaveBeenCalled();
  await click("Focus view");
  expect(document.querySelector('[aria-pressed="true"]')).not.toBeNull();
  expect(captureViewState).toHaveBeenCalledTimes(1);
  expect(centerOnNodes).toHaveBeenCalledWith([{ id: "a" }], expect.objectContaining({ orbitOwner: "node" }));
  await act(async () => useTooltipSettings.getState().setTooltipSettings("clickTooltipData", { node: "b", x: 50, y: 50 }));
  expect(centerOnNodes).toHaveBeenLastCalledWith([{ id: "b" }], expect.objectContaining({ orbitOwner: "node" }));
  expect(centerOnNodes).toHaveBeenCalledTimes(2);
  expect(captureViewState).toHaveBeenCalledTimes(1);
  await click("Previous");
  expect(centerOnNodes).toHaveBeenCalledTimes(3);
  expect(useTooltipSettings.getState().tooltipSettings.clickTooltipData.node).toBe("a");
  await click("Details");
  await click("Hide details");
  expect(centerOnNodes).toHaveBeenCalledTimes(3);
  await click("Focus: on");
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)); });
  expect(clearViewOrbitCenter).toHaveBeenCalledWith(expect.objectContaining({ owner: "node" }));
  expect(restoreViewState).toHaveBeenCalledWith({ saved: true });
  await act(async () => useTooltipSettings.getState().setTooltipSettings("clickTooltipData", { node: "b", x: 50, y: 50 }));
  expect(centerOnNodes).toHaveBeenCalledTimes(3);
  await click("Focus view");
  await click("Clear");
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)); });
  expect(useTooltipSettings.getState().tooltipSettings.isViewFocusActive).toBe(false);
  expect(restoreViewState).toHaveBeenCalledTimes(2);
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
