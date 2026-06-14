import * as PIXI from "pixi.js";
import { getEndpointId, getLinkDirection, LINK_DIRECTIONS } from "../graph_calculations/graphUtils.js";
import { isAdditionalLinkAttrib } from "../enrichment/additionalLinkEnrichment.js";
import { getColor, toRgb } from "./drawingUtils.js";

const LINK_WIDTH_MIN = 0.1;
const LINK_WIDTH_MAX = 3;
const LINK_WIDTH_LOG_COEFFS = [8.166, -2.791, 0.202];
const DOTTED_LINE_DASH_MULTIPLIER = 1.8;
const DOTTED_LINE_GAP_MULTIPLIER = 1.8;
const MIN_DOTTED_DASH = 10;
const MIN_DOTTED_GAP = 2.5;
const CHEVRON_MIN_SIZE = 5;
const CHEVRON_MAX_SIZE = 10;
const CHEVRON_POSITION_START = 0.38;
const CHEVRON_POSITION_STEP = 0.06;
const CHEVRON_POSITION_COUNT = 5;

let dottedLineTexture3D = null;

function roundToDecimals(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getChevronPosition(index) {
  return CHEVRON_POSITION_START + (index % CHEVRON_POSITION_COUNT) * CHEVRON_POSITION_STEP;
}

function getChevronSize(width) {
  return clamp(width * 3.5, CHEVRON_MIN_SIZE, CHEVRON_MAX_SIZE);
}

function getChevronOutlineColor(color) {
  const rgb = toRgb(color);
  if (!rgb) return "#ffffff";
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.55 ? "#111111" : "#ffffff";
}

function getChevronGeometry(x1, y1, x2, y2, direction, index, offsetX = 0, offsetY = 0, width = 1) {
  if (direction === LINK_DIRECTIONS.BOTH) return null;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (!Number.isFinite(length) || length <= 0) return null;

  const sign = direction === LINK_DIRECTIONS.REVERSE ? -1 : 1;
  const unitX = (dx / length) * sign;
  const unitY = (dy / length) * sign;
  const perpendicularX = -unitY;
  const perpendicularY = unitX;
  const size = getChevronSize(width);
  const ratio = getChevronPosition(index);
  const centerX = x1 + dx * ratio + offsetX;
  const centerY = y1 + dy * ratio + offsetY;
  const tipX = centerX + unitX * size * 0.5;
  const tipY = centerY + unitY * size * 0.5;
  const backX = centerX - unitX * size * 0.5;
  const backY = centerY - unitY * size * 0.5;
  const wing = size * 0.55;

  return {
    tipX,
    tipY,
    firstX: backX + perpendicularX * wing,
    firstY: backY + perpendicularY * wing,
    secondX: backX - perpendicularX * wing,
    secondY: backY - perpendicularY * wing,
  };
}

function drawChevronGraphics(lines, geometry, color, width) {
  if (!geometry) return;
  lines
    .moveTo(geometry.firstX, geometry.firstY)
    .lineTo(geometry.tipX, geometry.tipY)
    .lineTo(geometry.secondX, geometry.secondY)
    .stroke({ color: getChevronOutlineColor(color), width: Math.max(3.5, width + 2), cap: "round", join: "round" });
  lines
    .moveTo(geometry.firstX, geometry.firstY)
    .lineTo(geometry.tipX, geometry.tipY)
    .lineTo(geometry.secondX, geometry.secondY)
    .stroke({ color, width: Math.max(1.5, width), cap: "round", join: "round" });
}

function drawChevronCanvas(ctx, geometry, color, width) {
  if (!geometry) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(geometry.firstX, geometry.firstY);
  ctx.lineTo(geometry.tipX, geometry.tipY);
  ctx.lineTo(geometry.secondX, geometry.secondY);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([]);
  ctx.strokeStyle = getChevronOutlineColor(color);
  ctx.lineWidth = Math.max(3.5, width + 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, width);
  ctx.stroke();
  ctx.restore();
}

function getDottedPattern(width) {
  const dash = Math.max(width * DOTTED_LINE_DASH_MULTIPLIER, MIN_DOTTED_DASH);
  const gap = Math.max(width * DOTTED_LINE_GAP_MULTIPLIER, MIN_DOTTED_GAP);
  return { dash, gap };
}

function getDottedLineTexture3D() {
  if (dottedLineTexture3D) return dottedLineTexture3D;
  if (typeof document === "undefined") return PIXI.Texture.WHITE;

  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 4;
  const context = canvas.getContext("2d");
  if (!context) return PIXI.Texture.WHITE;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  for (let x = 0; x < canvas.width; x += 5) {
    context.fillRect(x, 0, 3, canvas.height);
  }

  dottedLineTexture3D = PIXI.Texture.from(canvas);
  return dottedLineTexture3D;
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
      .stroke({ color, width });
  }
}

