import log from "../logging/logger.js";
import { useGraphFlags } from "../state/graphFlagsState.js";
import { useGraphEnrichment } from "../state/graphEnrichmentState.js";
import { useGraphState } from "../state/graphState.js";
import { useEffect, useState } from "react";
import { useError } from "../state/errorState.js";
import { useMappingState } from "../state/mappingState.js";
import { useCommunityState } from "../state/communityState.js";
import { graphService } from "../../application/services/graphService.js";
import { resetService } from "../../application/services/resetService.js";
import { applyGraphSettings } from "../../application/services/graphSettingsService.js";
import { applyNodeMapping } from "../../domain/service/graph_calculations/applyMapping.js";
import { enrichGraphWithStringDb } from "../../domain/service/enrichment/stringDbEnrichment.js";
import { enrichGraphWithOmniPath } from "../../domain/service/enrichment/omniPathEnrichment.js";

export const useGraphSetup = () => {
  const [isAdditionalDataLoading, setIsAdditionalDataLoading] = useState(false);
  const { graphState, setGraphState } = useGraphState();
  const { graphFlags, setGraphFlags } = useGraphFlags();
  const { graphEnrichment } = useGraphEnrichment();
  const { communityState } = useCommunityState();
  const { setError } = useError();
  const { mappingState } = useMappingState();
  const stringDbCommunityResolution = graphEnrichment.stringDbGroupEnrichmentEnabled ? communityState.communityResolution : null;
  const additionalDataEnabled =
    graphEnrichment.stringDbEnrichmentEnabled ||
    graphEnrichment.stringDbNodeAttributeEnrichmentEnabled ||
    graphEnrichment.stringDbGroupEnrichmentEnabled ||
    graphEnrichment.omniPathEnrichmentEnabled ||
    graphEnrichment.omniPathPhosphataseEnrichmentEnabled;

  // load graph
  useEffect(() => {
    if (!graphState.activeGraphNames) return;
    log.info("Loading graph");
    let cancelled = false;

    const reloadGraph = async () => {
      let graph = await graphService.getJoinedGraph(graphState.activeGraphNames);
      graph.data = applyNodeMapping(graph.data, mappingState.mapping?.data);
      if (!cancelled && additionalDataEnabled) setIsAdditionalDataLoading(true);

      try {
        graph.data = await enrichGraphWithStringDb(graph.data, {
          enabled: graphEnrichment.stringDbEnrichmentEnabled,
          includeEvidence: graphEnrichment.stringDbEvidenceEnrichmentEnabled,
          nodeAttributeEnabled: graphEnrichment.stringDbNodeAttributeEnrichmentEnabled,
          groupEnrichmentEnabled: graphEnrichment.stringDbGroupEnrichmentEnabled,
          minConfidence: graphEnrichment.stringDbMinConfidence,
          minEvidenceScore: graphEnrichment.stringDbMinEvidenceScore,
          nodeAttributeMaxTerms: graphEnrichment.stringDbNodeAttributeMaxTerms,
          nodeAttributeMaxFdr: graphEnrichment.stringDbNodeAttributeMaxFdr,
          maxGroupEnrichmentFdr: graphEnrichment.stringDbGroupEnrichmentMaxFdr,
          speciesId: graphEnrichment.stringDbSpeciesId,
          communityResolution: stringDbCommunityResolution,
        });
        graph.data = await enrichGraphWithOmniPath(graph.data, {
          kinaseEnabled: graphEnrichment.omniPathEnrichmentEnabled,
          phosphataseEnabled: graphEnrichment.omniPathPhosphataseEnrichmentEnabled,
          minCurationEffort: graphEnrichment.omniPathMinCurationEffort,
        });
      } finally {
        if (!cancelled) setIsAdditionalDataLoading(false);
      }

      if (cancelled) return;
      resetService.resetSimulation({ preserveSearch: true });
      applyGraphSettings(graph);
      setGraphState("originGraph", graph);
    };

    reloadGraph().catch((error) => {
      if (cancelled) return;
      const message = error instanceof Error ? error.message : "Error loading graph";
      setError(message);
      log.error("Error loading graph:", error);
    });

    return () => {
      cancelled = true;
    };
  }, [
    graphEnrichment.stringDbEnrichmentEnabled,
    graphEnrichment.stringDbEvidenceEnrichmentEnabled,
    graphEnrichment.stringDbNodeAttributeEnrichmentEnabled,
    graphEnrichment.stringDbGroupEnrichmentEnabled,
    graphEnrichment.stringDbMinConfidence,
    graphEnrichment.stringDbMinEvidenceScore,
    graphEnrichment.stringDbNodeAttributeMaxTerms,
    graphEnrichment.stringDbNodeAttributeMaxFdr,
    graphEnrichment.stringDbGroupEnrichmentMaxFdr,
    graphEnrichment.stringDbSpeciesId,
    graphEnrichment.omniPathEnrichmentEnabled,
    graphEnrichment.omniPathPhosphataseEnrichmentEnabled,
    graphEnrichment.omniPathMinCurationEffort,
    stringDbCommunityResolution,
    mappingState.mapping,
    graphState.activeGraphNames,
  ]);

  // forward graph
  useEffect(() => {
    if (!graphState.originGraph || !graphState.activeGraphNames || graphFlags.isPreprocessed) return;
    log.info("Forwarding graph to the render component");

    const graph = graphState.originGraph;

    setGraphState("graph", graph);
    setGraphFlags("isPreprocessed", true);
  }, [graphState.originGraph]);

  return isAdditionalDataLoading;
};
