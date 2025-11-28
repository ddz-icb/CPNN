import { throttle } from "lodash";
import { initDragAndZoom2D } from "./interactiveCanvas2D";
import { initDragAndZoom3D } from "./interactiveCanvas3D";

export function initDragAndZoom(app, simulation, radius, setTooltipSettings, width, height, threeD, cameraRef) {
  if (threeD) {
    initDragAndZoom3D(app, simulation, setTooltipSettings, width, height, cameraRef);
  } else {
    initDragAndZoom2D(app, simulation, radius, setTooltipSettings, width, height);
  }
}

export function initTooltips(circle, node, setTooltipSettings) {
  circle.on("mouseover", (mouseData) => {
    setTooltipSettings("hoverTooltipData", {
      node: node.id,
      nodeGroups: node.groups,
      x: mouseData.originalEvent.pageX,
      y: mouseData.originalEvent.pageY,
    });
    setTooltipSettings("isHoverTooltipActive", true);
  });
  circle.on("mouseout", () => {
    setTooltipSettings("isHoverTooltipActive", false);
  });
  circle.on("click", (mouseData) => {
    setTooltipSettings("clickTooltipData", {
      node: node.id,
      nodeGroups: node.groups,
      x: mouseData.originalEvent.pageX,
      y: mouseData.originalEvent.pageY,
    });
    setTooltipSettings("isClickTooltipActive", true);
  });
}

export const handleResize = throttle((containerRef, app) => {
  if (app?.renderer && containerRef && containerRef.current) {
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    app.renderer.resize(width, height);
  }
}, 250);
