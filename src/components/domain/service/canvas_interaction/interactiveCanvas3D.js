import * as d3 from "d3";

export function initDragAndRotate3D(app, simulation, setTooltipSettings, width, height, cameraRef) {
  const state = {
    startX: 0,
    startY: 0,
    distanceDragged: 0,
  };

  const ROT_SPEED = 0.005;
  const BASE_Z = cameraRef.current.z || -800;
  const MIN_Z = -2000;
  const MAX_Z = -200;

  // --- Drag: Kamera rotieren ---
  const dragRotate = d3.drag()
    .on("start", (event) => {
      state.startX = event.x;
      state.startY = event.y;
      state.distanceDragged = 0;

      if (!event.active) simulation.alphaTarget(0.1).restart();
      setTooltipSettings("isHoverTooltipActive", false);
    })
    .on("drag", (event) => {
      const dx = event.x - state.startX;
      const dy = event.y - state.startY;
      state.startX = event.x;
      state.startY = event.y;

      const camera = cameraRef.current;
      camera.rotY += dx * ROT_SPEED;  // horizontaler Drag
      camera.rotX += dy * ROT_SPEED;  // vertikaler Drag

      state.distanceDragged += Math.sqrt(dx*dx + dy*dy);
      // kein direktes Render hier – redraw3D läuft über d3-force tick
    })
    .on("end", (event) => {
      if (!event.active) simulation.alphaTarget(0);
      if (state.distanceDragged > 10) {
        setTooltipSettings("isClickTooltipActive", false);
      }
      setTooltipSettings("isHoverTooltipActive", false);
    });

  // --- Zoom: Kamera z verschieben ---
  const zoom = d3.zoom()
    .on("zoom", (event) => {
      const k = event.transform.k;
      const camera = cameraRef.current;

      // k=1 → BASE_Z, k>1 näher ran, k<1 weiter weg
      const z = BASE_Z / k;
      camera.z = Math.max(MIN_Z, Math.min(MAX_Z, z));

      // Bühne bleibt zentriert und unskaliert
      app.stage.x = 0;
      app.stage.y = 0;
      app.stage.scale.set(1);
    });

  const canvas = d3.select(app.renderer.canvas);

  canvas
    .call(dragRotate)
    .call(zoom);

  canvas.call(zoom.transform, d3.zoomIdentity);
}