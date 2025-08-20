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

export const useGraphSetup = () => {
  const { setFilter } = useFilter();
  const { setColorschemeState } = useColorschemeState();
  const { graphState, setGraphState } = useGraphState();
  const { graphFlags, setGraphFlags } = useGraphFlags();
  const { setGraphMetrics } = useGraphMetrics();

  useEffect(() => {
    if (!graphState.originGraph || !graphState.activeGraphNames || graphFlags.isPreprocessed) return;
    log.info("Forwarding graph to the render component");

    const graph = graphState.originGraph;
    console.log("GRAPH", graph);

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

    setGraphState("graph", graph);
    setGraphFlags("isPreprocessed", true);
  }, [graphState.originGraph]);
};
