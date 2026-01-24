import { create } from "zustand";

export const linkForceInit = true;
export const linkLengthInit = 200;
export const gravityStrengthInit = 0.05;
export const componentStrengthInit = 0;
export const nodeRepulsionStrengthInit = 1;
export const circleForceInit = false;
export const communityForceStrengthInit = 0;

export const checkBorderInit = false;
export const borderWidthInit = 200;
export const borderHeightInit = 200;
export const borderDepthInit = 200;

export const physicsInit = {
  circleForce: circleForceInit,
  gravityStrength: gravityStrengthInit,
  gravityStrengthText: gravityStrengthInit,
  componentStrength: componentStrengthInit,
  nodeRepulsionStrength: nodeRepulsionStrengthInit,
  linkForce: linkForceInit,
  linkLength: linkLengthInit,
  linkLengthText: linkLengthInit,
  checkBorder: checkBorderInit,
  borderWidth: borderWidthInit,
  borderHeight: borderHeightInit,
  borderHeightText: borderHeightInit,
  borderWidthText: borderWidthInit,
  borderDepth: borderDepthInit,
  borderDepthText: borderDepthInit,
  componentStrengthText: componentStrengthInit,
  nodeRepulsionStrengthText: nodeRepulsionStrengthInit,
  communityForceStrength: communityForceStrengthInit,
  communityForceStrengthText: communityForceStrengthInit,
};

export const expectedPhysicTypes = {
  circleForce: "boolean",
  gravityStrength: "number",
  componentStrength: "number",
  nodeRepulsionStrength: "number",
  linkForce: "boolean",
  linkLength: "number",
  checkBorder: "boolean",
  borderWidth: "number",
  borderHeight: "number",
  borderDepth: "number",
  gravityAdvanced: "boolean",
  communityForceStrength: "number",
};

export const usePhysics = create((set) => ({
  physics: physicsInit,
  setPhysics: (key, value) =>
    set((state) => ({
      physics: { ...state.physics, [key]: value },
    })),
  setAllPhysics: (value) =>
    set(() => ({
      physics: value,
    })),
}));
