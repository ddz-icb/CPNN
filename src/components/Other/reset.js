import log from "../../logger.js";
import {
  borderHeightInit,
  borderWidthInit,
  checkBorderInit,
  circleLayoutInit,
  componentStrengthInit,
  linkFilterInit,
  linkFilterTextInit,
  linkForceInit,
  linkLengthInit,
  linkThresholdInit,
  minCompSizeInit,
  nodeFilterInit,
  nodeFilterTextInit,
  nodeRepulsionStrengthInit,
  xStrengthInit,
  yStrengthInit,
} from "../GraphStuff/graphInitValues.js";

export const resetPhysicsSettings = (setPhysicsSettings) => {
  setPhysicsSettings((prev) => ({
    ...prev,
    linkForce: linkForceInit,
    linkLength: linkLengthInit,
    xStrength: xStrengthInit,
    yStrength: yStrengthInit,
    componentStrength: componentStrengthInit,
    nodeRepulsionStrength: nodeRepulsionStrengthInit,
    circleLayout: circleLayoutInit,
    checkBorder: checkBorderInit,
    borderWidth: borderWidthInit,
    borderHeight: borderHeightInit,
  }));
};

export const resetFilterSettings = (setFilterSettings) => {
  setFilterSettings((prev) => ({
    ...prev,
    linkThreshold: linkThresholdInit,
    minCompSize: minCompSizeInit,
    linkFilter: linkFilterInit,
    linkFilterText: linkFilterTextInit,
    nodeFilter: nodeFilterInit,
    nodeFilterText: nodeFilterTextInit,
  }));
};
