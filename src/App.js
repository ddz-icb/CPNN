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
import { loadGraphNames, setInitGraph } from "./components/domain_service/graphManager.js";
import {
  createColorScheme,
  deleteColorScheme,
  loadColorSchemeNames,
  selectLinkColorScheme,
  selectNodeColorScheme,
  setInitColorSchemes,
} from "./components/domain_service/colorSchemeManager.js";

import { Error } from "./components/gui/error.js";
import { defaultColorSchemes } from "./components/adapters/state/appearanceState.js";
import { getFileNameWithoutExtension } from "./components/other/parseFiles.js";
import { getGraphDB } from "./components/repository/GraphRepo.js";
import { linkThresholdInit } from "./components/adapters/state/filterState.js";
import { createMapping, deleteMapping, loadMappings, selectMapping } from "./components/domain_service/mappingManager.js";
import { loadTheme, storeTheme } from "./components/domain_service/themeManager.js";
import { useFilter } from "./components/adapters/state/filterState.js";
import { usePhysics } from "./components/adapters/state/physicsState.js";
import { useAppearance } from "./components/adapters/state/appearanceState.js";
import { useDownload } from "./components/adapters/state/downloadState.js";
import { useGraphData } from "./components/adapters/state/graphState.js";
import { useError } from "./components/adapters/state/errorState.js";
import { resetService } from "./components/application_service/resetService.js";
import { useMappingData } from "./components/adapters/state/mappingState.js";

