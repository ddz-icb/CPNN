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

import { linkThresholdInit } from "./components/adapters/state/filterState.js";
import { useFilter } from "./components/adapters/state/filterState.js";
import { useError } from "./components/adapters/state/errorState.js";
import { resetService } from "./components/application_service/services/resetService.js";
import { useMappingState } from "./components/adapters/state/mappingState.js";
import { useColorschemeState } from "./components/adapters/state/colorschemeState.js";
import { InitControl } from "./components/application_service/controllers/initControl.js";
import { graphService } from "./components/application_service/services/graphService.js";
import { useGraphState } from "./components/adapters/state/graphState.js";
import { filterMergeProteins } from "./components/domain_service/graph_calculations/filterGraph.js";
import { applyNodeMapping } from "./components/domain_service/graph_calculations/applyMapping.js";
import { useTheme } from "./components/adapters/state/themeState.js";
import { useGraphMetrics } from "./components/adapters/state/graphMetricsState.js";
import { useGraphFlags } from "./components/adapters/state/graphFlagsState.js";
import { RenderControl } from "./components/application_service/controllers/renderControl.js";
import { PhysicsControl } from "./components/application_service/controllers/physicsControl.js";
import { DownloadControl } from "./components/application_service/controllers/downloadControl.js";
import { FilterControl } from "./components/application_service/controllers/filterControl.js";
import { AppearanceControl } from "./components/application_service/controllers/appearanceControl.js";
import { Error } from "./components/gui/error/error.js";

function App() {
  const { setFilter } = useFilter();
  const { theme } = useTheme();
  const { setError } = useError();
  const { setColorschemeState } = useColorschemeState();
  const { mappingState } = useMappingState();
  const { graphState, setGraphState } = useGraphState();
  const { graphFlags, setGraphFlags } = useGraphFlags();
  const { setGraphMetrics } = useGraphMetrics();

  // sets origin graph //
  useEffect(() => {
    if (!graphState.activeGraphNames) return;
    log.info("Reloading graph");

    async function reloadGraph() {
      let graph = await graphService.getJoinedGraph(graphState.activeGraphNames);
      graph.data = filterMergeProteins(graph.data, graphFlags.mergeProteins);
      graph.data = applyNodeMapping(graph.data, mappingState.mapping?.data);
      setGraphState("originGraph", graph);
      resetService.resetSimulation();
    }

    try {
      reloadGraph();
    } catch (error) {
      setError("Error loading graph");
      log.error("Error loading graph:", error);
    }
  }, [graphFlags.mergeProteins, mappingState.mapping, graphState.activeGraphNames]);

  // sets working graph //
  useEffect(() => {
    if (!graphState.originGraph || !graphState.activeGraphNames || graphFlags.isPreprocessed) return;
    log.info("Modifying graph and forwarding it to the simulation component");

    const graph = structuredClone(graphState.originGraph);

    const { minWeight, maxWeight } = getLinkWeightMinMax(graph.data);
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

    const nodeAttribsToColorIndices = getNodeAttribsToColorIndices(graph.data);
    setColorschemeState("nodeAttribsToColorIndices", nodeAttribsToColorIndices);

    const linkAttribsToColorIndices = getLinkAttribsToColorIndices(graph.data);
    setColorschemeState("linkAttribsToColorIndices", linkAttribsToColorIndices);

    setGraphState("graph", graph);
    setGraphFlags("isPreprocessed", true);
  }, [graphState.originGraph]);

  return (
    <>
      <AppearanceControl />
      <DownloadControl />
      <FilterControl />
      <PhysicsControl />
      <InitControl />
      <main className={theme.name}>
        <HeaderBar />
        <Sidebar />
        <div className="canvas">
          <RenderControl />
          <Error />
        </div>
      </main>
    </>
  );
}
export default App;
