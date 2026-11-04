import { afterEach, expect, test, vi } from "vitest";
import { createCapturedKeyframeScene, createPreviewNodeInformationController, createTooltipOverlayController, getRightPanelOverlayRect, getTooltipOverlayForSample } from "../../src/components/adapters/gui/sidebar/videographyScene.js";
import { useAppearance } from "../../src/components/adapters/state/appearanceState.js";
import { useColorschemeState, ibmAntiBlindness } from "../../src/components/adapters/state/colorschemeState.js";
import { useTooltipSettings } from "../../src/components/adapters/state/tooltipState.js";
import { captureCurrentView } from "../../src/components/domain/service/videography/cameraView.js";
import { createCameraKeyframe } from "../../src/components/domain/service/videography/cameraPathKeyframes.js";
import { createCameraPathTimeline } from "../../src/components/domain/service/videography/cameraPathTimeline.js";
import { createCameraPathFrameRenderer } from "../../src/components/domain/service/videography/cameraPathFrameRenderer.js";
import { renderGraphFrameToCanvas } from "../../src/components/domain/service/download/exportRender.js";
import { getCameraViewParams, projectPoint3D, setCameraEuler } from "../../src/components/domain/service/canvas_drawing/camera3D.js";
import { createRenderedCameraPathPreviewSetup, createRenderedCameraPathExportSetup } from "../../src/components/domain/service/videography/renderedCameraPathSetup.js";
import { playRenderedCameraPathPreview } from "../../src/components/domain/service/videography/cameraPathFramePlayback.js";

// Keep capture, sampling, projection and viewport transforms real; inspect the final drawing input.
vi.mock("../../src/components/domain/service/download/exportRender.js", async (importOriginal) => ({
  ...await importOriginal(), renderGraphFrameToCanvas: vi.fn(),
}));

