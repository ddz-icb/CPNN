import { create } from "zustand";

export const stringDbEnrichmentEnabledInit = false;
export const stringDbMinConfidenceInit = 0.7;

const graphEnrichmentInit = {
  stringDbEnrichmentEnabled: stringDbEnrichmentEnabledInit,
  stringDbMinConfidence: stringDbMinConfidenceInit,
  stringDbMinConfidenceText: stringDbMinConfidenceInit,
};

export const useGraphEnrichment = create((set) => ({
  graphEnrichment: graphEnrichmentInit,
  setGraphEnrichment: (key, value) =>
    set((state) => ({
      graphEnrichment: { ...state.graphEnrichment, [key]: value },
    })),
  setAllGraphEnrichment: (value) =>
    set(() => ({
      graphEnrichment: value,
    })),
}));

