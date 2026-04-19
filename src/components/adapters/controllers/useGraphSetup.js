import log from "../logging/logger.js";
import { useColorschemeState } from "../state/colorschemeState.js";
import { filterInit, linkThresholdInit, useFilter } from "../state/filterState.js";
import { useGraphFlags } from "../state/graphFlagsState.js";
import { useGraphEnrichment } from "../state/graphEnrichmentState.js";
import { useGraphMetrics } from "../state/graphMetricsState.js";
import { useGraphState } from "../state/graphState.js";
import { useEffect, useState } from "react";
import {
  getLinkAttribsToColorIndices,
  getLinkWeightMinMax,
  getNodeAttribsToColorIndices,
} from "../../domain/service/graph_calculations/graphUtils.js";
import { usePhysics } from "../state/physicsState.js";
import { useError } from "../state/errorState.js";
import { useMappingState } from "../state/mappingState.js";
import { useAppearance } from "../state/appearanceState.js";
import { darkTheme, lightTheme, useTheme } from "../state/themeState.js";
import { graphService } from "../../application/services/graphService.js";
import { resetService } from "../../application/services/resetService.js";
import { filterMergeByName } from "../../domain/service/graph_calculations/filterGraph.js";
import { applyNodeMapping } from "../../domain/service/graph_calculations/applyMapping.js";
import { enrichGraphWithStringDb } from "../../domain/service/enrichment/stringDbEnrichment.js";
import { enrichGraphWithOmniPath } from "../../domain/service/enrichment/omniPathEnrichment.js";

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function applySavedAppearanceSettings(savedAppearance, setAppearance, setTheme) {
  if (!isObject(savedAppearance)) return;

  if (typeof savedAppearance.showNodeLabels === "boolean") {
    setAppearance("showNodeLabels", savedAppearance.showNodeLabels);
  }
  if (typeof savedAppearance.linkWidth === "number") {
    setAppearance("linkWidth", savedAppearance.linkWidth);
  }
  if (savedAppearance.linkWidthText !== undefined) {
    setAppearance("linkWidthText", savedAppearance.linkWidthText);
  }
  if (typeof savedAppearance.linkWidthManuallySet === "boolean") {
    setAppearance("linkWidthManuallySet", savedAppearance.linkWidthManuallySet);
  }
  if (typeof savedAppearance.threeD === "boolean") {
    setAppearance("threeD", savedAppearance.threeD);
  }
  if (typeof savedAppearance.enable3DShading === "boolean") {
    setAppearance("enable3DShading", savedAppearance.enable3DShading);
  }
  if (typeof savedAppearance.show3DGrid === "boolean") {
    setAppearance("show3DGrid", savedAppearance.show3DGrid);
  }

  if (savedAppearance.themeName === darkTheme.name) {
    setTheme(darkTheme);
  } else if (savedAppearance.themeName === lightTheme.name) {
    setTheme(lightTheme);
  }
}

function applySavedColorschemeSettings(savedColorscheme, setColorschemeState) {
  if (!isObject(savedColorscheme)) return;

  if (isObject(savedColorscheme.nodeColorscheme) && Array.isArray(savedColorscheme.nodeColorscheme.data)) {
    setColorschemeState("nodeColorscheme", savedColorscheme.nodeColorscheme);
  }
  if (isObject(savedColorscheme.linkColorscheme) && Array.isArray(savedColorscheme.linkColorscheme.data)) {
    setColorschemeState("linkColorscheme", savedColorscheme.linkColorscheme);
  }
  if (savedColorscheme.nodeAttribsToColorIndices && typeof savedColorscheme.nodeAttribsToColorIndices === "object") {
    setColorschemeState("nodeAttribsToColorIndices", savedColorscheme.nodeAttribsToColorIndices);
  }
  if (savedColorscheme.linkAttribsToColorIndices && typeof savedColorscheme.linkAttribsToColorIndices === "object") {
    setColorschemeState("linkAttribsToColorIndices", savedColorscheme.linkAttribsToColorIndices);
  }
}

