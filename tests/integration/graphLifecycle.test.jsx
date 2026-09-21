import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Application, Container, Graphics } from "pixi.js";
import { AppearanceControl } from "../../src/components/adapters/controllers/appearanceControl.js";
import { useAppearance } from "../../src/components/adapters/state/appearanceState.js";
import { usePixiState } from "../../src/components/adapters/state/pixiState.js";
import { initDragAndZoom } from "../../src/components/domain/service/canvas_interaction/interactiveCanvas.js";
import { redraw3D } from "../../src/components/domain/service/canvas_drawing/render3D.js";
import { calculateLinkWidth } from "../../src/components/domain/service/canvas_drawing/lineGraphics.js";
import { useGraphSetup } from "../../src/components/adapters/controllers/useGraphSetup.js";
import { FilterControl } from "../../src/components/adapters/controllers/filterControl.js";
import { PhysicsControl } from "../../src/components/adapters/controllers/physicsControl.js";
import { RenderControl } from "../../src/components/adapters/controllers/renderControl.jsx";
import { useRenderState } from "../../src/components/adapters/state/canvasState.js";
import { useFilter } from "../../src/components/adapters/state/filterState.js";
import { useColorschemeState, ibmAntiBlindness } from "../../src/components/adapters/state/colorschemeState.js";
import { graphService } from "../../src/components/application/services/graphService.js";
import { mappingService } from "../../src/components/application/services/mappingService.js";
import { errorService } from "../../src/components/application/services/errorService.js";
import * as graphRepo from "../../src/components/repository/graphRepo.js";
import * as mappingRepo from "../../src/components/repository/mappingRepo.js";
import * as simulation from "../../src/components/domain/service/physics_calculations/simulation.js";
import { setupStage } from "../../src/components/domain/service/canvas_drawing/stageSetup.js";
import { redraw } from "../../src/components/domain/service/canvas_drawing/render2D.js";
import { defaultExampleGraphName } from "../../src/assets/exampleGraphMetadata.js";
import log from "../../src/components/adapters/logging/logger.js";
import { nodeIds } from "../support/graphFixtures.js";

vi.mock("pixi.js", async (importOriginal) => ({
  ...await importOriginal(),
  Application: vi.fn(function () {
    this.init = vi.fn().mockResolvedValue(undefined);
    this.canvas = document.createElement("canvas");
    this.stage = { removeChildren: vi.fn() };
    this.renderer = { type: "test" };
  }),
}));
vi.mock("../../src/components/domain/service/canvas_drawing/stageSetup.js", () => ({
  setupStage: vi.fn(({ graph }) => {
    const nodeContainers = new Container();
    const nodeMap = Object.fromEntries(graph.data.nodes.map((node) => {
      const circle = new Container();
      const nodeLabel = new Container();
      nodeContainers.addChild(circle, nodeLabel);
      return [node.id, { node, circle, nodeLabel }];
    }));
    const lines2D = new Graphics();
    return { nodeContainers, nodeMap, lines: lines2D, lines2D, lines3D: [], grid3D: new Graphics() };
  }),
}));
vi.mock("../../src/components/domain/service/canvas_drawing/nodes.js", () => ({
  radius: 10, syncNodeMapWithGraphData: vi.fn(), filterActiveNodesForPixi: vi.fn(),
  changeCircleBorderColor: vi.fn(), changeNodeColors: vi.fn(), changeNodeLabelColor: vi.fn(),
}));
vi.mock("../../src/components/domain/service/canvas_interaction/interactiveCanvas.js", () => ({
  handleResize: vi.fn(), initDragAndZoom: vi.fn(),
}));
vi.mock("../../src/components/domain/service/canvas_drawing/render2D.js", () => ({ redraw: vi.fn() }));
vi.mock("../../src/components/domain/service/canvas_drawing/render3D.js", () => ({ redraw3D: vi.fn() }));

const stateModules = import.meta.glob("../../src/components/adapters/state/*.js", { eager: true });
const stores = Object.values(stateModules).flatMap(Object.values).filter((value) => value?.getInitialState);
const getSimulation = simulation.getSimulation;
const createApplication = Application.getMockImplementation();
const mountSimulation = simulation.mountSimulation;
const readyAtMount = [];
let root, host;

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function savedGraph(name, ids) {
  return { name, data: {
    nodes: ids.map((id) => ({ id, attribs: [] })),
    links: [{ source: ids[0], target: ids[1], weight: 0.9, attrib: "test" }],
  } };
}
const graphs = { A: savedGraph("A", ["A1_AKT1", "A2_MAPK1"]), B: savedGraph("B", ["B1_MTOR", "B2_EGFR"]) };

