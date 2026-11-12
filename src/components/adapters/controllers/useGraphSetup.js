import log from "../logging/logger.js";
import { useGraphFlags } from "../state/graphFlagsState.js";
import { useGraphEnrichment } from "../state/graphEnrichmentState.js";
import { useGraphState } from "../state/graphState.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useError } from "../state/errorState.js";
import { useMappingState } from "../state/mappingState.js";
import { useCommunityState } from "../state/communityState.js";
import { graphService } from "../../application/services/graphService.js";
import { resetService } from "../../application/services/resetService.js";
import { applyGraphSettings } from "../../application/services/graphSettingsService.js";
import { applyNodeMapping } from "../../domain/service/graph_calculations/applyMapping.js";
import { hasSameNodeIds } from "../../domain/service/graph_calculations/graphUtils.js";
import { reconcileGraphDataPreservingSimulation } from "../../domain/service/graph_calculations/reconcileGraphData.js";
import { enrichGraphWithStringDb } from "../../domain/service/enrichment/stringDbEnrichment.js";
import { enrichGraphWithOmniPath } from "../../domain/service/enrichment/omniPathEnrichment.js";

const ADDITIONAL_DATA_ENABLED_KEYS = [
  "stringDbEnrichmentEnabled",
  "stringDbNodeAttributeEnrichmentEnabled",
  "stringDbGroupEnrichmentEnabled",
  "omniPathEnrichmentEnabled",
  "omniPathPhosphataseEnrichmentEnabled",
];
const ADDITIONAL_DATA_OPTION_KEYS = [...ADDITIONAL_DATA_ENABLED_KEYS, "stringDbEvidenceEnrichmentEnabled"];

export const useGraphSetup = () => {
  const [isAdditionalDataLoading, setIsAdditionalDataLoading] = useState(false);
  const cancelLoadRef = useRef(null);
  const previousAdditionalDataOptionsRef = useRef(null);
  const { graphState, setGraphState } = useGraphState();
  const { graphFlags, setGraphFlags } = useGraphFlags();
  const { graphEnrichment, setGraphEnrichment } = useGraphEnrichment();
  const { communityState } = useCommunityState();
  const { setError } = useError();
  const { mappingState } = useMappingState();
  const stringDbCommunityResolution = graphEnrichment.stringDbGroupEnrichmentEnabled ? communityState.communityResolution : null;
  const additionalDataEnabled = ADDITIONAL_DATA_ENABLED_KEYS.some((key) => graphEnrichment[key]);
  const cancelAdditionalDataLoad = useCallback(() => cancelLoadRef.current?.(), []);

  // load graph
  useEffect(() => {
    if (!graphState.activeGraphNames) return;
    log.info("Loading graph");
    let cancelled = false;
    const abortController = new AbortController();
    const currentOptions = Object.fromEntries(ADDITIONAL_DATA_OPTION_KEYS.map((key) => [key, Boolean(graphEnrichment[key])]));
    const previousOptions = previousAdditionalDataOptionsRef.current ?? {};
    const newlyEnabledOptions = ADDITIONAL_DATA_OPTION_KEYS.filter((key) => currentOptions[key] && !previousOptions[key]);
    previousAdditionalDataOptionsRef.current = currentOptions;
    const cancelLoad = () => {
      if (cancelled) return;
      cancelled = true;
      log.info("Cancelled additional graph data loading");
      abortController.abort();
      setIsAdditionalDataLoading(false);
      newlyEnabledOptions.forEach((key) => setGraphEnrichment(key, false));
    };
    cancelLoadRef.current = cancelLoad;

    const reloadGraph = async () => {
      let graph = await graphService.getJoinedGraph(graphState.activeGraphNames);
      if (cancelled) return;
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
          nodeAttributeCategory: graphEnrichment.stringDbNodeAttributeCategory,
          maxGroupEnrichmentFdr: graphEnrichment.stringDbGroupEnrichmentMaxFdr,
          speciesId: graphEnrichment.stringDbSpeciesId,
          communityResolution: stringDbCommunityResolution,
          signal: abortController.signal,
        });
        graph.data = await enrichGraphWithOmniPath(graph.data, {
          kinaseEnabled: graphEnrichment.omniPathEnrichmentEnabled,
          phosphataseEnabled: graphEnrichment.omniPathPhosphataseEnrichmentEnabled,
          minCurationEffort: graphEnrichment.omniPathMinCurationEffort,
          signal: abortController.signal,
        });
      } finally {
        if (!cancelled) setIsAdditionalDataLoading(false);
      }

      if (cancelled) return;
      const currentOriginGraph = useGraphState.getState().graphState.originGraph;
      const isPreprocessed = useGraphFlags.getState().graphFlags.isPreprocessed;
      const reuseNodes = isPreprocessed && hasSameNodeIds(currentOriginGraph?.data, graph.data);
      if (reuseNodes) {
        graph.data = reconcileGraphDataPreservingSimulation(currentOriginGraph.data, graph.data);
      } else {
        resetService.resetSimulation({ preserveSearch: true });
      }

      applyGraphSettings(graph, reuseNodes ? currentOriginGraph : null);
      setGraphState("originGraph", graph);
      if (cancelLoadRef.current === cancelLoad) cancelLoadRef.current = null;
    };

    reloadGraph().catch((error) => {
      if (cancelLoadRef.current === cancelLoad) cancelLoadRef.current = null;
      if (cancelled) return;
      const message = error instanceof Error ? error.message : "Error loading graph";
      setError(message);
      log.error("Error loading graph:", error);
    });

    return () => {
      cancelled = true;
      abortController.abort();
      setIsAdditionalDataLoading(false);
      if (cancelLoadRef.current === cancelLoad) cancelLoadRef.current = null;
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
    graphEnrichment.stringDbNodeAttributeCategory,
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

  return { isAdditionalDataLoading, cancelAdditionalDataLoad };
};
