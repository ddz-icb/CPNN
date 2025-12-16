import * as PIXI from "pixi.js";
import { getNodeIdName } from "../parsing/nodeIdParsing.js";

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