afterEach(() => {
  for (const store of [useAppearance, useColorschemeState, useTooltipSettings]) store.setState(store.getInitialState(), true);
  vi.clearAllMocks();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

function drawingContext() {
  return { save: vi.fn(), restore: vi.fn(), fillRect: vi.fn(), translate: vi.fn(), scale: vi.fn() };
}

const container = { width: 800, height: 600 };
const outputSizes = [
  { width: 1600, height: 1200, scale: 2, offsetX: 0 },
  { width: 1920, height: 1080, scale: 1.8, offsetX: 240 },
];

test.each([
  ["2D pan and zoom", false, null],
  ["3D yaw, pitch and roll", true, { rotX: 0.45, rotY: -0.7, rotZ: 0.6 }],
  ["3D near a vertical camera angle", true, { rotX: Math.PI / 2 - 0.001, rotY: 2.9, rotZ: -0.8 }],
])("recorded %s reconstructs without offsets or angle changes", (_, threeD, rotation) => {
  const graphData = {
    nodes: [
      { id: "P1_AKT1", x: 240, y: 210, z: 80, attribs: ["Kinase"] },
      { id: "P2_MTOR", x: 510, y: 390, z: -120, attribs: [] },
      { id: "P3_MAPK1", x: 370, y: 170, z: 160, attribs: [] },
    ],
    links: [{ source: "P1_AKT1", target: "P2_MTOR", attrib: "test" }],
  };
  const camera = { x: 455, y: 265, z: -900, fov: 730 };
  if (threeD) setCameraEuler(camera, rotation);
  const appearance = {
    ...useAppearance.getState().appearance, threeD, cameraRef: { current: camera },
    linkWidth: 2.5, showNodeLabels: true, enable3DShading: false, show3DGrid: false,
  };
  useAppearance.getState().setAllAppearance(appearance);
  useColorschemeState.getState().setColorschemeState("nodeColorscheme", ibmAntiBlindness);
  useColorschemeState.getState().setColorschemeState("linkColorscheme", ibmAntiBlindness);
  const app = { stage: { x: -135, y: 82, scale: { x: 1.7 } } };
  const view = getCameraViewParams(camera, container.width, container.height);
  const expected = graphData.nodes.map((node) => threeD ? projectPoint3D(node, view) : {
    x: app.stage.x + node.x * app.stage.scale.x,
    y: app.stage.y + node.y * app.stage.scale.x,
  });
  const nodeMap = Object.fromEntries(graphData.nodes.map((node, i) => [node.id, {
    node, circle: { visible: true, x: threeD ? expected[i].x : node.x, y: threeD ? expected[i].y : node.y },
  }]));
  const keyframe = createCameraKeyframe({
    captured: captureCurrentView({ app, appearance, container }), index: 0, transitionSeconds: 1, holdSeconds: 1,
  });
  keyframe.scene = createCapturedKeyframeScene({ graphData, nodeMap, mode: keyframe.mode });
  const timeline = createCameraPathTimeline([keyframe]);

  // Moving the live graph/camera after recording must not move the saved frame.
  graphData.nodes.forEach((node) => { node.x += 5000; node.z -= 2000; });
  Object.values(nodeMap).forEach(({ circle }) => { circle.x += 9000; });
  camera.x += 1000;
  setCameraEuler(camera, { rotX: 0, rotY: 0, rotZ: 0 });
  app.stage.x = 700;

  for (const output of outputSizes) {
    const context = drawingContext();
    const renderer = createCameraPathFrameRenderer({
      app, container, outputContainer: output, graphData, nodeMap, background: "#ffffff",
      linkWidth: 9, nodeColorscheme: ["#000000"], linkColorscheme: ["#000000"],
      showNodeLabels: false, enableShading: true,
    });
    renderer.drawFrameAtTime(context, timeline, 500);
    const [, frame, style, options] = renderGraphFrameToCanvas.mock.lastCall;
    expect(context.translate).toHaveBeenCalledWith(output.offsetX, 0);
    expect(context.scale).toHaveBeenCalledWith(output.scale, output.scale);
    expect(frame.nodes).toHaveLength(expected.length);
    frame.nodes.forEach((node, i) => {
      const transform = options.transform ?? { x: 0, y: 0, k: 1 };
      const x = output.offsetX + (node.x * transform.k + transform.x) * output.scale;
      const y = (node.y * transform.k + transform.y) * output.scale;
      expect(x).toBeCloseTo(output.offsetX + expected[i].x * output.scale, 7);
      expect(y).toBeCloseTo(expected[i].y * output.scale, 7);
      if (threeD) expect(node.scale).toBeCloseTo(expected[i].scale, 7);
      expect(node.labelVisible).toBe(true);
    });
    expect(frame.links).toHaveLength(1);
    expect(frame.links[0].source).toMatchObject({ x: frame.nodes[0].x, y: frame.nodes[0].y });
    expect(frame.links[0].target).toMatchObject({ x: frame.nodes[1].x, y: frame.nodes[1].y });
    expect(style.linkWidth).toBe(2.5);
    expect(style.nodeColorscheme).toEqual(ibmAntiBlindness.data);
    expect(style.linkColorscheme).toEqual(ibmAntiBlindness.data);
    if (threeD) expect(options.enableShading).toBe(false);
  }

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(drawingContext);
  vi.spyOn(window, "devicePixelRatio", "get").mockReturnValue(2);
  const sourceCanvas = document.createElement("canvas");
  document.body.appendChild(sourceCanvas);
  app.canvas = sourceCanvas;
  const destination = createCameraKeyframe({
    captured: captureCurrentView({ app, appearance, container }), index: 1, transitionSeconds: 1, holdSeconds: 1,
  });
  destination.scene = keyframe.scene;
  const params = { app, sourceCanvas, container, graphData, nodeMap, keyframes: [keyframe, destination] };
  const preview = createRenderedCameraPathPreviewSetup(params);
  const exported = createRenderedCameraPathExportSetup(params);
  expect(preview.previewCanvas.style.position).toBe("fixed");
  expect(preview.previewCanvas.style.zIndex).toBe("2");
  expect(preview.previewCanvas.parentElement).toBe(document.body);

  for (const timeMs of [0, 1500, 3000]) {
    preview.frameRenderer.drawFrameAtTime(preview.context, preview.timeline, timeMs);
    const previewDrawing = renderGraphFrameToCanvas.mock.lastCall.slice(1);
    exported.frameRenderer.drawFrameAtTime(exported.context, exported.timeline, timeMs);
    expect(renderGraphFrameToCanvas.mock.lastCall.slice(1)).toEqual(previewDrawing);

    // Compare positions relative to each output canvas, allowing one pixel for size rounding.
    for (const node of previewDrawing[0].nodes) {
      const transform = previewDrawing[2].transform ?? { x: 0, y: 0, k: 1 };
      const positions = [preview, exported].map((setup) => {
        const canvas = setup.previewCanvas ?? setup.captureCanvas;
        const [x, y] = setup.context.translate.mock.lastCall;
        const [scale] = setup.context.scale.mock.lastCall;
        return [
          (x + (node.x * transform.k + transform.x) * scale) / canvas.width,
          (y + (node.y * transform.k + transform.y) * scale) / canvas.height,
        ];
      });
      expect(Math.abs(positions[0][0] - positions[1][0])).toBeLessThan(1 / preview.previewCanvas.width);
      expect(Math.abs(positions[0][1] - positions[1][1])).toBeLessThan(1 / preview.previewCanvas.height);
    }
  }
});

test("saved focus, highlights, graph positions and viewport interpolate in rendered video", () => {
  const makeScene = (x, width, focusNodeId, highlightedNodeIds) => ({
    viewportSnapshot: { width, height: 600 },
    graphSnapshot: {
      nodes: [{ id: "A", x, y: 300 }, { id: "B", x: x + 100, y: 300 }, { id: "C", x: x + 200, y: 300 }],
      links: [{ source: "A", target: "B" }, { source: "B", target: "C" }],
    },
    focusNodeId,
    searchSnapshot: { highlightedNodeIds, highlightedLinkIds: [] },
    appearanceSnapshot: { showNodeLabels: false, linkWidth: 2 },
  });
  const first = createCameraKeyframe({ captured: { mode: "2d", view: { centerX: 350, centerY: 300, zoom: 1 } }, index: 0, transitionSeconds: 2 });
  const second = createCameraKeyframe({ captured: { mode: "2d", view: { centerX: 450, centerY: 300, zoom: 1 } }, index: 1, transitionSeconds: 2, holdSeconds: 1 });
  first.scene = makeScene(200, 800, "A", ["A"]);
  second.scene = makeScene(400, 1000, "C", ["C"]);
  second.easing = "linear";
  const timeline = createCameraPathTimeline([first, second]);
  const context = drawingContext();
  const renderer = createCameraPathFrameRenderer({
    container: { width: 800, height: 600 },
    sceneContainer: { width: 1200, height: 600 },
    outputContainer: { width: 1200, height: 600 },
    background: "#ffffff",
  });

  renderer.drawFrameAtTime(context, timeline, 1000);
  const [, graph, style, options] = renderGraphFrameToCanvas.mock.lastCall;
  expect(graph.nodes[0].x).toBeCloseTo(300);
  expect(options.transform).toEqual({ x: 200, y: 0, k: 1 });
  expect(style.focusFromNodeId).toBe("A");
  expect(style.focusToNodeId).toBe("C");
  expect(style.focusProgress).toBeCloseTo(0.5);
  expect(style.highlightNodeAlphas).toEqual({ A: 0.5, C: 0.5 });
  expect(context.translate).toHaveBeenCalledWith(0, 0);

  renderer.drawFrameAtTime(context, timeline, 2500);
  expect(renderGraphFrameToCanvas.mock.lastCall[2].focusFromNodeId).toBe("C");
  expect(renderGraphFrameToCanvas.mock.lastCall[2].highlightNodeIds).toEqual(["C"]);
});

test("keyframes distinguish compact node focus from open node information", () => {
  const tooltipStore = useTooltipSettings.getState();
  tooltipStore.setAllTooltipSettings({
    isClickTooltipActive: false,
    isNodeFocusOnly: true,
    clickTooltipData: { node: "A", nodeAttribs: ["kinase"], x: 10, y: 20 },
  });
  const focusScene = createCapturedKeyframeScene({ graphData: { nodes: [{ id: "A", x: 10, y: 20 }], links: [] }, container });
  expect(focusScene.focusNodeId).toBe("A");
  expect(focusScene.tooltipAction).toBe("close");
  expect(focusScene.viewportSnapshot).toEqual(container);

  tooltipStore.setAllTooltipSettings({
    isClickTooltipActive: true,
    isNodeFocusOnly: false,
    clickTooltipData: { node: "A", nodeAttribs: ["kinase"], x: 10, y: 20 },
  });
  const detailsScene = createCapturedKeyframeScene({ graphData: { nodes: [{ id: "A", x: 10, y: 20 }], links: [] }, container });
  expect(detailsScene.focusNodeId).toBe("A");
  expect(detailsScene.tooltipNodeId).toBe("A");
  expect(detailsScene.tooltipAction).toBe("open");
  expect(detailsScene.tooltipSnapshot.rows[0]).toEqual({ label: "Node ID", value: "A" });
});

test("saved node details render on the right without waiting for HTML capture", () => {
  const scene = {
    tooltipAction: "open",
    tooltipNodeId: "A",
    tooltipSnapshot: { heading: "A", width: 464, rows: [{ label: "Node ID", value: "A" }] },
    themeSnapshot: { name: "light" },
  };
  const context = {
    save: vi.fn(), restore: vi.fn(), fillRect: vi.fn(), fillText: vi.fn(),
    measureText: (value) => ({ width: value.length * 8 }),
  };
  const overlay = createTooltipOverlayController();
  overlay.draw(context, { sample: { stepType: "hold", keyframe: { scene } }, sourceContainer: { width: 1920, height: 1080 } });
  expect(context.fillRect).toHaveBeenCalledWith(1456, 0, 464, 1080);
  expect(context.fillText.mock.calls.some(([value]) => value === "NODE ID")).toBe(true);
  overlay.dispose();
});

test("preview shows real node details through the transition and restores the previous sidebar state", () => {
  const originalSettings = { ...useTooltipSettings.getState().tooltipSettings, isNodeFocusOnly: true, clickTooltipData: { node: "B" } };
  useTooltipSettings.getState().setAllTooltipSettings(originalSettings);
  const from = { scene: { tooltipAction: "open", tooltipNodeId: "A", graphSnapshot: { nodes: [{ id: "A", attribs: ["kinase"] }] } } };
  const to = { scene: { tooltipAction: "close", tooltipNodeId: null } };
  const preview = createPreviewNodeInformationController();
  expect(document.body.classList.contains("tooltip-popup--videography-preview")).toBe(true);
  preview.sync({ stepType: "transition", from, to, rawT: 0.5 });
  expect(useTooltipSettings.getState().tooltipSettings).toMatchObject({
    isClickTooltipActive: true,
    isViewFocusActive: false,
    clickTooltipData: { node: "A", nodeAttribs: ["kinase"] },
  });
  preview.sync({ stepType: "transition", from, to, rawT: 1 });
  expect(useTooltipSettings.getState().tooltipSettings.isClickTooltipActive).toBe(false);
  preview.dispose();
  expect(useTooltipSettings.getState().tooltipSettings).toBe(originalSettings);
  expect(document.body.classList.contains("tooltip-popup--videography-preview")).toBe(false);
});

test("node information changes only when the destination keyframe is reached", () => {
  const from = { id: "from" };
  const to = { id: "to" };
  const overlays = new Map([["from", { nodeId: "A" }], ["to", { nodeId: "B" }]]);
  expect(getTooltipOverlayForSample({ stepType: "transition", from, to, rawT: 0.5 }, overlays)?.nodeId).toBe("A");
  expect(getTooltipOverlayForSample({ stepType: "transition", from, to, rawT: 1 }, overlays)?.nodeId).toBe("B");
  expect(getTooltipOverlayForSample({ stepType: "hold", keyframe: to }, overlays)?.nodeId).toBe("B");
  expect(getTooltipOverlayForSample({ stepType: "hold", keyframe: { id: "closed" } }, overlays)).toBeNull();
});

test("video node information fills the right edge of the frame", () => {
  const rect = getRightPanelOverlayRect({ width: 496, height: 1112, padding: 16 }, { width: 1920, height: 1080 });
  expect(rect).toEqual({ x: 1440, y: -16, width: 496, height: 1112 });
  expect(rect.x + 16 + 464).toBe(1920);
});

test("an aborted video preview stops before drawing another frame", async () => {
  const controller = new AbortController();
  controller.abort();
  const drawFrameAtTime = vi.fn();
  await expect(playRenderedCameraPathPreview({
    context: drawingContext(),
    timeline: {},
    totalMs: 1000,
    frameRenderer: { drawFrameAtTime },
    signal: controller.signal,
  })).rejects.toMatchObject({ name: "AbortError" });
  expect(drawFrameAtTime).not.toHaveBeenCalled();
});