export function calculateLinkWidth(linkCount) {
  const count = Number.isFinite(linkCount) ? Math.max(1, linkCount) : 1;
  const logCount = Math.log10(count);
  const [a, b, c] = LINK_WIDTH_LOG_COEFFS;
  const width = a + b * logCount + c * logCount * logCount;
  return roundToDecimals(clamp(width, LINK_WIDTH_MIN, LINK_WIDTH_MAX), 1);
}

export function createLineSprites(link, nodeContainers) {
  if (!link?.attribs || !nodeContainers) return [];
  return link.attribs.map(() => {
    const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    sprite.anchor.set(0.5);
    sprite.eventMode = "none";
    sprite.zIndex = 0;
    nodeContainers.addChild(sprite);
    const directionMarker = new PIXI.Graphics();
    directionMarker.eventMode = "none";
    directionMarker.visible = false;
    nodeContainers.addChild(directionMarker);
    sprite.directionMarker = directionMarker;
    return sprite;
  });
}

export function buildLineLayers(graph, nodeContainers, isThreeD) {
  const lines2D = new PIXI.Graphics();
  let lines3D = null;
  let activeLines = lines2D;

  if (isThreeD && graph?.data?.links) {
    lines3D = graph.data.links.map((link) => createLineSprites(link, nodeContainers));
    lines2D.visible = false;
    activeLines = lines3D;
  }

  return { lines2D, lines3D, activeLines };
}

function lineSpritesMatchLinks(lines3D, links) {
  if (!Array.isArray(lines3D) || !Array.isArray(links)) return false;
  if (lines3D.length !== links.length) return false;
  return lines3D.every((sprites, index) => Array.isArray(sprites) && sprites.length === (links[index]?.attribs?.length ?? 0));
}

function detachLineSprites(lines3D) {
  if (!Array.isArray(lines3D)) return;
  lines3D.forEach((sprites) => {
    if (!Array.isArray(sprites)) return;
    sprites.forEach((sprite) => {
      if (sprite?.parent) {
        sprite.parent.removeChild(sprite);
      }
      if (sprite?.directionMarker?.parent) {
        sprite.directionMarker.parent.removeChild(sprite.directionMarker);
      }
      sprite?.directionMarker?.destroy?.();
    });
  });
}

function prepareLineGraphics3D({ graph, nodeContainers, lines3D, lines2D, setPixiState }) {
  if (!graph?.data?.links || !nodeContainers || !setPixiState) return;

  if (!lineSpritesMatchLinks(lines3D, graph.data.links)) {
    detachLineSprites(lines3D);
    const newLines3D = graph.data.links.map((link) => createLineSprites(link, nodeContainers));
    setPixiState("lines3D", newLines3D);
    setPixiState("lines", newLines3D);
  } else {
    lines3D.forEach((sprites) => {
      sprites.forEach((sprite) => {
        if (!sprite) return;
        sprite.visible = true;
        if (!sprite.parent) {
          nodeContainers.addChild(sprite);
        }
        if (sprite.directionMarker && !sprite.directionMarker.parent) {
          nodeContainers.addChild(sprite.directionMarker);
        }
      });
    });
    setPixiState("lines", lines3D);
  }

  if (lines2D) {
    lines2D.visible = false;
    lines2D.clear();
  }
}

