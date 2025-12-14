import * as d3 from "d3";
import { defaultCamera } from "../canvas_drawing/render3D.js";

export function initDragAndZoom3D(app, simulation, setTooltipSettings, width, height, cameraRef) {
  const state = {
    startX: 0,
    startY: 0,
    distanceDragged: 0,
    baseZ: cameraRef.current?.z ?? defaultCamera.z,
    isNodeDrag: false,
    dragNode: null,
  };

  const ROT_SPEED = 0.005;
  const ZOOM_DEPTH_UNIT = Math.abs(state.baseZ || defaultCamera.z || 600);
  const DRAG_HIT_RADIUS = 20;

  function findNodeAtPointer(event) {
    const projections = cameraRef.current?.projections;
    if (!projections) return null;

    const nodes = typeof simulation.nodes === "function" ? simulation.nodes() : simulation.nodes;
    if (!Array.isArray(nodes)) return null;

    let closest = null;
    let closestDist = Infinity;
    for (const node of nodes) {
      const proj = projections[node.id];
      if (!proj) continue;
      const dx = event.x - proj.x;
      const dy = event.y - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = node;
      }
    }

    return closestDist <= DRAG_HIT_RADIUS ? closest : null;
  }

  function handleDragStart(event) {
    const node = findNodeAtPointer(event);
    state.isNodeDrag = !!node;
    state.dragNode = node;
    state.distanceDragged = 0;

    if (state.isNodeDrag) {
      state.dragNode.fx = state.dragNode.x;
      state.dragNode.fy = state.dragNode.y;
      state.dragNode.fz = state.dragNode.z;
      if (!event.active) {
        simulation.alphaTarget(0.3).restart();
      }
      setTooltipSettings("isHoverTooltipActive", false);
      return;
    }

    state.startX = event.x;
    state.startY = event.y;

    if (!event.active) {
      simulation.alphaTarget(0.1).restart();
    }

    setTooltipSettings("isHoverTooltipActive", false);
  }

  function handleDrag(event) {
    if (state.isNodeDrag && state.dragNode) {
      const projection = cameraRef.current?.projections?.[state.dragNode.id];
      const scale = projection?.scale ?? 1;

      // convert screen-plane drag into world space respecting current camera rotation
      const rotX = cameraRef.current?.rotX ?? 0;
      const rotY = cameraRef.current?.rotY ?? 0;
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      const dxPlane = event.dx / scale;
      const dyPlane = event.dy / scale;

      // inverse rotation order: undo X, then Y (mirror of rotateNode)
      const yAfterInvX = dyPlane * cosX; // z component is zero in plane
      const zAfterInvX = -dyPlane * sinX;
      const xAfterInvX = dxPlane;

      const worldDx = xAfterInvX * cosY + zAfterInvX * sinY;
      const worldDz = -xAfterInvX * sinY + zAfterInvX * cosY;
      const worldDy = yAfterInvX;

      state.dragNode.fx += worldDx;
      state.dragNode.fy += worldDy;
      state.dragNode.fz += worldDz;

      state.distanceDragged += Math.sqrt(event.dx * event.dx + event.dy * event.dy);
      return;
    }

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
    if (state.isNodeDrag && state.dragNode) {
      if (!event.active) {
        simulation.alphaTarget(0);
      }
      state.dragNode.fx = null;
      state.dragNode.fy = null;
      state.dragNode.fz = null;

      if (state.distanceDragged > 10) {
        setTooltipSettings("isClickTooltipActive", false);
      }
      setTooltipSettings("isHoverTooltipActive", false);
      state.isNodeDrag = false;
      state.dragNode = null;
      return;
    }

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

    camera?.redraw?.();
  }

  const dragRotate = d3.drag().on("start", handleDragStart).on("drag", handleDrag).on("end", handleDragEnd);

  const zoom = d3.zoom().on("zoom", handleZoom);

  const canvas = d3.select(app.renderer.canvas);

  canvas.call(dragRotate).call(zoom);

  canvas.call(zoom.transform, d3.zoomIdentity);
}
