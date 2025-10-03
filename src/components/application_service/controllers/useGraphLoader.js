import log from "../../adapters/logging/logger.js";
import { useError } from "../../adapters/state/errorState.js";
import { useGraphFlags } from "../../adapters/state/graphFlagsState.js";
import { useGraphState } from "../../adapters/state/graphState.js";
import { useMappingState } from "../../adapters/state/mappingState.js";
import { useEffect } from "react";
import { graphService } from "../services/graphService.js";
import { resetService } from "../services/resetService.js";
import { filterMergeProteins } from "../../domain_service/graph_calculations/filterGraph.js";
import { applyNodeMapping } from "../../domain_service/graph_calculations/applyMapping.js";
import { usePhysics } from "../../adapters/state/physicsState.js";

export const useGraphLoader = () => {
  const { graphState, setGraphState } = useGraphState();
  const { setError } = useError();
  const { mappingState } = useMappingState();
  const { graphFlags } = useGraphFlags();

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
};
