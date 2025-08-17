import { create } from "zustand";

// NEXTT: AUFTEILEN
export const graphStateInit = {
  graph: null,
  originGraph: null,

  linkWeightMin: null,
  linkWeightMax: null,

  mergeProteins: false,

  // pixi stuff
  nodeMap: null,
  circles: null,
  nodeLabels: null,
  lines: null,

  filteredAfterStart: false,
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
