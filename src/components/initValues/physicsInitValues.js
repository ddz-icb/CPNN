export const linkForceInit = true;
export const linkLengthInit = 70;
export const xStrengthInit = 0.05;
export const yStrengthInit = 0.05;
export const componentStrengthInit = 0;
export const nodeRepulsionStrengthInit = 1;
export const nodeCollisionInit = true;
export const circleLayoutInit = false;
export const compDensityInit = 1;
export const communityForceStrengthInit = 0;

export const checkBorderInit = false;
export const borderWidthInit = 200;
export const borderHeightInit = 200;

export const physicsInit = {
  circleLayout: circleLayoutInit,
  xStrength: xStrengthInit,
  yStrength: yStrengthInit,
  componentStrength: componentStrengthInit,
  nodeRepulsionStrength: nodeRepulsionStrengthInit,
  nodeCollision: nodeCollisionInit,
  linkForce: linkForceInit,
  linkLength: linkLengthInit,
  linkLengthText: linkLengthInit,
  checkBorder: checkBorderInit,
  borderWidth: borderWidthInit,
  borderHeight: borderHeightInit,
  borderHeightText: borderHeightInit,
  borderWidthText: borderWidthInit,
  xStrengthText: xStrengthInit,
  yStrengthText: yStrengthInit,
  componentStrengthText: componentStrengthInit,
  nodeRepulsionStrengthText: nodeRepulsionStrengthInit,
  communityForceStrength: communityForceStrengthInit,
  communityForceStrengthText: communityForceStrengthInit,
};

export const expectedPhysicTypes = {
  circleLayout: "boolean",
  xStrength: "number",
  yStrength: "number",
  componentStrength: "number",
  nodeRepulsionStrength: "number",
  nodeCollision: "boolean",
  linkForce: "number",
  linkLength: "number",
  checkBorder: "boolean",
  borderWidth: "number",
  borderHeight: "number",
  gravityAdvanced: "boolean",
  communityForceStrength: "number",
};
