import { create } from "zustand";

import { graphDataInit } from "../../config/graphDataInitValues.js";

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
