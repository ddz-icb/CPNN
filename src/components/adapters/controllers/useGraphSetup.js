import log from "../logging/logger.js";
import { useColorschemeState } from "../state/colorschemeState.js";
import { filterInit, linkThresholdInit, useFilter } from "../state/filterState.js";
import { useGraphFlags } from "../state/graphFlagsState.js";
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
import { graphService } from "../../application/services/graphService.js";
import { resetService } from "../../application/services/resetService.js";
import { filterMergeByName } from "../../domain/service/graph_calculations/filterGraph.js";
import { applyNodeMapping } from "../../domain/service/graph_calculations/applyMapping.js";

export const useGraphSetup = () => {
  const { setFilter } = useFilter();
  const { setColorschemeState } = useColorschemeState();
  const { graphState, setGraphState } = useGraphState();
  const { graphFlags, setGraphFlags } = useGraphFlags();
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

    async function reloadGraph() {
      try {
        let graph = await graphService.getJoinedGraph(graphState.activeGraphNames);
        graph.data = filterMergeByName(graph.data, graphFlags.mergeByName);
        graph.data = applyNodeMapping(graph.data, mappingState.mapping?.data);
        setGraphState("originGraph", graph);

        resetService.resetSimulation();
      } catch (error) {
        setError("Error loading graph");
        log.error("Error loading graph:", error);
      }
    }

    reloadGraph();
  }, [graphFlags.mergeByName, mappingState.mapping, graphState.activeGraphNames]);

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
      setFilter("linkThreshold", minWeight);
      setFilter("linkThresholdText", minWeight);
    }

    if (!keepMapping) {
      setColorschemeState("nodeAttribsToColorIndices", getNodeAttribsToColorIndices(graph.data));
      setColorschemeState("linkAttribsToColorIndices", getLinkAttribsToColorIndices(graph.data));
    }

    // incase user uploaded graph including physics
    if (graph.data.physics) {
      setAllPhysics(graph.data.physics);
    }
    if (graph.data.filter) {
      setAllFilter({ ...filterInit, ...graph.data.filter });
    }

    setKeepMapping(false);
    setGraphState("graph", graph);
    setGraphFlags("isPreprocessed", true);
  }, [graphState.originGraph]);
};