function Controllers() {
  useGraphSetup();
  return <><AppearanceControl /><FilterControl /><PhysicsControl /><RenderControl /></>;
}

beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  stores.forEach((store) => store.setState(store.getInitialState(), true));
  vi.clearAllMocks();
  readyAtMount.length = 0;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 800, height: 600 });
  vi.spyOn(graphRepo, "getGraphDB").mockImplementation(async (name) => structuredClone(graphs[name]));
  vi.spyOn(mappingRepo, "getMappingDB").mockImplementation(async (name) => ({
    name, data: { A1_AKT1: { attribs: [name] } },
  }));
  // Keep real forces and mounting; only stop the background animation timer.
  vi.spyOn(simulation, "getSimulation").mockImplementation((...args) => {
    const result = getSimulation(...args).stop();
    vi.spyOn(result, "restart").mockReturnValue(result);
    vi.spyOn(result, "stop");
    return result;
  });
  vi.spyOn(simulation, "mountSimulation").mockImplementation((...args) => {
    readyAtMount.push(graphService.getGraphIsPreprocessed() && graphService.getFilteredAfterStart());
    return mountSimulation(...args);
  });
  useColorschemeState.getState().setColorschemeState("nodeColorscheme", ibmAntiBlindness);
  useColorschemeState.getState().setColorschemeState("linkColorscheme", ibmAntiBlindness);
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(<Controllers />));
});

