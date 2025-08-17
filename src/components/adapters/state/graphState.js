import { create } from "zustand";

export const graphInit = null;
export const filteredAfterStartInit = false;

export const graphStateInit = {
  // graph state
  graph: graphInit,
  originGraph: null,

  // graph flags
  mergeProteins: false,
  filteredAfterStart: filteredAfterStartInit,
  isPreprocessed: false,

  // graph state
  activeGraphNames: null,
  uploadedGraphNames: null,
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
