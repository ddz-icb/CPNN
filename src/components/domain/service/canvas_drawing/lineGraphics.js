import * as PIXI from "pixi.js";
import { getEndpointId, getLinkDirection, LINK_DIRECTIONS } from "../graph_calculations/graphUtils.js";
import { isAdditionalLinkAttrib } from "../enrichment/additionalLinkEnrichment.js";
import { getColor } from "./drawingUtils.js";

const LINK_WIDTH_MIN = 0.1;
const LINK_WIDTH_MAX = 3;
const LINK_DEPTH_SCALE_MIN = 0.5;
const LINK_DEPTH_SCALE_MAX = 1.5;
const LINK_WIDTH_LOG_COEFFS = [8.166, -2.791, 0.202];
const DOTTED_LINE_DASH_MULTIPLIER = 1.8;
const DOTTED_LINE_GAP_MULTIPLIER = 1.8;
const MIN_DOTTED_DASH = 10;
const MIN_DOTTED_GAP = 2.5;
const CHEVRON_MIN_SIZE = 5;
const CHEVRON_MAX_SIZE = 10;
const CHEVRON_POSITION_START = 0.44;
const CHEVRON_LENGTH_FACTOR = 0.9;
const CHEVRON_FLARE_FACTOR = 0.7;
const CHEVRON_STROKE_FACTOR = CHEVRON_LENGTH_FACTOR / Math.hypot(CHEVRON_LENGTH_FACTOR, CHEVRON_FLARE_FACTOR);
const CHEVRON_INNER_EXTENSION_FACTOR =
  CHEVRON_FLARE_FACTOR ** 2 / (CHEVRON_LENGTH_FACTOR ** 2 + CHEVRON_FLARE_FACTOR ** 2);
export const MIN_3D_LINK_SCREEN_LENGTH = 2;

let dottedLineTexture3D = null;

function roundToDecimals(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getOutsideSign(offset) {
  return Math.sign(offset) || 1;
}

function getChevronExtension(index, count, laneSpacing) {
  const center = (count - 1) / 2;
  const distanceFromCenter = Math.abs(index - center);
  const outerDistance = (count - 1) / 2;
  const laneDepth = Math.max(0, outerDistance - distanceFromCenter);
  return laneDepth * laneSpacing * CHEVRON_INNER_EXTENSION_FACTOR;
}

function getChevronRenderOrder(count) {
  const center = (count - 1) / 2;
  return Array.from({ length: count }, (_, index) => index).sort(
    (a, b) => Math.abs(b - center) - Math.abs(a - center) || a - b,
  );
}

function getChevronOutwardRank(index, count) {
  return Math.abs(index - (count - 1) / 2);
}

function getChevronSize(width, scale = 1) {
  return clamp(width * 3.5, CHEVRON_MIN_SIZE, CHEVRON_MAX_SIZE) * scale;
}

function getChevronGeometry(x1, y1, x2, y2, direction, offsetX = 0, offsetY = 0, width = 1, scale = 1, outsideSign = 1, extension = 0) {
  if (direction === LINK_DIRECTIONS.BOTH) return null;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (!Number.isFinite(length) || length <= 0) return null;

  const sign = direction === LINK_DIRECTIONS.REVERSE ? -1 : 1;
  const unitX = (dx / length) * sign;
  const unitY = (dy / length) * sign;
  const perpendicularX = -dy / length;
  const perpendicularY = dx / length;
  const size = getChevronSize(width, scale);
  const halfLength = size * 0.45;
  const centerX = x1 + dx * CHEVRON_POSITION_START + offsetX;
  const centerY = y1 + dy * CHEVRON_POSITION_START + offsetY;
  const tipX = centerX + unitX * halfLength;
  const tipY = centerY + unitY * halfLength;
  const baseWing = size * CHEVRON_FLARE_FACTOR;
  const wing = baseWing + extension;
  const longitudinalSpan = size * CHEVRON_LENGTH_FACTOR * (wing / baseWing);

  return {
    tipX,
    tipY,
    firstX: tipX - unitX * longitudinalSpan + perpendicularX * wing * outsideSign,
    firstY: tipY - unitY * longitudinalSpan + perpendicularY * wing * outsideSign,
  };
}

function drawChevronGraphics(lines, geometry, color, width, scale = 1) {
  if (!geometry) return;

  lines
    .moveTo(geometry.firstX, geometry.firstY)
    .lineTo(geometry.tipX, geometry.tipY)
    .stroke({ color, width: width * scale * CHEVRON_STROKE_FACTOR, cap: "butt" });
}

function drawChevronCanvas(ctx, geometry, color, width, scale = 1) {
  if (!geometry) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(geometry.firstX, geometry.firstY);
  ctx.lineTo(geometry.tipX, geometry.tipY);
  ctx.lineCap = "butt";
  ctx.setLineDash([]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width * scale * CHEVRON_STROKE_FACTOR;
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
        getChevronGeometry(sourceX, sourceY, targetX, targetY, getLinkDirection(link, 0), 0, 0, linkWidth),
        color,
        linkWidth,
      );
      return;
    }

    lines.moveTo(sourceX, sourceY).lineTo(targetX, targetY).stroke({ color, width: linkWidth });
    drawChevronGraphics(lines, getChevronGeometry(sourceX, sourceY, targetX, targetY, getLinkDirection(link, 0), 0, 0, linkWidth), color, linkWidth);
    return;
  }

  const dx = link.target.x - link.source.x;
  const dy = link.target.y - link.source.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (!Number.isFinite(length) || length <= 0) return;

  const normedPerpendicularVector = { x: -dy / length, y: dx / length };

  const lanes = link.attribs.map((attrib, i) => {
    const shift = (i - (link.attribs.length - 1) / 2) * linkWidth;
    const offsetX = shift * normedPerpendicularVector.x;
    const offsetY = shift * normedPerpendicularVector.y;
    const sourceX = link.source.x + offsetX;
    const sourceY = link.source.y + offsetY;
    const targetX = link.target.x + offsetX;
    const targetY = link.target.y + offsetY;
    const color = getColor(linkAttribsToColorIndices[attrib], colorscheme);

    if (isAdditionalLinkAttrib(attrib)) {
      drawDottedLine(lines, sourceX, sourceY, targetX, targetY, color, linkWidth);
    } else {
      lines.moveTo(sourceX, sourceY).lineTo(targetX, targetY).stroke({ color, width: linkWidth });
    }

    return { i, shift, offsetX, offsetY, color };
  });

  for (const i of getChevronRenderOrder(lanes.length)) {
    const lane = lanes[i];
    drawChevronGraphics(
      lines,
      getChevronGeometry(
        link.source.x,
        link.source.y,
        link.target.x,
        link.target.y,
        getLinkDirection(link, lane.i),
        lane.offsetX,
        lane.offsetY,
        linkWidth,
        1,
        getOutsideSign(lane.shift),
        getChevronExtension(lane.i, lanes.length, linkWidth),
      ),
      lane.color,
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

    const sourceDepth = source.depth ?? 0;
    const targetDepth = target.depth ?? 0;
    const depth = Math.max(sourceDepth, targetDepth);
    const averageScale = 2 / (1 / source.scale + 1 / target.scale);
    const depthScale = clamp(averageScale, LINK_DEPTH_SCALE_MIN, LINK_DEPTH_SCALE_MAX);
    const widthScaled = linkWidth * depthScale;

    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (!Number.isFinite(length) || length < MIN_3D_LINK_SCREEN_LENGTH) {
      sprites.forEach((sprite) => {
        if (sprite) sprite.visible = false;
        if (sprite?.directionMarker) sprite.directionMarker.visible = false;
      });
      continue;
    }
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
          const geometry = getChevronGeometry(
            source.x,
            source.y,
            target.x,
            target.y,
            direction,
            offsetX,
            offsetY,
            linkWidth,
            depthScale,
            getOutsideSign(shift),
            getChevronExtension(i, attribCount, widthScaled),
          );
          drawChevronGraphics(marker, geometry, getColor(linkAttribsToColorIndices[attrib], linkColorscheme.data), linkWidth, depthScale);
          const maxOutwardRank = Math.max(1, (attribCount - 1) / 2);
          marker.zIndex = sprite.zIndex - 0.005 - (getChevronOutwardRank(i, attribCount) / maxOutwardRank) * 0.005;
        }
      }
    }
  }
}