afterEach(async () => {
  await act(async () => root?.unmount());
  host.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

async function update(action) {
  const previousDraws = redraw.mock.calls.length + redraw3D.mock.calls.length;
  await act(action);
  await act(async () => {
    await vi.dynamicImportSettled();
    await vi.advanceTimersByTimeAsync(100);
  });
  expect(errorService.getError()).toBeNull();
  expect(redraw.mock.calls.length + redraw3D.mock.calls.length).toBeGreaterThan(previousDraws);
  expect(graphService.getFilteredAfterStart()).toBe(true);
  expect(readyAtMount).not.toContain(false);
  expect(setupStage.mock.invocationCallOrder.at(-1)).toBeLessThan(simulation.mountSimulation.mock.invocationCallOrder.at(-1));
  const graph = graphService.getGraph();
  const currentSimulation = useRenderState.getState().renderState.simulation;
  expect(currentSimulation.nodes()).toBe(graph.data.nodes);
  expect(currentSimulation.force("link").links()).toBe(graph.data.links);
  expect(simulation.mountSimulation.mock.lastCall[1]).toBe(graph.data);
  return graph;
}

test("switching 2D to 3D and back replaces the simulation and restores the display", async () => {
  await update(() => graphService.handleSelectGraph("A"));
  for (const threeD of [true, false]) {
    if (!threeD) for (const { circle, nodeLabel } of Object.values(usePixiState.getState().pixiState.nodeMap)) {
      circle.scale.set(0.5);
      circle.tint = 0x888888;
      circle.visible = nodeLabel.visible = false;
      circle.__hiddenByProjection = nodeLabel.__hiddenByProjection = true;
    }
    const previous = useRenderState.getState().renderState.simulation;
    previous.stop.mockClear();
    const draw = threeD ? redraw3D : redraw;
    const previousDraws = draw.mock.calls.length;

    const graph = await update(async () => useAppearance.getState().setAppearance("threeD", threeD));

    expect(previous.stop).toHaveBeenCalled();
    expect(useRenderState.getState().renderState.simulation).not.toBe(previous);
    expect(draw.mock.calls.length).toBeGreaterThan(previousDraws);
    const { lines, lines2D, lines3D, nodeMap } = usePixiState.getState().pixiState;
    expect(lines).toBe(threeD ? lines3D : lines2D);
    expect(lines2D.visible).toBe(!threeD);
    expect(Application).toHaveBeenCalledTimes(1);
    if (threeD) expect(graph.data.nodes.every((node) => Number.isFinite(node.z))).toBe(true);
    else for (const { circle, nodeLabel } of Object.values(nodeMap)) {
      expect(circle.scale.x).toBe(1);
      expect(circle.tint).toBe(0xffffff);
      expect(circle.sphereShading.highlight.visible).toBe(false);
      expect(circle.visible).toBe(true);
      expect(nodeLabel.visible).toBe(true);
      expect(usePixiState.getState().pixiState.grid3D.visible).toBe(false);
    }
  }
});

test("3D shading, grid and field of view update without replacing the simulation", async () => {
  await update(() => graphService.handleSelectGraph("A"));
  await update(async () => useAppearance.getState().setAppearance("threeD", true));
  const previous = useRenderState.getState().renderState.simulation;
  const { setAppearance } = useAppearance.getState();
  const { nodeMap, grid3D } = usePixiState.getState().pixiState;

  for (const enabled of [false, true]) {
    await act(async () => { setAppearance("enable3DShading", enabled); setAppearance("show3DGrid", enabled); });
    expect(grid3D.visible).toBe(enabled);
    for (const { circle } of Object.values(nodeMap)) {
      expect(circle.sphereShading.highlight.visible).toBe(enabled);
      expect(circle.sphereShading.shadow.visible).toBe(enabled);
    }
  }
  const draws = redraw3D.mock.calls.length;
  await act(async () => setAppearance("threeDFov", 700));
  expect(useAppearance.getState().appearance.cameraRef.current.fov).toBe(700);
  expect(redraw3D.mock.calls.length).toBeGreaterThan(draws);
  expect(useRenderState.getState().renderState.simulation).toBe(previous);
  expect(errorService.getError()).toBeNull();
});

test("automatic link width follows the filtered graph rather than the original", async () => {
  const nodes = Array.from({ length: 201 }, (_, i) => ({ id: `P${i}_NODE${i}`, attribs: [] }));
  const links = nodes.slice(1).map((node, i) => ({ source: nodes[i].id, target: node.id, weight: 0.9, attrib: "test" }));
  vi.mocked(graphRepo.getGraphDB).mockResolvedValue({ name: "A", data: { nodes, links } });
  await update(() => graphService.handleSelectGraph("A"));
  const originalWidth = useAppearance.getState().appearance.linkWidth;
  expect(originalWidth).toBe(calculateLinkWidth(links.length));

  const filtered = await update(async () => useFilter.getState().setFilter("minLinkThreshold", 0.95));

  expect(filtered.data.links).toHaveLength(0);
  expect(useAppearance.getState().appearance.linkWidth).toBe(calculateLinkWidth(0));
  expect(useAppearance.getState().appearance.linkWidth).not.toBe(originalWidth);
});

test("node labels toggle and manual link width survives graph changes", async () => {
  await update(() => graphService.handleSelectGraph("A"));
  const { setAppearance } = useAppearance.getState();
  for (const visible of [false, true]) {
    await act(async () => setAppearance("showNodeLabels", visible));
    const { nodeMap } = usePixiState.getState().pixiState;
    expect(Object.values(nodeMap).every(({ nodeLabel }) => nodeLabel.visible === visible)).toBe(true);
  }
  await act(async () => { setAppearance("linkWidthManuallySet", true); setAppearance("linkWidth", 2.5); });
  expect(redraw.mock.lastCall[2]).toBe(2.5);
  await update(() => graphService.handleSelectGraph("B"));
  expect(useAppearance.getState().appearance.linkWidth).toBe(2.5);
  expect(redraw.mock.lastCall[2]).toBe(2.5);
});

test("3D camera control settings reach the active interaction handlers", async () => {
  await update(() => graphService.handleSelectGraph("A"));
  await update(async () => useAppearance.getState().setAppearance("threeD", true));
  const controls = initDragAndZoom.mock.lastCall.at(-1);
  const values = { OrbitSensitivity: 2, PanSensitivity: 0.5, ZoomSensitivity: 1.5, Inertia: false, InertiaDamping: 0.8, InvertVertical: true };
  await act(async () => {
    for (const [key, value] of Object.entries(values)) useAppearance.getState().setAppearance(`threeD${key}`, value);
  });
  expect(controls.current).toMatchObject({
    orbitSensitivity: 2, panSensitivity: 0.5, zoomSensitivity: 1.5,
    inertia: false, inertiaDamping: 0.8, invertVertical: true,
  });
});

test("loads settings and stage before mounting the filtered graph", async () => {
  let finishInit;
  Application.mockImplementationOnce(function () {
    createApplication.call(this);
    this.init.mockImplementation(() => new Promise((resolve) => { finishInit = resolve; }));
  });
  const record = structuredClone(graphs.A);
  record.data.physics = { linkLength: 123 };
  record.data.filter = { minLinkThreshold: 0.95 };
  vi.mocked(graphRepo.getGraphDB).mockResolvedValue(record);

  await act(() => graphService.handleSelectGraph("A"));
  expect(setupStage).not.toHaveBeenCalled();
  expect(simulation.getSimulation).not.toHaveBeenCalled();
  const graph = await update(async () => finishInit());

  expect(graph.data.links).toHaveLength(0);
  expect(simulation.getSimulation.mock.lastCall[0]).toBe(123);
  expect(Application.mock.invocationCallOrder[0]).toBeLessThan(setupStage.mock.invocationCallOrder[0]);
  expect(setupStage.mock.invocationCallOrder[0]).toBeLessThan(simulation.mountSimulation.mock.invocationCallOrder[0]);
});

test.each([
  ["replacing a graph", ["A"], () => graphService.handleSelectGraph("B"), ["B1_MTOR", "B2_EGFR"]],
  ["adding a graph", ["A"], () => graphService.handleAddActiveGraph("B"), ["A1_AKT1", "A2_MAPK1", "B1_MTOR", "B2_EGFR"]],
  ["removing one of multiple graphs", ["A", "B"], () => graphService.handleRemoveActiveGraph("A"), ["B1_MTOR", "B2_EGFR"]],
])("%s stops the old simulation and reuses Pixi", async (_, initial, action, expectedIds) => {
  await update(async () => graphService.setActiveGraphNames(initial));
  const previous = useRenderState.getState().renderState.simulation;
  previous.stop.mockClear();
  const cancelDraw = vi.spyOn(previous, "__cancelDraw");

  const graph = await update(action);

  expect(nodeIds(graph.data).sort()).toEqual(expectedIds);
  expect(previous.stop).toHaveBeenCalled();
  expect(cancelDraw).toHaveBeenCalled();
  expect(previous.stop.mock.invocationCallOrder[0]).toBeLessThan(simulation.mountSimulation.mock.invocationCallOrder.at(-1));
  expect(useRenderState.getState().renderState.simulation).not.toBe(previous);
  expect(Application).toHaveBeenCalledTimes(1);
});

test("removing the only graph renders the default example", async () => {
  await update(() => graphService.handleSelectGraph("A"));
  const graph = await update(() => graphService.handleRemoveActiveGraph("A"));
  expect(graph.name).toBe(defaultExampleGraphName);
  expect(graph.data.nodes.length).toBeGreaterThan(0);
});

test("loading, replacing and removing a mapping updates the rendered attributes", async () => {
  await update(() => graphService.handleSelectGraph("A"));
  for (const name of ["Kinase", "Phosphatase", null]) {
    const graph = await update(() => name
      ? mappingService.handleSelectMapping(name)
      : mappingService.handleRemoveMapping());
    expect(graph.data.nodes.find((node) => node.id === "A1_AKT1").attribs).toEqual(name ? [name] : []);
    expect(Application).toHaveBeenCalledTimes(1);
  }
});

test("case-insensitive field mappings add attributes and removal preserves original attributes", async () => {
  const record = structuredClone(graphs.A);
  record.data.nodes[0].attribs = ["Original"];
  vi.mocked(graphRepo.getGraphDB).mockImplementation(async () => structuredClone(record));
  vi.mocked(mappingRepo.getMappingDB).mockResolvedValue({ name: "Protein IDs", data: { a1: { attribs: ["Kinase"] } } });
  await update(() => graphService.handleSelectGraph("A"));
  const mapped = await update(() => mappingService.handleSelectMapping("Protein IDs"));
  expect(mapped.data.nodes[0].attribs).toEqual(["Original", "Kinase"]);
  expect(mapped.data.nodes[1].attribs).toEqual([]);
  const removed = await update(() => mappingService.handleRemoveMapping());
  expect(removed.data.nodes[0].attribs).toEqual(["Original"]);
});

test("filtering everything out and restoring it reuses the running simulation", async () => {
  await update(() => graphService.handleSelectGraph("A"));
  const previous = useRenderState.getState().renderState.simulation;
  const graph = await update(async () => useFilter.getState().setFilter("minLinkThreshold", 0.95));
  expect(graph.data.links).toHaveLength(0);
  expect(graph.data.nodes).toHaveLength(0);
  expect(useRenderState.getState().renderState.simulation).toBe(previous);

  const restored = await update(async () => useFilter.getState().setFilter("minLinkThreshold", 0.7));
  expect(nodeIds(restored.data)).toEqual(nodeIds(graphs.A.data));
  expect(restored.data.links).toHaveLength(1);
  expect(useRenderState.getState().renderState.simulation).toBe(previous);
  expect(Application).toHaveBeenCalledTimes(1);
});

test.each(["resolve", "reject"])("a stale graph load cannot overwrite the latest graph or error (%s)", async (outcome) => {
  const pending = deferred();
  vi.mocked(graphRepo.getGraphDB).mockReturnValueOnce(pending.promise);
  await act(() => graphService.handleSelectGraph("A"));
  await update(() => graphService.handleSelectGraph("B"));
  const draws = redraw.mock.calls.length;

  await act(async () => pending[outcome](outcome === "resolve" ? structuredClone(graphs.A) : new Error("Stale failure")));

  expect(errorService.getError()).toBeNull();
  expect(graphService.getOriginGraph().name).toBe("B");
  expect(graphService.getGraph().name).toBe("B");
  expect(redraw).toHaveBeenCalledTimes(draws);
});

test("a failed load preserves the current graph and a subsequent load recovers", async () => {
  const graph = await update(() => graphService.handleSelectGraph("A"));
  const previous = useRenderState.getState().renderState.simulation;
  const draws = redraw.mock.calls.length;
  vi.spyOn(log, "error").mockImplementation(() => {});
  vi.mocked(graphRepo.getGraphDB).mockRejectedValueOnce(new Error("Cannot read graph"));

  await act(() => graphService.handleSelectGraph("B"));

  expect(errorService.getError()).toBe("Cannot read graph");
  expect(graphService.getGraph()).toBe(graph);
  expect(useRenderState.getState().renderState.simulation).toBe(previous);
  expect(redraw).toHaveBeenCalledTimes(draws);

  const recovered = await update(() => graphService.handleSelectGraph("B"));
  expect(nodeIds(recovered.data)).toEqual(nodeIds(graphs.B.data));
  expect(Application).toHaveBeenCalledTimes(1);
});

test("changing the mapping during a pending graph load keeps the latest mapping", async () => {
  const pending = deferred();
  vi.mocked(graphRepo.getGraphDB).mockReturnValueOnce(pending.promise);
  await act(() => graphService.handleSelectGraph("A"));
  const mapped = await update(() => mappingService.handleSelectMapping("Kinase"));
  expect(mapped.data.nodes.find((node) => node.id === "A1_AKT1").attribs).toEqual(["Kinase"]);
  const draws = redraw.mock.calls.length;

  await act(async () => pending.resolve(structuredClone(graphs.A)));

  expect(graphService.getGraph()).toBe(mapped);
  expect(redraw).toHaveBeenCalledTimes(draws);
  expect(errorService.getError()).toBeNull();
});

test.each(["resolve", "reject"])("a pending load has no effects after unmount (%s)", async (outcome) => {
  const pending = deferred();
  vi.mocked(graphRepo.getGraphDB).mockReturnValueOnce(pending.promise);
  await act(() => graphService.handleSelectGraph("A"));
  await act(async () => root.unmount());
  root = null;

  await act(async () => pending[outcome](outcome === "resolve" ? structuredClone(graphs.A) : new Error("Late failure")));

  expect(graphService.getOriginGraph()).toBeNull();
  expect(graphService.getGraph()).toBeNull();
  expect(errorService.getError()).toBeNull();
  expect(Application).not.toHaveBeenCalled();
  expect(simulation.getSimulation).not.toHaveBeenCalled();
});

test("unmounting cancels drawing and stops the simulation", async () => {
  await update(() => graphService.handleSelectGraph("A"));
  const current = useRenderState.getState().renderState.simulation;
  current.stop.mockClear();
  const cancelDraw = vi.spyOn(current, "__cancelDraw");

  await act(async () => root.unmount());
  root = null;

  expect(cancelDraw).toHaveBeenCalled();
  expect(current.stop).toHaveBeenCalled();
});
