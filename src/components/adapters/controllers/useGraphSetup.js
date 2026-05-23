import log from "../logging/logger.js";
import { useGraphFlags } from "../state/graphFlagsState.js";
import { useGraphEnrichment } from "../state/graphEnrichmentState.js";
import { useGraphState } from "../state/graphState.js";
import { useEffect } from "react";
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
  const { graphState, setGraphState } = useGraphState();
  const { graphFlags, setGraphFlags } = useGraphFlags();
  const { graphEnrichment } = useGraphEnrichment();
  const { communityState } = useCommunityState();
  const { setError } = useError();
  const { mappingState } = useMappingState();
  const stringDbCommunityResolution = graphEnrichment.stringDbGroupEnrichmentEnabled ? communityState.communityResolution : null;

  // load graph
  useEffect(() => {
    if (!graphState.activeGraphNames) return;
    log.info("Loading graph");

    const reloadGraph = async () => {
      let graph = await graphService.getJoinedGraph(graphState.activeGraphNames);
      graph.data = applyNodeMapping(graph.data, mappingState.mapping?.data);
      graph.data = await enrichGraphWithStringDb(graph.data, {
        enabled: graphEnrichment.stringDbEnrichmentEnabled,
        includeEvidence: graphEnrichment.stringDbEvidenceEnrichmentEnabled,
        nodeAttributeEnabled: graphEnrichment.stringDbNodeAttributeEnrichmentEnabled,
        groupEnrichmentEnabled: graphEnrichment.stringDbGroupEnrichmentEnabled,
        minConfidence: graphEnrichment.stringDbMinConfidence,
        minEvidenceScore: graphEnrichment.stringDbMinEvidenceScore,
        nodeAttributeType: graphEnrichment.stringDbNodeAttributeType,
        nodeAttributeTermFilter: graphEnrichment.stringDbNodeAttributeTermFilter,
        maxGroupEnrichmentFdr: graphEnrichment.stringDbGroupEnrichmentMaxFdr,
        speciesId: graphEnrichment.stringDbSpeciesId,
        communityResolution: stringDbCommunityResolution,
      });
      graph.data = await enrichGraphWithOmniPath(graph.data, {
        kinaseEnabled: graphEnrichment.omniPathEnrichmentEnabled,
        phosphataseEnabled: graphEnrichment.omniPathPhosphataseEnrichmentEnabled,
        nodeAnnotationEnabled: graphEnrichment.omniPathNodeAnnotationEnrichmentEnabled,
        nodeAnnotationMode: graphEnrichment.omniPathNodeAnnotationMode,
        minCurationEffort: graphEnrichment.omniPathMinCurationEffort,
      });

      resetService.resetSimulation({ preserveSearch: true });
      applyGraphSettings(graph);
      setGraphState("originGraph", graph);
    };

    reloadGraph().catch((error) => {
      const message = error instanceof Error ? error.message : "Error loading graph";
      setError(message);
      log.error("Error loading graph:", error);
    });
  }, [
    graphEnrichment.stringDbEnrichmentEnabled,
    graphEnrichment.stringDbEvidenceEnrichmentEnabled,
    graphEnrichment.stringDbNodeAttributeEnrichmentEnabled,
    graphEnrichment.stringDbGroupEnrichmentEnabled,
    graphEnrichment.stringDbMinConfidence,
    graphEnrichment.stringDbMinEvidenceScore,
    graphEnrichment.stringDbNodeAttributeType,
    graphEnrichment.stringDbNodeAttributeTermFilter,
    graphEnrichment.stringDbGroupEnrichmentMaxFdr,
    graphEnrichment.stringDbSpeciesId,
    graphEnrichment.omniPathEnrichmentEnabled,
    graphEnrichment.omniPathPhosphataseEnrichmentEnabled,
    graphEnrichment.omniPathNodeAnnotationEnrichmentEnabled,
    graphEnrichment.omniPathNodeAnnotationMode,
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
};
