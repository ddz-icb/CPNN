import { getColor } from "./drawingUtils.js";
import { STRING_DB_LINK_ATTRIB } from "../enrichment/stringDbConfig.js";
import { OMNI_PATH_PHOSPHO_ATTRIB } from "../enrichment/omniPathConfig.js";

const LINK_WIDTH_MIN = 0.1;
const LINK_WIDTH_MAX = 3;
const LINK_WIDTH_LOG_COEFFS = [8.166, -2.791, 0.202];
const DOTTED_LINE_DASH_MULTIPLIER = 1.8;
const DOTTED_LINE_GAP_MULTIPLIER = 1.8;
const MIN_DOTTED_DASH = 10;
const MIN_DOTTED_GAP = 2.5;

function roundToDecimals(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function isAdditionalLinkAttrib(attrib) {
  return attrib === STRING_DB_LINK_ATTRIB || attrib === OMNI_PATH_PHOSPHO_ATTRIB;
}

function getDottedPattern(width) {
  const dash = Math.max(width * DOTTED_LINE_DASH_MULTIPLIER, MIN_DOTTED_DASH);
  const gap = Math.max(width * DOTTED_LINE_GAP_MULTIPLIER, MIN_DOTTED_GAP);
  return { dash, gap };
}

function drawDottedLine(lines, x1, y1, x2, y2, color, width) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (!Number.isFinite(length) || length <= 0) return;

  const { dash, gap } = getDottedPattern(width);
  const patternSize = dash + gap;

  for (let start = 0; start < length; start += patternSize) {
    const end = Math.min(start + dash, length);
    const startRatio = start / length;
    const endRatio = end / length;

    lines
      .moveTo(x1 + dx * startRatio, y1 + dy * startRatio)
      .lineTo(x1 + dx * endRatio, y1 + dy * endRatio)
      .stroke({
        color,
        width,
      });
  }
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
    const attrib = link.attribs[0];
    const color = getColor(linkAttribsToColorIndices[attrib], colorscheme);
    const sourceX = link.source.x;
    const sourceY = link.source.y;
    const targetX = link.target.x;
    const targetY = link.target.y;

    if (isAdditionalLinkAttrib(attrib)) {
      drawDottedLine(lines, sourceX, sourceY, targetX, targetY, color, linkWidth);
      return;
    }

    lines.moveTo(sourceX, sourceY).lineTo(targetX, targetY).stroke({
      color,
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
      const sourceX = link.source.x + offsetX;
      const sourceY = link.source.y + offsetY;
      const targetX = link.target.x + offsetX;
      const targetY = link.target.y + offsetY;
      const attrib = link.attribs[i];
      const color = getColor(linkAttribsToColorIndices[attrib], colorscheme);

      if (isAdditionalLinkAttrib(attrib)) {
        drawDottedLine(lines, sourceX, sourceY, targetX, targetY, color, linkWidth);
        continue;
      }

      lines.moveTo(sourceX, sourceY).lineTo(targetX, targetY).stroke({
        color,
        width: linkWidth,
      });
    }
  }
}

export function drawLineCanvas(ctx, link, linkWidth, colorscheme, attribToColorIndex, options = {}) {
  const widthScale = options.widthScale ?? 1;
  const adjustedWidth = linkWidth * widthScale;
  ctx.lineWidth = adjustedWidth;
  ctx.setLineDash([]);

  if (link.attribs.length === 1) {
    const attrib = link.attribs[0];
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.strokeStyle = getColor(attribToColorIndex[attrib], colorscheme);
    if (isAdditionalLinkAttrib(attrib)) {
      const { dash, gap } = getDottedPattern(adjustedWidth);
      ctx.setLineDash([dash, gap]);
    }
    ctx.stroke();
    ctx.closePath();
    ctx.setLineDash([]);
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
      const attrib = link.attribs[i];
      ctx.strokeStyle = getColor(attribToColorIndex[attrib], colorscheme);
      if (isAdditionalLinkAttrib(attrib)) {
        const { dash, gap } = getDottedPattern(adjustedWidth);
        ctx.setLineDash([dash, gap]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.closePath();
    }
    ctx.setLineDash([]);
  }
}
