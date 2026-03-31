import { create } from "zustand";
import { DEFAULT_SPECIES_ID } from "../../domain/service/enrichment/stringDbConfig.js";

export const stringDbEnrichmentEnabledInit = false;
export const stringDbMinConfidenceInit = 0.9;
export const stringDbSpeciesIdInit = DEFAULT_SPECIES_ID;
export const omniPathEnrichmentEnabledInit = false;

const graphEnrichmentInit = {
  stringDbEnrichmentEnabled: stringDbEnrichmentEnabledInit,
  stringDbMinConfidence: stringDbMinConfidenceInit,
  stringDbMinConfidenceText: stringDbMinConfidenceInit,
  stringDbSpeciesId: stringDbSpeciesIdInit,
  omniPathEnrichmentEnabled: omniPathEnrichmentEnabledInit,
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
