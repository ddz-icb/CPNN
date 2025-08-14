import "./index.css";
import log from "./logger.js";
import { useEffect } from "react";

import { ForceGraph } from "./components/application_service/forceGraph.js";
import { Sidebar } from "./components/gui/sidebar/sidebar.js";
import { HeaderBar } from "./components/gui/headerbar/headerbar.js";
import {
  applyNodeMapping,
  getJoinedGraphName,
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
import { useError } from "./components/adapters/state/errorState.js";
import { resetService } from "./components/application_service/resetService.js";
import { useMappingData } from "./components/adapters/state/mappingState.js";
import { useColorscheme } from "./components/adapters/state/colorschemeState.js";
import { Init } from "./components/application_service/initService.js";
import { useGraphState } from "./components/adapters/state/graphState.js";

function App() {
  const { setFilter, setAllFilter } = useFilter();
  const { appearance, setAppearance } = useAppearance();
  const { colorscheme, setColorscheme } = useColorscheme();
  const { graphState, setGraphState } = useGraphState();
  const { mappingData, setMappingData } = useMappingData();
  const { error, setError, clearError } = useError();

  // merge Proteins function initiation (THIS SHOULD DEFINETLY NOT BE HERE)
  useEffect(() => {
    async function joinedGraph(graphState) {
      let graph = await getGraphDB(graphState.activeGraphNames[0]);

      let joinedGraphData = graph.data;
      for (let i = 1; i < graphState.activeGraphNames.length; i++) {
        graph = await getGraphDB(graphState.activeGraphNames[i]);
        joinedGraphData = joinGraphs(joinedGraphData, graph.data);
      }

      if (graphState.mergeProteins) {
        joinedGraphData = mergeSameProteins(joinedGraphData);
      }

      const joinedGraphName = getJoinedGraphName(graphState.activeGraphNames);
      const joinedGraph = { name: joinedGraphName, data: joinedGraphData };

      setGraphState("originGraph", joinedGraph);
      setGraphState("activeGraphNames", graphState.activeGraphNames);
    }

    if (graphState.mergeProteins == null || !graphState.graphIsPreprocessed || !graphState.activeGraphNames || !graphState.activeGraphNames[0])
      return;

    log.info("Merging Proteins: ", graphState.mergeProteins);

    try {
      resetService.simulationReset();
      setGraphState("graphIsPreprocessed", false);
      joinedGraph(graphState);
    } catch (error) {
      setError("Error loading graph");
      log.error("Error loading graph:", error);
    }
  }, [graphState.mergeProteins]);

  // forwards graph to forceGraph component //
  useEffect(() => {
    if (!graphState.originGraph || !graphState.activeGraphNames || graphState.graphIsPreprocessed) return;
    log.info("Modifying graph and forwarding it to the simulation component");

    let newGraph = structuredClone(graphState.originGraph);
    newGraph.data = applyNodeMapping(newGraph.data, mappingData.activeMapping);

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
    setColorscheme("nodeAttribsToColorIndices", nodeAttribsToColorIndices);

    const linkAttribsToColorIndices = getLinkAttribsToColorIndices(newGraph.data);
    setColorscheme("linkAttribsToColorIndices", linkAttribsToColorIndices);

    setGraphState("originGraph", newGraph);
    setGraphState("graph", newGraph);
    setGraphState("graphIsPreprocessed", true);
  }, [graphState.originGraph, graphState.activeGraphNames, mappingData.activeMapping]);

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
