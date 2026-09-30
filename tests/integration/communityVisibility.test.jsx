import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { CommunitySidebar } from "../../src/components/adapters/gui/sidebar/communitySidebar.jsx";
import { FilterControl } from "../../src/components/adapters/controllers/filterControl.js";
import { useFilter } from "../../src/components/adapters/state/filterState.js";
import { useGraphState } from "../../src/components/adapters/state/graphState.js";
import { useGraphFlags } from "../../src/components/adapters/state/graphFlagsState.js";
import { usePixiState } from "../../src/components/adapters/state/pixiState.js";
import { useCommunityState } from "../../src/components/adapters/state/communityState.js";
import { filterActiveNodesForPixi } from "../../src/components/domain/service/canvas_drawing/nodes.js";

// Keep the real sidebar, stores, controller and filter pipeline; no canvas is needed.
vi.mock("../../src/components/domain/service/canvas_drawing/nodes.js", () => ({
  radius: 10, syncNodeMapWithGraphData: vi.fn(), filterActiveNodesForPixi: vi.fn(),
}));
const stateModules = import.meta.glob("../../src/components/adapters/state/*.js", { eager: true });
const stores = Object.values(stateModules).flatMap(Object.values).filter((value) => value?.getInitialState);
const original = {
  nodes: ["a", "b", "c", "d", "e", "f"].map((id) => ({ id, attribs: [] })),
  links: [["a", "b"], ["c", "d"], ["e", "f"]].map(([source, target]) => ({ source, target, attrib: "test", weight: 1 })),
};
let root, host;
const data = () => useGraphState.getState().graphState.graph.data;
const nodeIds = () => data().nodes.map((node) => node.id).sort();
const rows = () => [...host.querySelectorAll("tr.item-table-entry-highlight")];
const action = (index, label) => rows()[index].querySelector(`[data-tooltip-content="${label}"]`);
async function flushFilters() { await act(async () => vi.advanceTimersByTime(100)); }
async function click(index, label) {
  const control = action(index, label);
  expect(control, `Row ${index}: ${label}`).not.toBeNull();
  await act(async () => control.click());
  await flushFilters();
}
function expectGraph(ids, links) {
  expect(nodeIds()).toEqual(ids);
  expect(data().links).toHaveLength(links);
  const visible = new Set(ids);
  expect(data().links.every((link) => visible.has(link.source) && visible.has(link.target))).toBe(true);
  expect(filterActiveNodesForPixi).toHaveBeenLastCalledWith(expect.anything(), data(), expect.anything());
  expect(useGraphState.getState().graphState.originGraph.data).toEqual(original);
}
beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  stores.forEach((store) => store.setState(store.getInitialState(), true));
  vi.clearAllMocks();
  const graph = { name: "community-test", data: structuredClone(original) };
  useGraphState.getState().setAllGraphState({ graph, originGraph: structuredClone(graph) });
  useGraphFlags.getState().setGraphFlags("isPreprocessed", true);
  useCommunityState.getState().setCommunityState("communityResolution", 0);
  useFilter.getState().setFilter("minLinkThreshold", 0);
  usePixiState.getState().setPixiState("nodeContainers", { children: [{}] });
  usePixiState.getState().setPixiState("nodeMap", {});
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
  await act(async () => root.render(<><FilterControl /><CommunitySidebar /></>));
  await flushFilters();
});
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  vi.useRealTimers();
  stores.forEach((store) => store.setState(store.getInitialState(), true));
});

test("hiding and showing a community removes and restores its nodes and links", async () => {
  expect(rows()).toHaveLength(3);
  const community = useCommunityState.getState().communityState.communities[0];
  const hiddenNodes = useCommunityState.getState().communityState.communityToNodeIds[community.id];
  await click(0, "Hide community");
  expectGraph(original.nodes.map((n) => n.id).filter((id) => !hiddenNodes.includes(id)), 2);
  expect(rows()).toHaveLength(3);
  expect(action(0, "Show community").querySelector(".icon-muted")).not.toBeNull();
  expect(useCommunityState.getState().communityState.selectedCommunityId).toBeNull();
  await click(0, "Show community");
  expectGraph(["a", "b", "c", "d", "e", "f"], 3);
  expect(action(0, "Hide community").querySelector(".icon-muted")).toBeNull();
  expect(useFilter.getState().filter.communityHiddenIds).toEqual([]);
});

test("isolating a hidden community shows it, and Revert restores all communities", async () => {
  const community = useCommunityState.getState().communityState.communities[1];
  const isolatedNodes = useCommunityState.getState().communityState.communityToNodeIds[community.id].slice().sort();
  await click(1, "Hide community");
  await click(1, "Show only this community");
  expectGraph(isolatedNodes, 1);
  expect(action(1, "Revert")).not.toBeNull();
  expect(host.querySelectorAll('[data-tooltip-content="Show community"]')).toHaveLength(2);
  await click(1, "Revert");
  expectGraph(["a", "b", "c", "d", "e", "f"], 3);
  expect(useFilter.getState().filter.communityHiddenIds).toEqual([]);
});

test("all communities can be hidden and individually restored from the empty graph", async () => {
  for (let i = 0; i < 3; i++) await click(i, "Hide community");
  expectGraph([], 0);
  expect(rows()).toHaveLength(3);
  expect(host.querySelectorAll('[data-tooltip-content="Show community"]')).toHaveLength(3);
  for (let i = 0; i < 3; i++) await click(i, "Show community");
  expectGraph(["a", "b", "c", "d", "e", "f"], 3);
});