function prepareLineGraphics2D({ lines2D, lines3D, setPixiState }) {
  if (!setPixiState) return;

  if (Array.isArray(lines3D)) {
    lines3D.forEach((sprites) => {
      if (!Array.isArray(sprites)) return;
      sprites.forEach((sprite) => {
        if (sprite) sprite.visible = false;
        if (sprite?.directionMarker) sprite.directionMarker.visible = false;
      });
    });
  } else if (lines3D) {
    lines3D.clear?.();
    lines3D.visible = false;
  }

  if (lines2D) {
    lines2D.visible = true;
  }

  setPixiState("lines", lines2D);
}

export function applyLineGraphicsState(threeD, params) {
  if (threeD) {
    prepareLineGraphics3D(params);
  } else {
    prepareLineGraphics2D(params);
  }
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
      drawChevronGraphics(
        lines,
        getChevronGeometry(sourceX, sourceY, targetX, targetY, getLinkDirection(link, 0), 0, 0, 0, linkWidth),
        color,
        linkWidth,
      );
      return;
    }

    lines.moveTo(sourceX, sourceY).lineTo(targetX, targetY).stroke({ color, width: linkWidth });
    drawChevronGraphics(
      lines,
      getChevronGeometry(sourceX, sourceY, targetX, targetY, getLinkDirection(link, 0), 0, 0, 0, linkWidth),
      color,
      linkWidth,
    );
    return;
  }

  const dx = link.target.x - link.source.x;
  const dy = link.target.y - link.source.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (!Number.isFinite(length) || length <= 0) return;

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
      drawChevronGraphics(
        lines,
        getChevronGeometry(link.source.x, link.source.y, link.target.x, link.target.y, getLinkDirection(link, i), i, offsetX, offsetY, linkWidth),
        color,
        linkWidth,
      );
      continue;
    }

    lines.moveTo(sourceX, sourceY).lineTo(targetX, targetY).stroke({ color, width: linkWidth });
    drawChevronGraphics(
      lines,
      getChevronGeometry(link.source.x, link.source.y, link.target.x, link.target.y, getLinkDirection(link, i), i, offsetX, offsetY, linkWidth),
      color,
      linkWidth,
    );
  }
}

export function updateLines(links, lineGraphics, linkWidth, linkColorscheme, linkAttribsToColorIndices) {
  if (!lineGraphics || !links) return;

  if (Array.isArray(lineGraphics)) {
    for (let i = 0; i < lineGraphics.length; i++) {
      const link = links[i];
      const graphic = lineGraphics[i];
      if (!graphic) continue;
      graphic.clear();
      if (!link) {
        graphic.visible = false;
        continue;
      }
      drawLine(graphic, link, linkWidth, linkColorscheme.data, linkAttribsToColorIndices);
      graphic.visible = true;
      graphic.zIndex = 0;
    }
    return;
  }

  lineGraphics.clear();
  lineGraphics.visible = true;
  for (const link of links) {
    drawLine(lineGraphics, link, linkWidth, linkColorscheme.data, linkAttribsToColorIndices);
  }
}

