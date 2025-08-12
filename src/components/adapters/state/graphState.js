import { create } from "zustand";

export const graphDataInit = {
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

export const useGraphData = create((set) => ({
  graphData: graphDataInit,
  setGraphData: (key, value) =>
    set((state) => {
      if (typeof value === "function") {
        return { graphData: value(state.graphData) };
      }
      return { graphData: { ...state.graphData, [key]: value } };
    }),
  setAllGraphData: (value) =>
    set(() => ({
      graphData: value,
    })),
}));
