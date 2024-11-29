import { create } from "zustand";

import {
  borderHeightInit,
  borderWidthInit,
  nodeRepulsionStrengthInit,
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
  xStrengthInit,
  yStrengthInit,
  gravityAdvancedInit,
} from "./components/GraphStuff/graphInitValues.js";
import { linkColorSchemeInit, nodeColorSchemeInit, themeInit } from "./components/Other/appearance.js";

const setNestedValue = (obj, path, value) => {
  const keys = path.split(".");
  const lastKey = keys.pop();
  const nested = keys.reduce((acc, key) => acc[key], obj);
  nested[lastKey] = value;
};

export const useSettings = create((set) => ({
  settings: {
    physics: {
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
      gravityAdvanced: gravityAdvancedInit,
      linkLengthText: linkLengthInit,
      borderHeightText: borderHeightInit,
      borderWidthText: borderWidthInit,
      xStrengthText: xStrengthInit,
      yStrengthText: yStrengthInit,
      componentStrengthText: componentStrengthInit,
      nodeRepulsionStrengthText: nodeRepulsionStrengthInit,
    },
    filter: {
      linkThreshold: linkThresholdInit,
      linkFilter: linkFilterInit,
      linkFilterText: linkFilterTextInit,
      nodeFilter: nodeFilterInit,
      nodeFilterText: nodeFilterTextInit,
      minCompSize: minCompSizeInit,
      linkThresholdText: linkThresholdInit,
      minCompSizeText: minCompSizeInit,
    },
    appearance: {
      theme: themeInit,
      nodeColorScheme: nodeColorSchemeInit,
      linkColorScheme: linkColorSchemeInit,
      linkAttribsToColorIndices: null,
      nodeAttribsToColorIndices: null,
    },
  },
  setSettings: (path, value) =>
    set((state) => {
      const updatedSettings = { ...state.settings };
      setNestedValue(updatedSettings, path, value);
      return { settings: updatedSettings };
    }),
}));