export const useGraphSetup = () => {
  const { setFilter } = useFilter();
  const { setColorschemeState } = useColorschemeState();
  const { setAppearance } = useAppearance();
  const { setTheme } = useTheme();
  const { graphState, setGraphState } = useGraphState();
  const { graphFlags, setGraphFlags } = useGraphFlags();
  const { graphEnrichment } = useGraphEnrichment();
  const { setError } = useError();
  const { mappingState } = useMappingState();
  const { setGraphMetrics } = useGraphMetrics();
  const { setAllPhysics } = usePhysics();
  const { setAllFilter } = useFilter();

  const [keepMapping, setKeepMapping] = useState(false);

  // load graph
  useEffect(() => {
    if (!graphState.activeGraphNames) return;
    log.info("Loading graph");

    const reloadGraph = async () => {
      let graph = await graphService.getJoinedGraph(graphState.activeGraphNames);
      graph.data = filterMergeByName(graph.data, graphFlags.mergeByName);
      graph.data = await enrichGraphWithStringDb(graph.data, {
        enabled: graphEnrichment.stringDbEnrichmentEnabled,
        minConfidence: graphEnrichment.stringDbMinConfidence,
        speciesId: graphEnrichment.stringDbSpeciesId,
      });
      graph.data = await enrichGraphWithOmniPath(graph.data, {
        enabled: graphEnrichment.omniPathEnrichmentEnabled,
      });
      graph.data = applyNodeMapping(graph.data, mappingState.mapping?.data);

      setGraphState("originGraph", graph);
      resetService.resetSimulation({ preserveSearch: true });
    };

    reloadGraph().catch((error) => {
      const message = error instanceof Error ? error.message : "Error loading graph";
      setError(message);
      log.error("Error loading graph:", error);
    });
  }, [
    graphFlags.mergeByName,
    graphEnrichment.stringDbEnrichmentEnabled,
    graphEnrichment.stringDbMinConfidence,
    graphEnrichment.stringDbSpeciesId,
    graphEnrichment.omniPathEnrichmentEnabled,
    mappingState.mapping,
    graphState.activeGraphNames,
  ]);

  // keep mapping if mergeByName
  useEffect(() => {
    if (!graphFlags.mergeByName) return;

    setKeepMapping(true);
  }, [graphFlags.mergeByName]);

  // forward graph
  useEffect(() => {
    if (!graphState.originGraph || !graphState.activeGraphNames || graphFlags.isPreprocessed) return;
    log.info("Forwarding graph to the render component");

    const graph = graphState.originGraph;

    const { minWeight, maxWeight } = getLinkWeightMinMax(graph.data);
    if (minWeight !== Infinity) {
      setGraphMetrics("linkWeightMin", minWeight);
    }
    if (maxWeight !== -Infinity) {
      setGraphMetrics("linkWeightMax", maxWeight);
    }
    if (minWeight !== Infinity && minWeight > linkThresholdInit) {
      const roundedMinWeight = Math.round(minWeight * 100) / 100;
      setFilter("linkThreshold", roundedMinWeight);
      setFilter("linkThresholdText", roundedMinWeight);
    }

    if (!keepMapping) {
      setColorschemeState("nodeAttribsToColorIndices", getNodeAttribsToColorIndices(graph.data));
      setColorschemeState("linkAttribsToColorIndices", getLinkAttribsToColorIndices(graph.data));

      applySavedColorschemeSettings(graph.data.colorscheme, setColorschemeState);
    }

    // incase user uploaded graph including physics
    if (graph.data.physics) {
      setAllPhysics(graph.data.physics);
    }
    if (graph.data.filter) {
      setAllFilter({ ...filterInit, ...graph.data.filter });
    }
    applySavedAppearanceSettings(graph.data.appearance, setAppearance, setTheme);

    setKeepMapping(false);
    setGraphState("graph", graph);
    setGraphFlags("isPreprocessed", true);
  }, [graphState.originGraph]);
};
