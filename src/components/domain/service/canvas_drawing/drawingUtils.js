import * as d3 from "d3";
import * as PIXI from "pixi.js";
import { getNodeIdName } from "../parsing/nodeIdParsing.js";

export const radiusColorScale = d3.scaleOrdinal(d3.schemeCategory10);
export const fallbackColor = "#777777";

export function getColor(index, colorscheme) {
  if (index == null || isNaN(index) || index >= colorscheme.length || index < 0) {
    return fallbackColor;
  }
  return colorscheme[index];
}

export function toColorNumber(color) {
  if (typeof color === "number") return color;
  if (typeof color !== "string") return 0x6b7280;
  const cleaned = color.replace("#", "");
  const parsed = parseInt(cleaned, 16);
  return Number.isNaN(parsed) ? 0x6b7280 : parsed;
}

export function toRgb(color) {
  if (typeof color === "number") return { r: (color >> 16) & 0xff, g: (color >> 8) & 0xff, b: color & 0xff };
  if (typeof color === "string" && color.startsWith("#")) {
    const hex = color.slice(1);
    const rgbHex = hex.length === 8 ? hex.slice(0, 6) : hex;
    const int = parseInt(rgbHex, 16);
    return { r: (int >> 16) & 0xff, g: (int >> 8) & 0xff, b: int & 0xff };
  }
  return null;
}

export function applyTintToColor(color, tint) {
  const base = toRgb(color);
  const tintRgb = toRgb(tint);
  if (!base || !tintRgb) return color;

  const r = Math.min(255, Math.round((base.r * tintRgb.r) / 255));
  const g = Math.min(255, Math.round((base.g * tintRgb.g) / 255));
  const b = Math.min(255, Math.round((base.b * tintRgb.b) / 255));

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function getNodeLabelOffsetY() {
  return -25;
}

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
    fontWeight: "300",
  });
}

export function describeSector(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;
  return ["M", cx, cy, "L", start.x, start.y, "A", r, r, 0, largeArcFlag, 1, end.x, end.y, "Z"].join(" ");
}

function polarToCartesian(cx, cy, r, angle) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}
