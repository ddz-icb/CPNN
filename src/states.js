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
  nodeCollisionInit,
  compDensityInit,
  maxCompSizeInit,
  minNeighborhoodSizeInit,
  communityForceStrengthInit,
} from "./components/GraphStuff/graphInitValues.js";
import { linkColorSchemeInit, linkWidthInit, nodeColorSchemeInit, themeInit } from "./components/Other/appearance.js";

const setNestedValue = (obj, path, value) => {
  const keys = path.split(".");
  const lastKey = keys.pop();
  const nested = keys.reduce((acc, key) => acc[key], obj);
  nested[lastKey] = value;
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

export const useSettings = create((set) => ({
  settings: {
    physics: {
      circleLayout: circleLayoutInit,
      xStrength: xStrengthInit,
      yStrength: yStrengthInit,
      componentStrength: componentStrengthInit,
      nodeRepulsionStrength: nodeRepulsionStrengthInit,
      nodeCollision: nodeCollisionInit,
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
      communityForceStrength: communityForceStrengthInit,
      communityForceStrengthText: communityForceStrengthInit,
    },
    filter: {
      linkThreshold: linkThresholdInit,
      linkThresholdText: linkThresholdInit,
      linkFilter: linkFilterInit,
      linkFilterText: linkFilterTextInit,
      nodeFilter: nodeFilterInit,
      nodeFilterText: nodeFilterTextInit,
      minCompSize: minCompSizeInit,
      minCompSizeText: minCompSizeInit,
      maxCompSize: maxCompSizeInit,
      maxCompSizeText: maxCompSizeInit,
      compDensity: compDensityInit,
      compDensityText: compDensityInit,
      minNeighborhoodSize: minNeighborhoodSizeInit,
      minNeighborhoodSizeText: minNeighborhoodSizeInit,
    },
    appearance: {
      theme: themeInit,
      nodeColorScheme: nodeColorSchemeInit,
      linkColorScheme: linkColorSchemeInit,
      showNodeLabels: true,
      linkAttribsToColorIndices: null,
      nodeAttribsToColorIndices: null,
      linkWidth: linkWidthInit,
      linkWidthText: linkWidthInit,
    },
    download: {
      // on state change: indicates graph should be downloaded
      json: null,
      jsonWithCoordinates: null,
      jsonWithCoordinatesPhysics: null,
      png: null,
      svg: null,
      pdf: null,
      legendPdf: null,
      graphWithLegendPdf: null,
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

    linkWeightMin: null, // minimum link weight value of the entire graph
    linkWeightMax: null, // maximum link weight value of the entire graph

    mergeProteins: false,
    nodeMap: null, // mapping from nodes to circles and nodelabels; structure: {node, circle, nodeLabel}
    circles: null, // PIXI containers for drawing the nodes
    nodeLabels: null, // PIXI container for drawing node labels
    lines: null, // PIXI object (singular!) for drawing the edges

    filteredAfterStart: false,
    graphIsPreprocessed: false,

    activeGraphFileNames: null, // currently active file names
    uploadedGraphFileNames: null, // names of all graph files in local storage

    activeAnnotationMapping: null, // active node annotation mapping
    uploadedAnnotationMappingNames: null, // uploaded node annotation mappings
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
