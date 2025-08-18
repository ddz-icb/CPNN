import * as d3 from "d3";
import * as PIXI from "pixi.js";
import { getNodeIdName } from "../parsing/nodeIdParsing.js";
import { getNodeLabelOffsetY } from "../../application_service/services/interactiveCanvas.js";

export const radius = 8;
export const color = d3.scaleOrdinal(d3.schemeCategory10);
export const fallbackColor = "#777777";

export function getBitMapStyle(nodeId) {
  return {
    text: getNodeIdName(nodeId),
    style: {
      chars: [["A", "Z"], ["a", "z"], ["0", "9"], " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"],
      padding: 4,
      resolution: 4,
      distanceField: { type: "sdf", range: 8 },
      fontSize: 12,
    },
  };
}

export function getTextStyle(textColor) {
  return new PIXI.TextStyle({
    fontFamily: "Arial",
    fontSize: 12,
    fill: textColor,
    resolution: 2,
    align: "center",
  });
}

export function getColor(index, colorscheme) {
  if (index == null || isNaN(index) || index >= colorscheme.length || index < 0) {
    return fallbackColor;
  }
  return colorscheme[index];
}

export function redraw(graphData, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices, showNodeLabels, nodeMap, app) {
  lines.clear();

  for (const link of graphData.links) {
    drawLine(lines, link, linkWidth, linkColorscheme.data, linkAttribsToColorIndices);
  }

  if (showNodeLabels) {
    graphData.nodes.forEach((n) => {
      const { node, circle, nodeLabel } = nodeMap[n.id];
      nodeLabel.x = circle.x;
      nodeLabel.y = circle.y + getNodeLabelOffsetY(node.id);
    });
  }

  app.renderer.render(app.stage);
}

export function render(app) {
  app.renderer.render(app.stage);
}

export function drawCircle(circle, node, circleBorderColor, colorscheme, nodeAttribsToColorIndices) {
  circle
    .circle(0, 0, radius)
    .fill({ color: getColor(nodeAttribsToColorIndices[node.groups[0]], colorscheme) })
    .stroke({ color: circleBorderColor, width: 2 });
  for (let i = 1; i < node.groups.length; i++) {
    let startAngle = (i * 2 * Math.PI) / node.groups.length;
    let endAngle = ((i + 1) * 2 * Math.PI) / node.groups.length;

    // radius - 1 so it doesn't cover the outer stroke
    circle
      .arc(0, 0, radius - 1, startAngle, endAngle)
      .lineTo(0, 0)
      .fill({
        color: getColor(nodeAttribsToColorIndices[node.groups[i]], colorscheme),
      });
  }
  return circle;
}

export function drawCircleCanvas(ctx, node, circle, circleBorderColor, colorscheme, nodeAttribsToColorIndices) {
  ctx.beginPath();
  ctx.arc(circle.x, circle.y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = getColor(nodeAttribsToColorIndices[node.groups[0]], colorscheme);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = circleBorderColor;
  ctx.stroke();

  for (let i = 1; i < node.groups.length; i++) {
    let startAngle = (i * 2 * Math.PI) / node.groups.length;
    let endAngle = ((i + 1) * 2 * Math.PI) / node.groups.length;

    ctx.beginPath();
    ctx.moveTo(circle.x, circle.y);
    ctx.arc(circle.x, circle.y, radius - 1, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = getColor(nodeAttribsToColorIndices[node.groups[i]], colorscheme);
    ctx.fill();
  }
}

export function changeCircleBorderColor(circles, newColor) {
  for (const circle of circles.children) {
    circle.circle(0, 0, radius).stroke({ color: newColor, width: 2 });
  }
}

export function changeNodeLabelColor(nodeLabels, textColor) {
  for (const label of nodeLabels.children) {
    label.style = getTextStyle(textColor);
  }
}

export function changeNodeColors(circles, nodeMap, circleBorderColor, colorscheme, nodeAttribsToColorIndices) {
  for (const circle of circles.children) {
    const { node } = nodeMap[circle.id];
    circle.clear();
    drawCircle(circle, node, circleBorderColor, colorscheme, nodeAttribsToColorIndices);
  }
}

export function drawLine(lines, link, linkWidth, colorscheme, linkAttribsToColorIndices) {
  if (link.attribs.length === 1) {
    lines
      .moveTo(link.source.x, link.source.y)
      .lineTo(link.target.x, link.target.y)
      .stroke({
        color: getColor(linkAttribsToColorIndices[link.attribs[0]], colorscheme),
        width: linkWidth,
      });
  } else {
    const dx = link.target.x - link.source.x;
    const dy = link.target.y - link.source.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const normedPerpendicularVector = { x: -dy / length, y: dx / length };

    for (let i = 0; i < link.attribs.length; i++) {
      const shift = (i - (link.attribs.length - 1) / 2) * linkWidth;
      const offsetX = shift * normedPerpendicularVector.x;
      const offsetY = shift * normedPerpendicularVector.y;

      lines
        .moveTo(link.source.x + offsetX, link.source.y + offsetY)
        .lineTo(link.target.x + offsetX, link.target.y + offsetY)
        .stroke({
          color: getColor(linkAttribsToColorIndices[link.attribs[i]], colorscheme),
          width: linkWidth,
        });
    }
  }
}

export function drawLineCanvas(ctx, link, linkWidth, colorscheme, attribToColorIndex) {
  ctx.lineWidth = linkWidth;

  if (link.attribs.length === 1) {
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.strokeStyle = getColor(attribToColorIndex[link.attribs[0]], colorscheme);
    ctx.stroke();
    ctx.closePath();
  } else {
    const dx = link.target.x - link.source.x;
    const dy = link.target.y - link.source.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const normedPerpendicularVector = { x: -dy / length, y: dx / length };

    for (let i = 0; i < link.attribs.length; i++) {
      const shift = (i - (link.attribs.length - 1) / 2) * linkWidth;
      const offsetX = shift * normedPerpendicularVector.x;
      const offsetY = shift * normedPerpendicularVector.y;

      ctx.beginPath();
      ctx.moveTo(link.source.x + offsetX, link.source.y + offsetY);
      ctx.lineTo(link.target.x + offsetX, link.target.y + offsetY);
      ctx.strokeStyle = getColor(attribToColorIndex[link.attribs[i]], colorscheme);
      ctx.stroke();
      ctx.closePath();
    }
  }
}
