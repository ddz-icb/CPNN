import {
  borderHeightInit,
  borderWidthInit,
  checkBorderInit,
  circleLayoutInit,
  compDensityInit,
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

export const resetPhysicsSettings = (setSettings) => {
  setSettings("physics", {
    circleLayout: circleLayoutInit,
    xStrength: xStrengthInit,
    yStrength: yStrengthInit,
    componentStrength: componentStrengthInit,
    nodeRepulsionStrength: nodeRepulsionStrengthInit,
    linkForce: linkForceInit,
    linkLength: linkLengthInit,
    checkBorder: checkBorderInit,
    borderWidth: borderWidthInit,
    borderHeight: borderHeightInit,
    linkLengthText: linkLengthInit,
    borderHeightText: borderHeightInit,
    borderWidthText: borderWidthInit,
    xStrengthText: xStrengthInit,
    yStrengthText: yStrengthInit,
    componentStrengthText: componentStrengthInit,
    nodeRepulsionStrengthText: nodeRepulsionStrengthInit,
  });
};

export const resetFilterSettings = (setSettings) => {
  setSettings("filter", {
    linkThreshold: linkThresholdInit,
    linkFilter: linkFilterInit,
    linkFilterText: linkFilterTextInit,
    nodeFilter: nodeFilterInit,
    nodeFilterText: nodeFilterTextInit,
    minCompSize: minCompSizeInit,
    linkThresholdText: linkThresholdInit,
    minCompSizeText: minCompSizeInit,
    compDensity: compDensityInit,
    compDensityText: compDensityInit,
  });
};
