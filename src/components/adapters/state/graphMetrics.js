import { create } from "zustand";

// NEXTT: AUFTEILEN
export const graphMetricsInit = {};

export const useGraphState = create((set) => ({
  graphMetrics: graphMetricsInit,
  setGraphMetrics: (key, value) =>
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
