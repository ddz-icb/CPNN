import "./index.css";
import log from "./logger.js";
import { useEffect } from "react";

import { RenderCanvas } from "./components/application_service/renderCanvas.js";
import { Sidebar } from "./components/gui/sidebar/sidebar.js";
import { HeaderBar } from "./components/gui/headerbar/headerbar.js";
import {
  applyNodeMapping,
  getLinkAttribsToColorIndices,
  getLinkWeightMinMax,
  getNodeAttribsToColorIndices,
  mergeProteins,
} from "./components/domain_service/graphCalculations.js";

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
import { useGraphState } from "./components/adapters/state/graphState.js";

function App() {
  const { setFilter, setAllFilter } = useFilter();
  const { appearance, setAppearance } = useAppearance();
  const { error, setError, clearError } = useError();
  const { colorschemeState, setColorschemeState } = useColorschemeState();
  const { mappingState, setMappingState } = useMappingState();
  const { graphState, setGraphState } = useGraphState();

  // reloads graph //
  useEffect(() => {
    async function reloadGraph() {
      let graph = await graphService.getJoinedGraph(graphState.activeGraphNames);
      graph.data = mergeProteins(graph.data, graphState.mergeProteins);
      graph.data = applyNodeMapping(graph.data, mappingState.activeMapping?.data);
      setGraphState("originGraph", graph);
      setGraphState("activeGraphNames", graphState.activeGraphNames);
      setGraphState("graphIsPreprocessed", false);
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
  }, [graphState.mergeProteins, mappingState.activeMapping, graphState.activeGraphNames]);

  // forwards graph to forceGraph component //
  useEffect(() => {
    if (!graphState.originGraph || !graphState.activeGraphNames || graphState.graphIsPreprocessed) return;
    log.info("Modifying graph and forwarding it to the simulation component");

    let newGraph = structuredClone(graphState.originGraph);

    const { minWeight, maxWeight } = getLinkWeightMinMax(newGraph.data);
    if (minWeight != Infinity) {
      setGraphState("linkWeightMin", minWeight);
    }
    if (maxWeight != -Infinity) {
      setGraphState("linkWeightMax", maxWeight);
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
    setGraphState("graphIsPreprocessed", true);
  }, [graphState.originGraph, graphState.activeGraphNames]);

  return (
    <>
      <Init />
      <main className={appearance.theme.name}>
        <HeaderBar />
        <Sidebar />
        <div className="canvas">
          <RenderCanvas />
          <Error />
        </div>
      </main>
    </>
  );
}
export default App;
