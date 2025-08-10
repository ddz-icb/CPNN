import "./index.css";
import log from "./logger.js";
import { useState, useEffect } from "react";

import { ForceGraph } from "./components/application_service/forceGraph.js";
import { Sidebar } from "./components/gui/sidebar/sidebar.js";
import { HeaderBar } from "./components/gui/headerbar/headerBar.js";
import {
  applyNodeMapping,
  getLinkAttribsToColorIndices,
  getLinkWeightMinMax,
  getNodeAttribsToColorIndices,
  joinGraphs,
  mergeSameProteins,
} from "./components/application_service/graphCalculations.js";
import {
  addActiveGraphFile as addActiveGraph,
  addNewGraphFile as CreateGraph,
  deleteGraphFile,
  loadGraphFileNames,
  removeActiveGraphFile,
  selectGraph,
  setInitGraph,
} from "./components/domain_service/graphFileFunctions.js";
import {
  addNewColorScheme as createColorScheme,
  deleteColorScheme,
  loadColorSchemeNames,
  selectLinkColorScheme,
  selectNodeColorScheme,
  setInitColorSchemes,
} from "./components/domain_service/colorSchemeFileFunctions.js";

import { useAppearance, useDownload, useFilter, useGraphData, usePhysics } from "./states.js";
import { Erorr } from "./components/other/error.js";
import { defaultColorSchemes } from "./components/config/appearanceInitValues.js";
import { getFileNameWithoutExtension } from "./components/other/parseFiles.js";
import { getGraphDB } from "./components/repository/repoGraphs.js";
import { downloadInit } from "./components/config/downloadInitValues.js";
import { physicsInit } from "./components/config/physicsInitValues.js";
import { filterInit, linkThresholdInit } from "./components/config/filterInitValues.js";
import {
  addNewMappingFile as createMapping,
  deleteMapping as deleteMapping,
  loadMappings,
  selectMapping,
} from "./components/domain_service/mappingFileFunctions.js";
import { loadTheme, storeTheme } from "./components/domain_service/themeFileFunctions.js";

