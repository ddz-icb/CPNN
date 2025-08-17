import "./index.css";
import log from "./components/adapters/logging/logger.js";
import { useEffect } from "react";

import { Sidebar } from "./components/gui/sidebar/sidebar.js";
import { HeaderBar } from "./components/gui/headerbar/headerbar.js";
import {
  getLinkAttribsToColorIndices,
  getLinkWeightMinMax,
  getNodeAttribsToColorIndices,
} from "./components/domain_service/graph_calculations/graphUtils.js";

import { Error } from "./components/gui/error.js";
import { linkThresholdInit } from "./components/adapters/state/filterState.js";
import { useFilter } from "./components/adapters/state/filterState.js";
import { useError } from "./components/adapters/state/errorState.js";
import { resetService } from "./components/application_service/services/resetService.js";
import { useMappingState } from "./components/adapters/state/mappingState.js";
import { useColorschemeState } from "./components/adapters/state/colorschemeState.js";
import { Init } from "./components/application_service/controllers/initControl.js";
import { graphService } from "./components/application_service/services/graphService.js";
import { useGraphState } from "./components/adapters/state/graphState.js";
import { filterMergeProteins } from "./components/domain_service/graph_calculations/filterGraph.js";
import { applyNodeMapping } from "./components/domain_service/graph_calculations/applyMapping.js";
import { useTheme } from "./components/adapters/state/themeState.js";
import { RenderGraph } from "./components/application_service/controllers/renderControl.js";
import { useGraphMetrics } from "./components/adapters/state/graphMetricsState.js";

function App() {
  const { setFilter, setAllFilter } = useFilter();
  const { theme, setTheme } = useTheme();
  const { error, setError, clearError } = useError();
  const { colorschemeState, setColorschemeState } = useColorschemeState();
  const { mappingState, setMappingState } = useMappingState();
  const { graphState, setGraphState } = useGraphState();
  const { graphMetrics, setGraphMetrics } = useGraphMetrics();

  // reloads graph //
  useEffect(() => {
    async function reloadGraph() {
      let graph = await graphService.getJoinedGraph(graphState.activeGraphNames);
      graph.data = filterMergeProteins(graph.data, graphState.mergeProteins);
      graph.data = applyNodeMapping(graph.data, mappingState.mapping?.data);
      setGraphState("originGraph", graph);
      setGraphState("activeGraphNames", graphState.activeGraphNames);
      setGraphState("isPreprocessed", false);
      resetService.resetSimulation();
    }

    if (!graphState.activeGraphNames) return;
    log.info("Reloading graph");

    try {
      reloadGraph();
    } catch (error) {
      setError("Error loading graph");
      log.error("Error loading graph:", error);
    }
  }, [graphState.mergeProteins, mappingState.mapping, graphState.activeGraphNames]);

  // forwards graph to forceGraph component //
  useEffect(() => {
    if (!graphState.originGraph || !graphState.activeGraphNames || graphState.isPreprocessed) return;
    log.info("Modifying graph and forwarding it to the simulation component");

    let newGraph = structuredClone(graphState.originGraph);

    const { minWeight, maxWeight } = getLinkWeightMinMax(newGraph.data);
    if (minWeight != Infinity) {
      setGraphMetrics("linkWeightMin", minWeight);
    }
    if (maxWeight != -Infinity) {
      setGraphMetrics("linkWeightMax", maxWeight);
    }

    if (minWeight != Infinity && minWeight > linkThresholdInit) {
      setFilter("linkThreshold", minWeight);
      setFilter("linkThresholdText", minWeight);
    }

    const nodeAttribsToColorIndices = getNodeAttribsToColorIndices(newGraph.data);
    setColorschemeState("nodeAttribsToColorIndices", nodeAttribsToColorIndices);

    const linkAttribsToColorIndices = getLinkAttribsToColorIndices(newGraph.data);
    setColorschemeState("linkAttribsToColorIndices", linkAttribsToColorIndices);

    setGraphState("originGraph", newGraph);
    setGraphState("graph", newGraph);
    setGraphState("isPreprocessed", true);
  }, [graphState.originGraph, graphState.activeGraphNames]);

  return (
    <>
      <Init />
      <main className={theme.name}>
        <HeaderBar />
        <Sidebar />
        <div className="canvas">
          <RenderGraph />
          <Error />
        </div>
      </main>
    </>
  );
}
export default App;
