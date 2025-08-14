import { create } from "zustand";

export const graphStateInit = {
  graph: null,
  originGraph: null,
  linkWeightMin: null,
  linkWeightMax: null,
  mergeProteins: false,

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
    set((state) => {
      if (typeof value === "function") {
        return { graphState: value(state.graphState) };
      }
      return { graphState: { ...state.graphState, [key]: value } };
    }),
  setAllGraphState: (value) =>
    set(() => ({
      graphState: value,
    })),
}));
