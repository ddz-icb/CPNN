import { throttle } from "lodash";
import * as d3 from "d3";

export const handleResize = throttle((containerRef, app) => {
  if (app?.renderer && containerRef && containerRef.current) {
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    app.renderer.resize(width, height);
  }
}, 250);

export function initDragAndZoom(app, simulation, radius, setTooltipSettings, width, height) {
  let state = {
    transform: d3.zoomIdentity.scale(0.95).translate((width / 2) * (1 - 0.95), (height / 2) * (1 - 0.95)),
    distanceDragged: 0,
    startPosition: { x: 0, y: 0 },
  };

  const zoomed = (event) => {
    state.transform = event.transform;

    app.stage.x = state.transform.x;
    app.stage.y = state.transform.y;
    app.stage.scale.x = state.transform.k;
    app.stage.scale.y = state.transform.k;

    app.renderer.render(app.stage);
  };

  const dragsubject = (event) => {
    return simulation.find(state.transform.invertX(event.x), state.transform.invertY(event.y), radius);
  };

  const dragstarted = (event) => {
    if (!event.active) simulation.alphaTarget(0.3).restart();

    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;

    state.startPosition = { x: event.subject.x, y: event.subject.y };
    state.distanceDragged = 0;

    setTooltipSettings("isHoverTooltipActive", false);
  };

  const dragged = (event) => {
    event.subject.fx += event.dx / state.transform.k;
    event.subject.fy += event.dy / state.transform.k;

    const dx = event.subject.fx - state.startPosition.x;
    const dy = event.subject.fy - state.startPosition.y;
    state.distanceDragged = Math.sqrt(dx * dx + dy * dy);
  };

  const dragended = (event) => {
    if (!event.active) simulation.alphaTarget(0);

    event.subject.fx = null;
    event.subject.fy = null;

    if (state.distanceDragged > 10) {
      setTooltipSettings("isClickTooltipActive", false);
    }
    setTooltipSettings("isHoverTooltipActive", false);
  };

  const zoom = d3.zoom().on("zoom", zoomed);

  d3.select(app.renderer.canvas).call(d3.drag().subject(dragsubject).on("start", dragstarted).on("drag", dragged).on("end", dragended)).call(zoom);

  d3.select(app.renderer.canvas).call(zoom.transform, state.transform);
}
