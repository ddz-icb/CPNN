import { create } from "zustand";
import {
  OMNI_PATH_MIN_CURATION_EFFORT_DEFAULT,
  OMNI_PATH_NODE_ANNOTATION_MODE_DEFAULT,
} from "../../domain/service/enrichment/omniPathConfig.js";
import {
  DEFAULT_GROUP_ENRICHMENT_MAX_FDR,
  DEFAULT_MIN_EVIDENCE_SCORE,
  DEFAULT_NODE_ATTRIBUTE_MAX_TERMS,
  DEFAULT_SPECIES_ID,
} from "../../domain/service/enrichment/stringDbConfig.js";

export const stringDbEnrichmentEnabledInit = false;
export const stringDbEvidenceEnrichmentEnabledInit = false;
export const stringDbNodeAttributeEnrichmentEnabledInit = false;
export const stringDbGroupEnrichmentEnabledInit = false;
export const stringDbMinConfidenceInit = 0.9;
export const stringDbMinEvidenceScoreInit = DEFAULT_MIN_EVIDENCE_SCORE;
export const stringDbNodeAttributeMaxTermsInit = DEFAULT_NODE_ATTRIBUTE_MAX_TERMS;
export const stringDbNodeAttributeMaxFdrInit = DEFAULT_GROUP_ENRICHMENT_MAX_FDR;
export const stringDbGroupEnrichmentMaxFdrInit = DEFAULT_GROUP_ENRICHMENT_MAX_FDR;
export const stringDbSpeciesIdInit = DEFAULT_SPECIES_ID;
export const omniPathEnrichmentEnabledInit = false;
export const omniPathPhosphataseEnrichmentEnabledInit = false;
export const omniPathNodeAnnotationEnrichmentEnabledInit = false;
export const omniPathNodeAnnotationModeInit = OMNI_PATH_NODE_ANNOTATION_MODE_DEFAULT;
export const omniPathMinCurationEffortInit = OMNI_PATH_MIN_CURATION_EFFORT_DEFAULT;

const graphEnrichmentInit = {
  stringDbEnrichmentEnabled: stringDbEnrichmentEnabledInit,
  stringDbEvidenceEnrichmentEnabled: stringDbEvidenceEnrichmentEnabledInit,
  stringDbNodeAttributeEnrichmentEnabled: stringDbNodeAttributeEnrichmentEnabledInit,
  stringDbGroupEnrichmentEnabled: stringDbGroupEnrichmentEnabledInit,
  stringDbMinConfidence: stringDbMinConfidenceInit,
  stringDbMinConfidenceText: stringDbMinConfidenceInit,
  stringDbMinEvidenceScore: stringDbMinEvidenceScoreInit,
  stringDbMinEvidenceScoreText: stringDbMinEvidenceScoreInit,
  stringDbNodeAttributeMaxTerms: stringDbNodeAttributeMaxTermsInit,
  stringDbNodeAttributeMaxTermsText: stringDbNodeAttributeMaxTermsInit,
  stringDbNodeAttributeMaxFdr: stringDbNodeAttributeMaxFdrInit,
  stringDbNodeAttributeMaxFdrText: stringDbNodeAttributeMaxFdrInit,
  stringDbGroupEnrichmentMaxFdr: stringDbGroupEnrichmentMaxFdrInit,
  stringDbGroupEnrichmentMaxFdrText: stringDbGroupEnrichmentMaxFdrInit,
  stringDbSpeciesId: stringDbSpeciesIdInit,
  omniPathEnrichmentEnabled: omniPathEnrichmentEnabledInit,
  omniPathPhosphataseEnrichmentEnabled: omniPathPhosphataseEnrichmentEnabledInit,
  omniPathNodeAnnotationEnrichmentEnabled: omniPathNodeAnnotationEnrichmentEnabledInit,
  omniPathNodeAnnotationMode: omniPathNodeAnnotationModeInit,
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
