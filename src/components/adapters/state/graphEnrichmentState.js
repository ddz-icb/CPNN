import { create } from "zustand";
import { OMNI_PATH_MIN_CURATION_EFFORT_DEFAULT, OMNI_PATH_MIN_REFERENCES_DEFAULT } from "../../domain/service/enrichment/omniPathConfig.js";
import { DEFAULT_SPECIES_ID } from "../../domain/service/enrichment/stringDbConfig.js";

export const stringDbEnrichmentEnabledInit = false;
export const stringDbMinConfidenceInit = 0.9;
export const stringDbSpeciesIdInit = DEFAULT_SPECIES_ID;
export const omniPathEnrichmentEnabledInit = false;
export const omniPathPhosphataseEnrichmentEnabledInit = false;
export const omniPathMinReferencesInit = OMNI_PATH_MIN_REFERENCES_DEFAULT;
export const omniPathMinCurationEffortInit = OMNI_PATH_MIN_CURATION_EFFORT_DEFAULT;

const graphEnrichmentInit = {
  stringDbEnrichmentEnabled: stringDbEnrichmentEnabledInit,
  stringDbMinConfidence: stringDbMinConfidenceInit,
  stringDbMinConfidenceText: stringDbMinConfidenceInit,
  stringDbSpeciesId: stringDbSpeciesIdInit,
  omniPathEnrichmentEnabled: omniPathEnrichmentEnabledInit,
  omniPathPhosphataseEnrichmentEnabled: omniPathPhosphataseEnrichmentEnabledInit,
  omniPathMinReferences: omniPathMinReferencesInit,
  omniPathMinReferencesText: omniPathMinReferencesInit,
  omniPathMinCurationEffort: omniPathMinCurationEffortInit,
  omniPathMinCurationEffortText: omniPathMinCurationEffortInit,
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
