import { throttle } from "lodash";
import * as d3 from "d3";

/* RESIZE CANVAS ON RESIZE */

// throttle the resize interval for better performance
export const handleResize = throttle((containerRef, app) => {
  if (app && app.renderer && containerRef && containerRef.current) {
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    app.renderer.resize(width, height);
  }
}, 250);

/* ZOOM AND DRAG STUFF */

let app;
let radius;
let simulation;

let transform = d3.zoomIdentity; // view transformation-values
const zoom = d3.zoom();
let distanceDragged = 0;
let startPosition = { x: 0, y: 0 };

export function initDragAndZoom(initialApp, initialSimulation, initialRadius, setTooltipSettings, width, height) {
  app = initialApp;
  simulation = initialSimulation;
  radius = initialRadius;
  transform = d3.zoomIdentity.scale(0.95).translate((width / 2) * (1 - 0.95), (height / 2) * (1 - 0.95));

  d3.select(app.renderer.canvas)
    .call(
      d3
        .drag()
        .subject(dragsubject)
        .on("start", (event) => dragstarted(event, setTooltipSettings))
        .on("drag", dragged)
        .on("end", (event) => dragended(event, setTooltipSettings))
    )
    .call(zoom.on("zoom", zoomed));

  d3.select(app.renderer.canvas).call(zoom.transform, transform);
}

const zoomed = (event) => {
  transform = event.transform;

  app.stage.x = transform.x;
  app.stage.y = transform.y;
  app.stage.scale.x = transform.k;
  app.stage.scale.y = transform.k;

  app.renderer.render(app.stage);
};

const dragsubject = (event) => {
  return simulation.find(transform.invertX(event.x), transform.invertY(event.y), radius);
};

const dragstarted = (event, setTooltipSettings) => {
  if (!event.active) simulation.alphaTarget(0.3).restart();

  event.subject.fx = event.subject.x;
  event.subject.fy = event.subject.y;

  startPosition = { x: event.subject.x, y: event.subject.y };
  distanceDragged = 0;

  setTooltipSettings("isHoverTooltipActive", false);
};

const dragged = (event) => {
  event.subject.fx += event.dx / transform.k;
  event.subject.fy += event.dy / transform.k;

  const dx = event.subject.fx - startPosition.x;
  const dy = event.subject.fy - startPosition.y;
  distanceDragged = Math.sqrt(dx * dx + dy * dy);
};

const dragended = (event, setTooltipSettings) => {
  if (!event.active) simulation.alphaTarget(0);

  event.subject.fx = null;
  event.subject.fy = null;

  if (distanceDragged > 10) {
    setTooltipSettings("isClickTooltipActive", false);
  }
  setTooltipSettings("isHoverTooltipActive", false);
};
