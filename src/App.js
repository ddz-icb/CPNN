import "./index.css";
import log from "./logger.js";
import { useEffect } from "react";

import { ForceGraph } from "./components/application_service/forceGraph.js";
import { Sidebar } from "./components/gui/sidebar/sidebar.js";
import { HeaderBar } from "./components/gui/headerbar/headerbar.js";
import {
  applyNodeMapping,
  getLinkAttribsToColorIndices,
  getLinkWeightMinMax,
  getNodeAttribsToColorIndices,
  mergeSameProteins,
} from "./components/application_service/graphCalculations.js";

import { Error } from "./components/gui/error.js";
import { linkThresholdInit } from "./components/adapters/state/filterState.js";
import { useFilter } from "./components/adapters/state/filterState.js";
import { useAppearance } from "./components/adapters/state/appearanceState.js";
import { useError } from "./components/adapters/state/errorState.js";
import { resetService } from "./components/application_service/resetService.js";
import { useMappingState } from "./components/adapters/state/mappingState.js";
import { useColorschemeState } from "./components/adapters/state/colorschemeState.js";
import { Init } from "./components/application_service/initService.js";
import { graphService } from "./components/application_service/graphService.js";

function App() {
  const { setFilter, setAllFilter } = useFilter();
  const { appearance, setAppearance } = useAppearance();
  const { colorschemeState, setColorschemeState } = useColorschemeState();
  const { mappingState, setMappingState } = useMappingState();
  const { error, setError, clearError } = useError();

  // reloads graph //
  useEffect(() => {
    async function reloadGraph() {
      let graph = await graphService.getJoinedGraph(graphService.getActiveGraphNames());
      graph.data = mergeSameProteins(graph.data, graphService.getMergeProteins());
      graph.data = applyNodeMapping(graph.data, mappingState.activeMapping?.data);
      graphService.setOriginGraph(graph);
      graphService.setActiveGraphNames(graphService.getActiveGraphNames());
      graphService.setGraphIsPreprocessed(false);
      resetService.simulationReset();
    }

    if (!graphService.getActiveGraphNames()) return;
    log.info("Reloading graph");

    try {
      reloadGraph();
    } catch (error) {
      setError("Error loading graph");
      log.error("Error loading graph:", error);
    }
  }, [graphService.getMergeProteins(), mappingState.activeMapping, graphService.getActiveGraphNames()]);

  // forwards graph to forceGraph component //
  useEffect(() => {
    if (!graphService.getOriginGraph() || !graphService.getActiveGraphNames() || graphService.getGraphIsPreprocessed()) return;
    log.info("Modifying graph and forwarding it to the simulation component");

    let newGraph = structuredClone(graphService.getOriginGraph());

    const { minWeight, maxWeight } = getLinkWeightMinMax(newGraph.data);
    if (minWeight != Infinity) {
      graphService.setLinkWeightMin(minWeight);
    }
    if (maxWeight != -Infinity) {
      graphService.setLinkWeightMax(maxWeight);
    }

    if (minWeight != Infinity && minWeight > linkThresholdInit) {
      setFilter("linkThreshold", minWeight);
      setFilter("linkThresholdText", minWeight);
    }

    const nodeAttribsToColorIndices = getNodeAttribsToColorIndices(newGraph.data);
    setColorschemeState("nodeAttribsToColorIndices", nodeAttribsToColorIndices);

    const linkAttribsToColorIndices = getLinkAttribsToColorIndices(newGraph.data);
    setColorschemeState("linkAttribsToColorIndices", linkAttribsToColorIndices);

    graphService.setOriginGraph(newGraph);
    graphService.setGraph(newGraph);
    graphService.setGraphIsPreprocessed(true);
  }, [graphService.getOriginGraph(), graphService.getActiveGraphNames()]);

  return (
    <>
      <Init />
      <main className={appearance.theme.name}>
        <HeaderBar />
        <Sidebar />
        <div className="canvas">
          <ForceGraph />
          <Error />
        </div>
      </main>
    </>
  );
}
export default App;
