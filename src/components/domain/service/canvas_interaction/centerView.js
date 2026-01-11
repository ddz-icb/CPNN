import * as d3 from "d3";
import { rotateCameraToNode } from "./camera3D.js";

export function centerOnNode(node, { appearance, renderState, container }) {
  if (!node || !container?.width || !container?.height) return;
  if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

  if (appearance?.threeD) {
    const camera = appearance?.cameraRef?.current;
    if (!camera) return;

    rotateCameraToNode(node, camera, container);
    camera.redraw?.();
    return;
  }

  const app = renderState?.app;
  if (!app?.stage || !app?.renderer) return;

  const scale = app.stage.scale?.x ?? 1;
  const safeScale = scale || 1;
  const centerX = container.width / 2;
  const centerY = container.height / 2;
  const tx = centerX - node.x * safeScale;
  const ty = centerY - node.y * safeScale;

  const zoom = app.__zoomBehavior;
  const selection = app.__zoomSelection;
  if (zoom && selection) {
    const transform = d3.zoomIdentity.translate(tx / safeScale, ty / safeScale).scale(safeScale);
    selection.call(zoom.transform, transform);
    return;
  }

  app.stage.x = tx;
  app.stage.y = ty;
  app.renderer.render(app.stage);
}