function App() {
  const { setFilter, setAllFilter } = useFilter();
  const { setAllPhysics } = usePhysics();
  const { appearance, setAppearance } = useAppearance();
  const { download, setDownload } = useDownload();
  const { graphData, setGraphData } = useGraphData();
  const { mappingData, setMappingData } = useMappingData();
  const { error, setError, clearError } = useError();

  // MAPPING
  //////////

  // sets corresponding mapping after selection
  const handleSelectMapping = (mappingName) => {
    if (!mappingName) return;
    log.info("Replacing annotation mapping");

    try {
      resetService.simulationReset();
      setGraphData("graphIsPreprocessed", false);
      selectMapping(mappingName, setMappingData);
    } catch (error) {
      setError("Mapping is already the current mapping");
      log.error("Mapping is already the current mapping");
    }
  };

  // processes new annotation mapping
  const handleCreateMapping = (event) => {
    const file = event.target.files[0];
    if (!event || !event.target || !file) return;
    if (mappingData.uploadedMappingNames.some((name) => getFileNameWithoutExtension(name) === getFileNameWithoutExtension(file.name))) {
      log.warn("Mapping with this name already exists");
      setError("Mapping with this name already exists");
      return;
    }
    log.info("Adding new mapping file");

    createMapping(file, mappingData.uploadedMappingNames, setMappingData)
      .then(() => {})
      .catch((error) => {
        setError(`${error.message}`);
        log.error("Error adding mapping file:", error);
      });
  };

  // disables currently active annotation mapping
  const handleRemoveActiveMapping = () => {
    log.info("Removing currently active annotation mapping");

    setMappingData("activeMapping", null);
    setGraphData("graphIsPreprocessed", false);
    resetService.simulationReset();
  };

  // deletes annotation mapping files
  const handleDeleteMapping = (mappingName) => {
    if (!mappingName) return;
    if (mappingData?.activeMapping?.name == mappingName) {
      log.warn("Cannot remove selected mapping as it's still active");
      setError("Cannot remove selected mapping as it's still active");
      return;
    }
    log.info("Deleting mapping with name", mappingName);

    deleteMapping(mappingData.uploadedMappingNames, mappingName, setMappingData);
  };

  // COLOR SCHEME
  ///////////////

  const handleSelectLinkColorScheme = (colorSchemeName) => {
    if (!colorSchemeName) return;
    log.info("Replacing link color scheme");

    try {
      selectLinkColorScheme(colorSchemeName, setAppearance);
    } catch (error) {
      setError("Color scheme is already the current link color scheme");
      log.error("Color scheme is already the current link color scheme");
    }
  };

  const handleSelectNodeColorScheme = (colorSchemeName) => {
    if (!colorSchemeName) return;
    log.info("Replacing node color scheme");

    try {
      selectNodeColorScheme(colorSchemeName, setAppearance);
    } catch (error) {
      setError("Color scheme is already the current node color scheme");
      log.error("Color scheme is already the current node color scheme");
    }
  };

  // adds new color scheme
  const handleCreateColorScheme = async (event) => {
    const file = event.target.files[0];
    if (!event || !event.target || !file) return;
    if (appearance.uploadedColorSchemeNames.some((name) => getFileNameWithoutExtension(name) === getFileNameWithoutExtension(file.name))) {
      log.warn("Color scheme with this name already exists");
      setError("Color scheme with this name already exists");
      return;
    }
    log.info("Adding new color scheme");

    createColorScheme(file, appearance.uploadedColorSchemeNames, setAppearance)
      .then(() => {})
      .catch((error) => {
        setError(`${error.message}`);
        log.error("Error adding color scheme:", error);
      });
  };

  const handleDeleteColorScheme = (colorSchemeName) => {
    if (!colorSchemeName) return;
    if (defaultColorSchemes.some((scheme) => scheme.name === colorSchemeName)) {
      log.warn("Cannot remove default color schemes");
      setError("Cannot remove default color schemes");
      return;
    }
    if (appearance.nodeColorScheme?.name == colorSchemeName || appearance.linkColorScheme?.name == colorSchemeName) {
      log.warn("Cannot remove selected color scheme as it's still active");
      setError("Cannot remove selected color scheme as it's still active");
      return;
    }
    log.info("Deleting color schemes with name", colorSchemeName);

    deleteColorScheme(appearance.uploadedColorSchemeNames, colorSchemeName, setAppearance);
  };

  // INIT STUFF
  //////////////////////////////////////////////
  //////////////////////////////////////////////

  // select example graph on startup
  useEffect(() => {
    log.info("Setting init graph");
    setInitGraph(setGraphData);
    setGraphData("graphIsPreprocessed", false);
  }, []);

  // select default color schemes on startup
  useEffect(() => {
    log.info("Setting init color schemes");
    setInitColorSchemes(appearance, setAppearance);
  }, []);

  // init uploadedGraphNames
  useEffect(() => {
    log.info("Loading uploaded graphs");
    try {
      loadGraphNames(setGraphData);
    } catch (error) {
      setError("Error loading graphs from database");
      log.error("Error loading graphs from database");
    }
  }, []);

  // load current theme
  useEffect(() => {
    log.info("Loading selected theme");
    loadTheme(setAppearance);
  }, []);

  // store current theme //
  useEffect(() => {
    if (!appearance.theme) return;
    log.info("Storing current theme if needed");

    storeTheme(appearance.theme);
  }, [appearance.theme]);

  // init uploadedMappingFileNames
  useEffect(() => {
    log.info("Loading uploaded mappings");
    try {
      loadMappings(setMappingData);
    } catch (error) {
      setError("Error loading mappings form database");
      log.error("Error loading mappings form database");
    }
  }, []);

  // init uploadedColorSchemeNames //
  useEffect(() => {
    log.info("Loading uploaded color schemes");
    try {
      loadColorSchemeNames(setAppearance);
    } catch (error) {
      setError("Error loading color schemes from database");
      log.error("Error loading color schemes from database");
    }
  }, []);

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

    // set max comp size = amount of nodes

    const nodeAttribsToColorIndices = getNodeAttribsToColorIndices(newGraph);
    setAppearance("nodeAttribsToColorIndices", nodeAttribsToColorIndices);

    const linkAttribsToColorIndices = getLinkAttribsToColorIndices(newGraph);
    setAppearance("linkAttribsToColorIndices", linkAttribsToColorIndices);

    setGraphData("originGraph", newGraph);
    setGraphData("graph", newGraph);
    setGraphData("graphIsPreprocessed", true);
  }, [graphData.originGraph, graphData.activeGraphNames, mappingData.activeMapping]);

  return (
    <div className={appearance.theme.name}>
      <HeaderBar />
      <Sidebar
        handleCreateMapping={handleCreateMapping}
        handleRemoveActiveMapping={handleRemoveActiveMapping}
        handleMappingSelect={handleSelectMapping}
        handleDeleteMapping={handleDeleteMapping}
        handleNewColorScheme={handleCreateColorScheme}
        handleDeleteColorScheme={handleDeleteColorScheme}
        handleSelectLinkColorScheme={handleSelectLinkColorScheme}
        handleSelectNodeColorScheme={handleSelectNodeColorScheme}
      />
      <main>
        <Error />
        <ForceGraph />
      </main>
    </div>
  );
}
export default App;