export function updateLines3D(links, lineGraphics, linkWidth, linkColorscheme, linkAttribsToColorIndices, projections) {
  if (!Array.isArray(lineGraphics)) return;

  const linkCount = Array.isArray(links) ? links.length : 0;

  for (let linkIndex = 0; linkIndex < lineGraphics.length; linkIndex++) {
    const link = linkIndex < linkCount ? links[linkIndex] : null;
    const sprites = lineGraphics[linkIndex];
    if (!Array.isArray(sprites)) continue;

    if (!link) {
      sprites.forEach((sprite) => {
        if (sprite) sprite.visible = false;
        if (sprite?.directionMarker) sprite.directionMarker.visible = false;
      });
      continue;
    }

    const source = projections[getEndpointId(link.source)];
    const target = projections[getEndpointId(link.target)];

    if (!source || !target || source.visible === false || target.visible === false) {
      sprites.forEach((sprite) => {
        if (sprite) sprite.visible = false;
        if (sprite?.directionMarker) sprite.directionMarker.visible = false;
      });
      continue;
    }

    const depth = Math.max(source.depth ?? 0, target.depth ?? 0);
    const widthScaled = linkWidth * ((source.scale + target.scale) / 2);

    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const length = Math.sqrt(dx * dx + dy * dy) || 1e-6;
    const angle = Math.atan2(dy, dx);
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    const normedPerpendicularVector = { x: -dy / length, y: dx / length };

    const attribs = Array.isArray(link.attribs) ? link.attribs : [];
    const attribCount = attribs.length;

    for (let i = 0; i < sprites.length; i++) {
      const sprite = sprites[i];
      if (!sprite) continue;
      if (i >= attribCount) {
        sprite.visible = false;
        if (sprite.directionMarker) sprite.directionMarker.visible = false;
        continue;
      }

      const shift = (i - (attribCount - 1) / 2) * widthScaled;
      const offsetX = shift * normedPerpendicularVector.x;
      const offsetY = shift * normedPerpendicularVector.y;
      const attrib = attribs[i];
      const direction = getLinkDirection(link, i);

      sprite.visible = true;
      sprite.position.set(midX + offsetX, midY + offsetY);
      sprite.rotation = angle;
      sprite.width = length;
      sprite.height = widthScaled;
      sprite.texture = isAdditionalLinkAttrib(attrib) ? getDottedLineTexture3D() : PIXI.Texture.WHITE;
      sprite.tint = getColor(linkAttribsToColorIndices[attrib], linkColorscheme.data);
      sprite.zIndex = -(depth ?? 0);

      const marker = sprite.directionMarker;
      if (marker) {
        marker.clear();
        marker.visible = direction !== LINK_DIRECTIONS.BOTH;
        if (marker.visible) {
          const geometry = getChevronGeometry(source.x, source.y, target.x, target.y, direction, i, offsetX, offsetY, widthScaled);
          drawChevronGraphics(marker, geometry, getColor(linkAttribsToColorIndices[attrib], linkColorscheme.data), widthScaled);
          marker.zIndex = sprite.zIndex - 0.01;
        }
      }
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
    drawChevronCanvas(
      ctx,
      getChevronGeometry(link.source.x, link.source.y, link.target.x, link.target.y, getLinkDirection(link, 0), 0, 0, 0, adjustedWidth),
      getColor(attribToColorIndex[attrib], colorscheme),
      adjustedWidth,
    );
    ctx.setLineDash([]);
    return;
  }

  const dx = link.target.x - link.source.x;
  const dy = link.target.y - link.source.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const normedPerpendicularVector = { x: -dy / length, y: dx / length };

  for (let i = 0; i < link.attribs.length; i++) {
    const shift = (i - (link.attribs.length - 1) / 2) * adjustedWidth;
    const offsetX = shift * normedPerpendicularVector.x;
    const offsetY = shift * normedPerpendicularVector.y;
    const attrib = link.attribs[i];

    ctx.beginPath();
    ctx.moveTo(link.source.x + offsetX, link.source.y + offsetY);
    ctx.lineTo(link.target.x + offsetX, link.target.y + offsetY);
    ctx.strokeStyle = getColor(attribToColorIndex[attrib], colorscheme);
    if (isAdditionalLinkAttrib(attrib)) {
      const { dash, gap } = getDottedPattern(adjustedWidth);
      ctx.setLineDash([dash, gap]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();
    ctx.closePath();
    drawChevronCanvas(
      ctx,
      getChevronGeometry(link.source.x, link.source.y, link.target.x, link.target.y, getLinkDirection(link, i), i, offsetX, offsetY, adjustedWidth),
      getColor(attribToColorIndex[attrib], colorscheme),
      adjustedWidth,
    );
  }
  ctx.setLineDash([]);
}
