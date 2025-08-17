import { create } from "zustand";

export const graphMetricsInit = {
  linkWeightMin: null,
  linkWeightMax: null,
};

export const useGraphMetrics = create((set) => ({
  graphMetrics: graphMetricsInit,
  setGraphMetrics: (key, value) =>
    set((state) => ({
      graphMetrics: { ...state.graphMetrics, [key]: value },
    })),

  setAllGraphMetrics: (value) =>
    set(() => ({
      graphMetrics: value,
    })),
}));
