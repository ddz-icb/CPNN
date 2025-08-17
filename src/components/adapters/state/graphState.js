import { create } from "zustand";

export const graphInit = null;
export const nodeMapInit = null;
export const circlesInit = null;
export const linesInit = null;
export const filteredAfterStartInit = false;

// NEXTT: AUFTEILEN
export const graphStateInit = {
  graph: graphInit,
  originGraph: null,

  mergeProteins: false,

  // pixi stuff
  nodeMap: nodeMapInit,
  circles: circlesInit,
  nodeLabels: null,
  lines: linesInit,

  filteredAfterStart: filteredAfterStartInit,
  graphIsPreprocessed: false,

  uploadedGraphNames: null,
  activeGraphNames: null,
};

export const useGraphState = create((set) => ({
  graphState: graphStateInit,
  setGraphState: (key, value) =>
    set((state) => ({
      graphState: { ...state.graphState, [key]: value },
    })),
  setAllGraphState: (value) =>
    set(() => ({
      graphState: value,
    })),
}));
