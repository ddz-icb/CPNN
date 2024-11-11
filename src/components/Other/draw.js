import log from "../../logger";
import * as d3 from "d3";

export const radius = 8;
export const linkWidth = 2;
export const color = d3.scaleOrdinal(d3.schemeCategory10);
export const fallbackColor = "#777777";

export function getColor(index, colorScheme) {
  if (index == null || isNaN(index) || index >= colorScheme.length || index < 0) {
    return fallbackColor;
  }
  return colorScheme[index];
}

export function drawCircle(circle, node, circleBorderColor, colorScheme, groupToColorIndex) {
  circle
    .circle(0, 0, radius)
    .fill({ color: getColor(groupToColorIndex[node.groups[0]], colorScheme) })
    .stroke({ color: circleBorderColor, width: 2 });
  for (let i = 1; i < node.groups.length; i++) {
    let startAngle = (i * 2 * 3.1415) / node.groups.length;
    let endAngle = ((i + 1) * 2 * 3.1415) / node.groups.length;

    // radius - 1 so it doesn't cover the outer stroke
    circle
      .arc(0, 0, radius - 1, startAngle, endAngle)
      .lineTo(0, 0)
      .fill({
        color: getColor(groupToColorIndex[node.groups[i]], colorScheme),
      });
  }
  return circle;
}

export function drawCircleCanvas(ctx, node, circle, circleBorderColor, colorScheme, groupToColorIndex) {
  ctx.beginPath();
  ctx.arc(circle.x, circle.y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = getColor(groupToColorIndex[node.groups[0]], colorScheme);
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
    ctx.fillStyle = getColor(groupToColorIndex[node.groups[i]], colorScheme);
    ctx.fill();
  }
}

export function changeCircleBorderColor(circles, newColor) {
  for (const circle of circles.children) {
    circle.circle(0, 0, radius || 8).stroke({ color: newColor, width: 2 });
  }
}

export function changeNodeColors(circles, circleNodeMap, circleBorderColor, colorScheme, groupToColorIndex) {
  for (const circle of circles.children) {
    const { node, sameCircle } = circleNodeMap[circle.id];
    drawCircle(circle, node, circleBorderColor, colorScheme, groupToColorIndex);
  }
}

export function drawLine(lines, link, colorScheme, attribToColorIndex) {
  if (link.attribs.length === 1) {
    lines
      .moveTo(link.source.x, link.source.y)
      .lineTo(link.target.x, link.target.y)
      .stroke({
        color: getColor(attribToColorIndex[link.attribs[0]], colorScheme),
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
          color: getColor(attribToColorIndex[link.attribs[i]], colorScheme),
          width: linkWidth,
        });
    }
  }
}

export function drawLineCanvas(ctx, link, colorScheme, attribToColorIndex) {
  ctx.lineWidth = linkWidth;

  if (link.attribs.length === 1) {
    log.info("link.attribs", link.attribs);
    log.info("colorscheme", colorScheme);
    log.info("COLOR", getColor(attribToColorIndex[link.attribs[0]], colorScheme), ctx.lineWidth);
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.strokeStyle = getColor(attribToColorIndex[link.attribs[0]], colorScheme);
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
      ctx.strokeStyle = getColor(attribToColorIndex[link.attribs[i]], colorScheme);
      ctx.stroke();
      ctx.closePath();
    }
  }
}
