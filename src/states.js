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
    download: {
      // on state change: indicates graph should be downloaded
      json: null,
      png: null,
      svg: null,
    },
  },
  setSettings: (path, value) =>
    set((state) => {
      const updatedSettings = { ...state.settings };
      setNestedValue(updatedSettings, path, value);
      return { settings: updatedSettings };
    }),
}));

export const useInputRefs = create((set) => ({
  inputRefs: {
    graphAbs: null, // reference to newly selected graph (link weights should be interpreted as absolute values)
    graphZero: null, // reference to newly selected graph (negative link weights should be interpreted as 0)
    colorScheme: null, // reference to newly selected color scheme
    annotationMapping: null, // reference to newly selected mapping
  },
  setInputRefs: (path, value) =>
    set((state) => {
      const updatedRefs = { ...state.inputRefs };
      setNestedValue(updatedRefs, path, value);
      return { inputRefs: updatedRefs };
    }),
}));
