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
    container: {
      height: null,
      width: null,
    },
  },
  setSettings: (path, value) =>
    set((state) => {
      const updatedSettings = { ...state.settings };
      setNestedValue(updatedSettings, path, value);
      return { settings: updatedSettings };
    }),
}));

export const useTooltipSettings = create((set) => ({
  tooltipSettings: {
    isClickTooltipActive: false,
    clickTooltipData: null,
    isHoverTooltipActive: false,
    hoverTooltipData: null,
  },
  setTooltipSettings: (path, value) =>
    set((state) => {
      const updatedTooltipSettings = { ...state.tooltipSettings };
      setNestedValue(updatedTooltipSettings, path, value);
      return { tooltipSettings: updatedTooltipSettings };
    }),
}));

export const useGraphData = create((set) => ({
  graphData: {
    graph: null, // graph with modifications e.g. links filtered by threshold, it also contains the pixi node elements
    originGraph: null, // graph without modifications

    circleNodeMap: null, // mapping from circles to nodes
    circles: null, // PIXI containers for drawing the nodes
    lines: null, // PIXI container (singular!) for drawing the edges

    filteredAfterStart: false,

    activeGraphFileNames: null, // currently active file names
    uploadedGraphFileNames: null, // names of all graph files in local storage

    activeAnnotationMapping: null, // active node annotation mapping
    uploadedAnnotationMappings: null, // uploaded node annotation mappings
  },
  setGraphData: (path, value) =>
    set((state) => {
      const updatedGraphData = { ...state.graphData };

      let newValue;
      if (typeof value === "function") {
        newValue = value(updatedGraphData);
        return { graphData: newValue };
      } else {
        setNestedValue(updatedGraphData, path, value);
        return { graphData: updatedGraphData };
      }
    }),
}));
