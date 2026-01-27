import { getColor } from "./drawingUtils.js";

const LINK_WIDTH_MIN = 0.1;
const LINK_WIDTH_MAX = 3;
const LINK_WIDTH_LOG_COEFFS = [8.166, -2.791, 0.202];

function roundToDecimals(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function calculateLinkWidth(linkCount) {
  const count = Number.isFinite(linkCount) ? Math.max(1, linkCount) : 1;
  const logCount = Math.log10(count);
  const [a, b, c] = LINK_WIDTH_LOG_COEFFS;
  const width = a + b * logCount + c * logCount * logCount;
  return roundToDecimals(clamp(width, LINK_WIDTH_MIN, LINK_WIDTH_MAX), 1);
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

export function drawLineCanvas(ctx, link, linkWidth, colorscheme, attribToColorIndex, options = {}) {
  const widthScale = options.widthScale ?? 1;
  const adjustedWidth = linkWidth * widthScale;
  ctx.lineWidth = adjustedWidth;

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
      const shift = (i - (link.attribs.length - 1) / 2) * adjustedWidth;
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