export function drawLineCanvas(ctx, link, linkWidth, colorscheme, attribToColorIndex, options = {}) {
  const widthScale = options.widthScale ?? 1;
  const adjustedWidth = linkWidth * widthScale;
  const minLength = options.minLength ?? 0;
  const linkLength = Math.hypot(link.target.x - link.source.x, link.target.y - link.source.y);
  if (!Number.isFinite(linkLength) || linkLength < minLength) return;
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
      getChevronGeometry(link.source.x, link.source.y, link.target.x, link.target.y, getLinkDirection(link, 0), 0, 0, linkWidth, widthScale),
      getColor(attribToColorIndex[attrib], colorscheme),
      linkWidth,
      widthScale,
    );
    ctx.setLineDash([]);
    return;
  }

  const dx = link.target.x - link.source.x;
  const dy = link.target.y - link.source.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const normedPerpendicularVector = { x: -dy / length, y: dx / length };

  const lanes = link.attribs.map((attrib, i) => {
    const shift = (i - (link.attribs.length - 1) / 2) * adjustedWidth;
    const offsetX = shift * normedPerpendicularVector.x;
    const offsetY = shift * normedPerpendicularVector.y;
    const color = getColor(attribToColorIndex[attrib], colorscheme);

    ctx.beginPath();
    ctx.moveTo(link.source.x + offsetX, link.source.y + offsetY);
    ctx.lineTo(link.target.x + offsetX, link.target.y + offsetY);
    ctx.strokeStyle = color;
    if (isAdditionalLinkAttrib(attrib)) {
      const { dash, gap } = getDottedPattern(adjustedWidth);
      ctx.setLineDash([dash, gap]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();
    ctx.closePath();
    return { i, shift, offsetX, offsetY, color };
  });

  for (const i of getChevronRenderOrder(lanes.length)) {
    const lane = lanes[i];
    drawChevronCanvas(
      ctx,
      getChevronGeometry(
        link.source.x,
        link.source.y,
        link.target.x,
        link.target.y,
        getLinkDirection(link, lane.i),
        lane.offsetX,
        lane.offsetY,
        linkWidth,
        widthScale,
        getOutsideSign(lane.shift),
        getChevronExtension(lane.i, lanes.length, adjustedWidth),
      ),
      lane.color,
      linkWidth,
      widthScale,
    );
  }
  ctx.setLineDash([]);
}
