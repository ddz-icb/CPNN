import { afterEach, expect, test, vi } from "vitest";
import { createCapturedKeyframeScene } from "../../src/components/adapters/gui/sidebar/videographyScene.js";
import { useAppearance } from "../../src/components/adapters/state/appearanceState.js";
import { useColorschemeState, ibmAntiBlindness } from "../../src/components/adapters/state/colorschemeState.js";
import { captureCurrentView } from "../../src/components/domain/service/videography/cameraView.js";
import { createCameraKeyframe } from "../../src/components/domain/service/videography/cameraPathKeyframes.js";
import { createCameraPathTimeline } from "../../src/components/domain/service/videography/cameraPathTimeline.js";
import { createCameraPathFrameRenderer } from "../../src/components/domain/service/videography/cameraPathFrameRenderer.js";
import { renderGraphFrameToCanvas } from "../../src/components/domain/service/download/exportRender.js";
import { getCameraViewParams, projectPoint3D, setCameraEuler } from "../../src/components/domain/service/canvas_drawing/camera3D.js";
import { createRenderedCameraPathPreviewSetup, createRenderedCameraPathExportSetup } from "../../src/components/domain/service/videography/renderedCameraPathSetup.js";

// Keep capture, sampling, projection and viewport transforms real; inspect the final drawing input.
vi.mock("../../src/components/domain/service/download/exportRender.js", async (importOriginal) => ({
  ...await importOriginal(), renderGraphFrameToCanvas: vi.fn(),
}));

afterEach(() => {
  for (const store of [useAppearance, useColorschemeState]) store.setState(store.getInitialState(), true);
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
