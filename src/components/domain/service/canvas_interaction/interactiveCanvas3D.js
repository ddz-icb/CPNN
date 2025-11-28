import * as d3 from "d3";
import { defaultCamera } from "../canvas_drawing/render3D.js";

export function initDragAndZoom3D(app, simulation, setTooltipSettings, width, height, cameraRef) {
  const state = {
    startX: 0,
    startY: 0,
    distanceDragged: 0,
    baseZ: cameraRef.current?.z ?? defaultCamera.z,
  };

  const ROT_SPEED = 0.005;

  function handleDragStart(event) {
    state.startX = event.x;
    state.startY = event.y;
    state.distanceDragged = 0;

    if (!event.active) {
      simulation.alphaTarget(0.1).restart();
    }

    setTooltipSettings("isHoverTooltipActive", false);
  }

  function handleDrag(event) {
    const dx = event.x - state.startX;
    const dy = event.y - state.startY;

    state.startX = event.x;
    state.startY = event.y;

    const camera = cameraRef.current;
    camera.rotY += dx * ROT_SPEED; // horizontal turn
    camera.rotX += dy * ROT_SPEED; // vertical turn

    state.distanceDragged += Math.sqrt(dx * dx + dy * dy);
  }

  function handleDragEnd(event) {
    if (!event.active) {
      simulation.alphaTarget(0);
    }

    if (state.distanceDragged > 10) {
      setTooltipSettings("isClickTooltipActive", false);
    }
    setTooltipSettings("isHoverTooltipActive", false);
  }

  function handleZoom(event) {
    const k = event.transform.k;
    const camera = cameraRef.current;

    camera.z = state.baseZ / k;
  }

  const dragRotate = d3.drag().on("start", handleDragStart).on("drag", handleDrag).on("end", handleDragEnd);

  const zoom = d3.zoom().on("zoom", handleZoom);

  const canvas = d3.select(app.renderer.canvas);

  canvas.call(dragRotate).call(zoom);

  canvas.call(zoom.transform, d3.zoomIdentity);
}