function App() {
  const { setFilter, setAllFilter } = useFilter();
  const { setAllPhysics } = usePhysics();
  const { appearance, setAppearance } = useAppearance();
  const { download, setDownload } = useDownload();
  const { graphData, setGraphData } = useGraphData();

  const [reset, setReset] = useState(false); // true indicates that the simulation (in forceGraph.js) has to be reloaded
  const [error, setError] = useState(null); // error gets printed on screen

  // GRAPH
  ////////

  const handleCreateGraph = async (
    event,
    takeAbs,
    minCorrForEdge,
    minCompSizeForNode,
    maxCompSizeForNode,
    takeSpearmanCoefficient,
    mergeSameProtein
  ) => {
    const file = event.target.files[0];
    if (!event || !event.target || !file) return;
    log.info("Adding new graph file");

    CreateGraph(
      file,
      graphData.uploadedGraphFileNames,
      setGraphData,
      takeAbs,
      minCorrForEdge,
      minCompSizeForNode,
      maxCompSizeForNode,
      takeSpearmanCoefficient,
      mergeSameProtein
    )
      .then(() => {})
      .catch((error) => {
        setError(`${error.message}`);
        log.error("Error adding graph file:", error);
      });
  };

  const handleSelectGraph = (filename) => {
    if (!filename) return;
    log.info("Replacing graph");

    try {
      simulationReset();
      selectGraph(filename, setGraphData);
      setGraphData("graphIsPreprocessed", false);
      setGraphData("mergeProteins", false);
    } catch (error) {
      setError("Error loading graph");
      log.error("Error loading graph:", error);
    }
  };

  const handleAddActiveGraph = (filename) => {
    if (!filename) return;
    if (graphData.activeGraphFileNames.some((name) => name === filename)) {
      setError("Graph already active");
      log.error("Graph already active");
      return;
    }
    log.info("Adding file with name: ", filename);

    try {
      simulationReset();
      setGraphData("graphIsPreprocessed", false);
      addActiveGraph(filename, graphData.activeGraphFileNames, setGraphData, graphData.originGraph);
    } catch (error) {
      setError("Error loading graph");
      log.error("Error loading graph:", error);
      return;
    }
  };

  // removes graph file from currently active files //
  const handleRemoveActiveGraph = (filename) => {
    if (!filename) return;
    log.info("removing graph file with name:", filename);

    simulationReset();
    setGraphData("graphIsPreprocessed", false);
    removeActiveGraphFile(filename, graphData.activeGraphFileNames, setGraphData);
  };

  // deletes uploaded files with filename //
  const handleDeleteGraph = (filename) => {
    if (!filename) return;
    if (graphData?.activeGraphFileNames?.includes(filename)) {
      log.warn("Cannot remove selected graph as it's still active");
      setError("Cannot remove selected graph as it's still active");
      return;
    }
    log.info("Deleting files with name", filename);

    deleteGraphFile(graphData.uploadedGraphFileNames, filename, setGraphData);
  };

  // MAPPING
  //////////

  // sets corresponding mapping after selection
  const handleSelectMapping = (mappingName) => {
    if (!mappingName) return;
    log.info("Replacing annotation mapping");

    try {
      simulationReset();
      setGraphData("graphIsPreprocessed", false);
      selectMapping(mappingName, setGraphData);
    } catch (error) {
      setError("Mapping is already the current mapping");
      log.error("Mapping is already the current mapping");
    }
  };

  // processes new annotation mapping
  const handleCreateMapping = (event) => {
    const file = event.target.files[0];
    if (!event || !event.target || !file) return;
    if (graphData.uploadedMappingNames.some((name) => getFileNameWithoutExtension(name) === getFileNameWithoutExtension(file.name))) {
      log.warn("Mapping with this name already exists");
      setError("Mapping with this name already exists");
      return;
    }
    log.info("Adding new mapping file");

    createMapping(file, graphData.uploadedMappingNames, setGraphData)
      .then(() => {})
      .catch((error) => {
        setError(`${error.message}`);
        log.error("Error adding mapping file:", error);
      });
  };

  // disables currently active annotation mapping
  const handleRemoveActiveMapping = () => {
    log.info("Removing currently active annotation mapping");

    setGraphData("activeMapping", null);
    setGraphData("graphIsPreprocessed", false);
    simulationReset();
  };

  // deletes annotation mapping files
  const handleDeleteMapping = (mappingName) => {
    if (!mappingName) return;
    if (graphData?.activeMapping?.name == mappingName) {
      log.warn("Cannot remove selected mapping as it's still active");
      setError("Cannot remove selected mapping as it's still active");
      return;
    }
    log.info("Deleting mapping with name", mappingName);

    deleteMapping(graphData.uploadedMappingNames, mappingName, setGraphData);
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

  // initates reset //
  const simulationReset = () => {
    if (!graphData.activeGraphFileNames) return;
    log.info("Handle Simulation Reset");

    setAllFilter(filterInit);
    setAllPhysics(physicsInit);
    setDownload(downloadInit);
    setError(null);
    setReset(true);
  };

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

  // init uploadedGraphFileNames
  useEffect(() => {
    log.info("Loading uploaded graphs");
    try {
      loadGraphFileNames(setGraphData);
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
      loadMappings(setGraphData);
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
      const { graph, file } = await getGraphDB(graphData.activeGraphFileNames[0]);

      let combinedGraph = graph;
      for (let i = 1; i < graphData.activeGraphFileNames.length; i++) {
        let { graph, file } = await getGraphDB(graphData.activeGraphFileNames[i]);
        combinedGraph = joinGraphs(combinedGraph, graph);
      }

      if (graphData.mergeProteins) {
        combinedGraph = mergeSameProteins(combinedGraph);
      }

      setGraphData("originGraph", combinedGraph);
      setGraphData("activeGraphFileNames", graphData.activeGraphFileNames);
    }

    if (graphData.mergeProteins == null || !graphData.graphIsPreprocessed || !graphData.activeGraphFileNames || !graphData.activeGraphFileNames[0])
      return;

    log.info("Merging Proteins: ", graphData.mergeProteins);

    try {
      simulationReset();
      setGraphData("graphIsPreprocessed", false);
      mergedGraph(graphData);
    } catch (error) {
      setError("Error loading graph");
      log.error("Error loading graph:", error);
    }
  }, [graphData.mergeProteins]);

  // forwards graph to forceGraph component //
  useEffect(() => {
    if (!graphData.originGraph || !graphData.activeGraphFileNames || graphData.graphIsPreprocessed) return;
    log.info("Modifying graph and forwarding it to the simulation component");

    let newGraph = structuredClone(graphData.originGraph);
    newGraph = applyNodeMapping(newGraph, graphData.activeMapping);

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
  }, [graphData.originGraph, graphData.activeGraphFileNames, graphData.activeMapping]);

  return (
    <div className={appearance.theme.name}>
      <HeaderBar />
      <Sidebar
        handleSelectGraph={handleSelectGraph}
        handleDeleteGraphFile={handleDeleteGraph}
        handleRemoveActiveGraphFile={handleRemoveActiveGraph}
        handleAddFile={handleAddActiveGraph}
        handleNewMapping={handleCreateMapping}
        handleRemoveActiveMapping={handleRemoveActiveMapping}
        handleMappingSelect={handleSelectMapping}
        handleDeleteMapping={handleDeleteMapping}
        handleNewGraphFile={handleCreateGraph}
        handleNewColorScheme={handleCreateColorScheme}
        handleDeleteColorScheme={handleDeleteColorScheme}
        handleSelectLinkColorScheme={handleSelectLinkColorScheme}
        handleSelectNodeColorScheme={handleSelectNodeColorScheme}
      />
      <main>
        {error && <Erorr error={error} setError={setError} />}
        <ForceGraph reset={reset} setReset={setReset} setError={setError} />
      </main>
    </div>
  );
}
export default App;
