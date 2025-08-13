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
  joinGraphs,
  mergeSameProteins,
} from "./components/application_service/graphCalculations.js";

import { Error } from "./components/gui/error.js";
import { getGraphDB } from "./components/repository/graphRepo.js";
import { linkThresholdInit } from "./components/adapters/state/filterState.js";
import { useFilter } from "./components/adapters/state/filterState.js";
import { useAppearance } from "./components/adapters/state/appearanceState.js";
import { useGraphData } from "./components/adapters/state/graphState.js";
import { useError } from "./components/adapters/state/errorState.js";
import { resetService } from "./components/application_service/resetService.js";
import { useMappingData } from "./components/adapters/state/mappingState.js";
import { useColorscheme } from "./components/adapters/state/colorschemeState.js";
import { Init } from "./components/application_service/initService.js";

function App() {
  const { setFilter, setAllFilter } = useFilter();
  const { appearance, setAppearance } = useAppearance();
  const { colorscheme, setColorscheme } = useColorscheme();
  const { graphData, setGraphData } = useGraphData();
  const { mappingData, setMappingData } = useMappingData();
  const { error, setError, clearError } = useError();

  // merge Proteins function initiation (THIS SHOULD DEFINETLY NOT BE HERE)
  useEffect(() => {
    async function mergedGraph(graphData) {
      const { graph, file } = await getGraphDB(graphData.activeGraphNames[0]);

      let combinedGraph = graph;
      for (let i = 1; i < graphData.activeGraphNames.length; i++) {
        let { graph, file } = await getGraphDB(graphData.activeGraphNames[i]);
        combinedGraph = joinGraphs(combinedGraph, graph);
      }

      if (graphData.mergeProteins) {
        combinedGraph = mergeSameProteins(combinedGraph);
      }

      setGraphData("originGraph", combinedGraph);
      setGraphData("activeGraphNames", graphData.activeGraphNames);
    }

    if (graphData.mergeProteins == null || !graphData.graphIsPreprocessed || !graphData.activeGraphNames || !graphData.activeGraphNames[0]) return;

    log.info("Merging Proteins: ", graphData.mergeProteins);

    try {
      resetService.simulationReset();
      setGraphData("graphIsPreprocessed", false);
      mergedGraph(graphData);
    } catch (error) {
      setError("Error loading graph");
      log.error("Error loading graph:", error);
    }
  }, [graphData.mergeProteins]);

  // forwards graph to forceGraph component //
  useEffect(() => {
    if (!graphData.originGraph || !graphData.activeGraphNames || graphData.graphIsPreprocessed) return;
    log.info("Modifying graph and forwarding it to the simulation component");

    let newGraph = structuredClone(graphData.originGraph);
    newGraph = applyNodeMapping(newGraph, mappingData.activeMapping);

    const { minWeight, maxWeight } = getLinkWeightMinMax(newGraph);
    if (minWeight != Infinity) {
      setGraphData("linkWeightMin", minWeight);
    }
    if (maxWeight != -Infinity) {
      setGraphData("linkWeightMax", maxWeight);
    }

    if (minWeight != Infinity && minWeight > linkThresholdInit) {
      setFilter("linkThreshold", minWeight);
      setFilter("linkThresholdText", minWeight);
    }

    const nodeAttribsToColorIndices = getNodeAttribsToColorIndices(newGraph);
    setColorscheme("nodeAttribsToColorIndices", nodeAttribsToColorIndices);

    const linkAttribsToColorIndices = getLinkAttribsToColorIndices(newGraph);
    setColorscheme("linkAttribsToColorIndices", linkAttribsToColorIndices);

    setGraphData("originGraph", newGraph);
    setGraphData("graph", newGraph);
    setGraphData("graphIsPreprocessed", true);
  }, [graphData.originGraph, graphData.activeGraphNames, mappingData.activeMapping]);

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
