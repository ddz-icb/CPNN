import log from "../../logger";
import canvasToSvg from "canvas-to-svg";
import { drawCircleCanvas, drawLineCanvas } from "../Other/draw";

export function downloadAsPNG(app, document) {
  function getHtmlImageElement() {
    return app.renderer.extract.image(app.stage, "image/png");
  }

  getHtmlImageElement()
    .then((image) => {
      const scale = 1.5; // set this higher for higher resolution
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = image.width * scale;
      canvas.height = image.height * scale;

      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const dataURL = canvas.toDataURL("image/png", 1);

      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "Graph.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch((error) => {
      console.error("Error downloading the graph picture:", error);
    });
}

export function downloadAsSVG(
  document,
  graph,
  linkColorScheme,
  attribToColorIndex,
  circleBorderColor,
  nodeColorScheme,
  groupToColorIndex,
  circleNodeMap
) {
  const firstNode = graph.nodes[0];
  const { alsoFirstNode, circle: firstCircle } = circleNodeMap[firstNode.id];

  let minX = firstCircle.x;
  let maxX = firstCircle.x;
  let minY = firstCircle.y;
  let maxY = firstCircle.y;

  for (const node of graph.nodes) {
    const { sameNode, circle } = circleNodeMap[node.id];
    if (circle.x < minX) {
      minX = circle.x;
    }

    if (circle.x > maxX) {
      maxX = circle.x;
    }

    if (circle.y < minY) {
      minY = circle.y;
    }

    if (circle.y > maxY) {
      maxY = circle.y;
    }
  }

  minX = minX - 10;
  maxX = maxX + 10;
  minY = minY - 10;
  maxY = maxY + 10;

  const width = maxX - minX;
  const height = maxY - minY;

  const ctx = new canvasToSvg(width, height);

  const svgElement = ctx.getSvg();
  svgElement.setAttribute("viewBox", `${minX} ${minY} ${width} ${height}`);

  svgElement.setAttribute("width", width);
  svgElement.setAttribute("height", height);

  for (const link of graph.links) {
    drawLineCanvas(ctx, link, linkColorScheme[1], attribToColorIndex);
  }

  for (const node of graph.nodes) {
    const { sameNode, circle } = circleNodeMap[node.id];

    drawCircleCanvas(ctx, node, circle, circleBorderColor, nodeColorScheme[1], groupToColorIndex);
  }

  const mySerializedSVG = ctx.getSerializedSvg();

  const blob = new Blob([mySerializedSVG], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Graph.svg";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadGraphJson(graph, filename) {
  // this function maps the objects contained in source and target to its id (representing the node id)
  function convertLinks(links) {
    return links.map((link) => ({
      ...link,
      source: link.source.id,
      target: link.target.id,
    }));
  }
  const blob = new Blob([JSON.stringify({ nodes: graph.nodes, links: convertLinks(graph.links) }, null, 4)], {
    type: "application/json",
  });

  log.info("Downloading graph as JSON");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
