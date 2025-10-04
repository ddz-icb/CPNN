import log from "../../adapters/logging/logger.js";
import { useColorschemeState } from "../../adapters/state/colorschemeState.js";
import { linkThresholdInit, useFilter } from "../../adapters/state/filterState.js";
import { useGraphFlags } from "../../adapters/state/graphFlagsState.js";
import { useGraphMetrics } from "../../adapters/state/graphMetricsState.js";
import { useGraphState } from "../../adapters/state/graphState.js";
import { useEffect } from "react";
import {
  getLinkAttribsToColorIndices,
  getLinkWeightMinMax,
  getNodeAttribsToColorIndices,
} from "../../domain_service/graph_calculations/graphUtils.js";
import { usePhysics } from "../../adapters/state/physicsState.js";
import { useError } from "../../adapters/state/errorState.js";
import { useMappingState } from "../../adapters/state/mappingState.js";
import { graphService } from "../services/graphService.js";
import { resetService } from "../services/resetService.js";
import { filterMergeProteins } from "../../domain_service/graph_calculations/filterGraph.js";
import { applyNodeMapping } from "../../domain_service/graph_calculations/applyMapping.js";

export const useGraphSetup = () => {
  const { setFilter } = useFilter();
  const { setColorschemeState } = useColorschemeState();
  const { graphState, setGraphState } = useGraphState();
  const { graphFlags, setGraphFlags } = useGraphFlags();
  const { setError } = useError();
  const { mappingState } = useMappingState();
  const { setGraphMetrics } = useGraphMetrics();
  const { setAllPhysics } = usePhysics();

  // load graph
  useEffect(() => {
    if (!graphState.activeGraphNames) return;
    log.info("Loading graph");

    async function reloadGraph() {
      try {
        let graph = await graphService.getJoinedGraph(graphState.activeGraphNames);
        graph.data = filterMergeProteins(graph.data, graphFlags.mergeProteins);
        graph.data = applyNodeMapping(graph.data, mappingState.mapping?.data);
        setGraphState("originGraph", graph);

        resetService.resetSimulation();
      } catch (error) {
        setError("Error loading graph");
        log.error("Error loading graph:", error);
      }
    }

    reloadGraph();
  }, [graphFlags.mergeProteins, mappingState.mapping, graphState.activeGraphNames]);

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
      setFilter("linkThreshold", minWeight);
      setFilter("linkThresholdText", minWeight);
    }

    setColorschemeState("nodeAttribsToColorIndices", getNodeAttribsToColorIndices(graph.data));
    setColorschemeState("linkAttribsToColorIndices", getLinkAttribsToColorIndices(graph.data));

    // incase user uploaded graph including physics
    if (graph.data.physics) {
      setAllPhysics(graph.data.physics);
    }

    setGraphState("graph", graph);
    setGraphFlags("isPreprocessed", true);
  }, [graphState.originGraph]);
};
