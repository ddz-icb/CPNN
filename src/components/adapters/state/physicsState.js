import { create } from "zustand";

export const linkForceInit = true;
export const linkLengthInit = 100;
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
  ...Object.fromEntries(
    Object.entries(physicsInit)
      .filter(([key]) => !key.endsWith("Text"))
      .map(([key, value]) => [key, typeof value]),
  ),
  gravityAdvanced: "boolean",
};

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidPhysicsValue(value, defaultValue) {
  if (typeof defaultValue === "number") {
    return isFiniteNumber(value);
  }
  return typeof value === typeof defaultValue;
}

function isValidPhysicsTextValue(value) {
  return typeof value === "string" || isFiniteNumber(value);
}

export function normalizePhysicsState(value) {
  const savedPhysics = isObject(value) ? value : {};
  const normalized = { ...physicsInit };

  for (const key of Object.keys(physicsInit)) {
    if (!Object.hasOwn(savedPhysics, key) || savedPhysics[key] === undefined) continue;
    if (key.endsWith("Text")) {
      if (isValidPhysicsTextValue(savedPhysics[key])) {
        normalized[key] = savedPhysics[key];
      }
      continue;
    }

    if (isValidPhysicsValue(savedPhysics[key], physicsInit[key])) {
      normalized[key] = savedPhysics[key];
    }
  }

  for (const field of Object.keys(expectedPhysicTypes)) {
    const textField = `${field}Text`;
    if (!Object.hasOwn(physicsInit, textField)) continue;

    const textValue = normalized[textField];
    if (!isValidPhysicsTextValue(textValue)) {
      normalized[textField] = normalized[field];
    }
  }

  return normalized;
}

export const usePhysics = create((set) => ({
  physics: normalizePhysicsState(physicsInit),
  setPhysics: (key, value) =>
    set((state) => ({
      physics: { ...state.physics, [key]: value },
    })),
  setAllPhysics: (value) =>
    set(() => ({
      physics: normalizePhysicsState(value),
    })),
}));
