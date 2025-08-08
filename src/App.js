import "./index.css";
import log from "./logger.js";
import { useState, useEffect } from "react";

import { ForceGraph } from "./components/GraphStuff/forceGraph.js";
import { Sidebar } from "./components/GUI/sidebar.js";
import { HeaderBar } from "./components/GUI/headerBar.js";
import {
  applyNodeMapping,
  getDifferenceGraph,
  getIdsHavePhosphosites,
  getLinkAttribsToColorIndices,
  getLinkWeightMinMax,
  getNodeAttribsToColorIndices,
  joinGraphs,
  mergeSameProteins,
} from "./components/GraphStuff/graphCalculations.js";
import { resetFilterSettings, resetPhysicsSettings } from "./components/Other/reset.js";
import {
  addActiveGraphFile,
  addNewAnnotationMappingFile,
  addNewColorScheme,
  addNewGraphFile,
  deleteAnnotationMapping,
  deleteGraphFile,
  loadAnnotationMappings,
  loadColorSchemes,
  loadGraphFileNames,
  loadTheme,
  removeActiveGraphFile,
  removeColorScheme,
  selectGraph,
  selectMapping,
  setInitGraph,
  storeColorSchemes,
  storeTheme,
} from "./components/Other/applicationFunctions.js";
import { useFilter, useGraphData, useSettings } from "./states.js";
import { Erorr } from "./components/Other/error.js";
import { colorSchemesInit } from "./components/Other/appearance.js";
import { getFileNameWithoutExtension } from "./components/Other/parseFiles.js";
import { getGraphDB } from "./components/Other/dbGraphs.js";

function App() {
  const { settings, setSettings } = useSettings();
  const { filter, setFilter } = useFilter();
  const { graphData, setGraphData } = useGraphData(); // includes all data concerning the graph

  const [reset, setReset] = useState(false); // true indicates that the simulation (in forceGraph.js) has to be reloaded
  const [error, setError] = useState(null); // error gets printed on screen

  const [colorSchemes, setColorSchemes] = useState(null); // all color schemes in local storage

  // sets corresponding graph after file selection
  const handleSelectGraph = (filename) => {
    if (!filename) return;
    log.info("Replacing graph");

    try {
      simulationReset();
      selectGraph(filename, setGraphData);
      setGraphData("graphIsPreprocessed", false);
      setGraphData("mergeProteins", false);
      setGraphData("", {
        ...graphData,
        graphIsPreprocessed: false,
        mergeProteins: false,
      });
    } catch (error) {
      setError("Error loading graph");
      log.error("Error loading graph:", error);
    }
  };

  // sets corresponding mapping after selection
  const handleSelectAnnotationMapping = (mappingName) => {
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

  // adds new graph file //
  const handleNewGraphFile = async (
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

    addNewGraphFile(
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

  // adds new color scheme
  const handleNewColorScheme = async (event) => {
    if (!event || !event.target || !event.target.files[0]) return;
    log.info("Adding new color scheme", colorSchemes);

    const file = event.target.files[0];

    if (colorSchemes.some((scheme) => getFileNameWithoutExtension(scheme.name) === getFileNameWithoutExtension(file.name))) {
      log.warn("Mapping with this name already exists");
      setError("Mapping with this name already exists");
      return;
    }

    addNewColorScheme(file, setColorSchemes)
      .then(() => {})
      .catch((error) => {
        setError(`${error.message}`);
        log.error("Error adding color scheme:", error);
      });
  };

  const handleDeleteColorScheme = (colorSchemeName) => {
    if (!colorSchemeName) return;
    if (colorSchemesInit.some((scheme) => scheme.name === colorSchemeName)) {
      log.warn("Cannot remove default color schemes");
      setError("Cannot remove default color schemes");
      return;
    }
    if (settings.appearance.nodeColorScheme.name == colorSchemeName || settings.appearance.linkColorScheme.name == colorSchemeName) {
      log.warn("Cannot remove selected color scheme as it's still active");
      setError("Cannot remove selected color scheme as it's still active");
      return;
    }
    log.info("Deleting color schemes with name", colorSchemeName);

    removeColorScheme(
      colorSchemes,
      setColorSchemes,
      colorSchemeName,
      settings.appearance.nodeColorScheme,
      settings.appearance.linkColorScheme,
      setSettings
    );
  };

  // processes new annotation mapping
  const handleNewAnnotationMapping = (event) => {
    const file = event.target.files[0];
    if (!event || !event.target || !file) return;
    if (graphData.uploadedAnnotationMappingNames.some((name) => getFileNameWithoutExtension(name) === getFileNameWithoutExtension(file.name))) {
      log.warn("Mapping with this name already exists");
      setError("Mapping with this name already exists");
      return;
    }
    log.info("Adding new mapping file");

    addNewAnnotationMappingFile(file, graphData.uploadedAnnotationMappingNames, setGraphData)
      .then(() => {})
      .catch((error) => {
        setError(`${error.message}`);
        log.error("Error adding mapping file:", error);
      });
  };

  // disables currently active annotation mapping
  const handleRemoveActiveAnnotationMapping = () => {
    log.info("Removing currently active annotation mapping");

    setGraphData("activeAnnotationMapping", null);
    setGraphData("graphIsPreprocessed", false);
    simulationReset();
  };

  // deletes annotation mapping files
  const handleDeleteAnnotationMapping = (mappingName) => {
    if (!mappingName) return;
    if (graphData?.activeAnnotationMapping?.name == mappingName) {
      log.warn("Cannot remove selected mapping as it's still active");
      setError("Cannot remove selected mapping as it's still active");
      return;
    }
    log.info("Deleting mapping with name", mappingName);

    deleteAnnotationMapping(graphData.uploadedAnnotationMappingNames, mappingName, setGraphData);
  };

  // deletes uploaded files with filename //
  const handleDeleteGraphFile = (filename) => {
    if (!filename) return;
    if (graphData?.activeGraphFileNames?.includes(filename)) {
      log.warn("Cannot remove selected graph as it's still active");
      setError("Cannot remove selected graph as it's still active");
      return;
    }
    log.info("Deleting files with name", filename);

    deleteGraphFile(graphData.uploadedGraphFileNames, filename, setGraphData);
  };

  // removes graph file from currently active files //
  const handleRemoveActiveGraphFile = (filename) => {
    if (!filename) return;
    log.info("removing graph file with name:", filename);

    simulationReset();
    setGraphData("graphIsPreprocessed", false);
    removeActiveGraphFile(filename, graphData.activeGraphFileNames, setGraphData);
  };

  const handleAddActiveGraphFile = (filename) => {
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
      addActiveGraphFile(filename, graphData.activeGraphFileNames, setGraphData, graphData.originGraph);
    } catch (error) {
      setError("Error loading graph");
      log.error("Error loading graph:", error);
      return;
    }
  };

  async function handleCreateDifferenceGraph(selectedGraphName1, selectedGraphName2, graphData, setGraphData, takeAbs) {
    if (!selectedGraphName1 || !selectedGraphName2) {
      setError("Please select two graphs");
      return;
    }
    if (selectedGraphName1 === selectedGraphName2) {
      setError("Please select two different graphs");
      return;
    }
    log.info("Creating difference graph with following graphs:", selectedGraphName1, selectedGraphName2);

    let obj1 = await getGraphDB(selectedGraphName1);
    let obj2 = await getGraphDB(selectedGraphName2);

    const diffGraph = getDifferenceGraph(obj1.graph, obj2.graph);
    const diffGraphName = "DifferenceGraph" + ".json";

    const file = new File([JSON.stringify(diffGraph)], diffGraphName, {
      type: "application/json",
    });

    const minCorrForEdge = 0;
    const minCompSizeForNode = 0;
    const maxCompSizeForNode = "";
    const takeSpearmanCoefficient = false;

    addNewGraphFile(
      file,
      graphData.uploadedGraphFileNames,
      setGraphData,
      takeAbs,
      minCorrForEdge,
      minCompSizeForNode,
      maxCompSizeForNode,
      takeSpearmanCoefficient
    )
      .then(() => {})
      .catch((error) => {
        setError(`${error.message}`);
        log.error("Error adding graph file:", error);
      });
  }

  // initates reset //
  const simulationReset = () => {
    if (!graphData.activeGraphFileNames) return;
    log.info("Handle Simulation Reset");

    resetFilters();
    resetPhysics();
    setSettings("download", { json: null, png: null, svg: null });
    setError(null);
    setReset(true);
  };

  const resetPhysics = () => {
    resetPhysicsSettings(setSettings);
  };

  const resetFilters = () => {
    resetFilterSettings(setFilter, filter);
  };

  // select example graph on startup
  useEffect(() => {
    log.info("Setting init graph data");
    setInitGraph(setGraphData);
    setGraphData("graphIsPreprocessed", false);
  }, []);

  // init uploadedGraphFileNames
  useEffect(() => {
    log.info("Loading uploaded graph files");
    try {
      loadGraphFileNames(setGraphData);
    } catch (error) {
      setError("Error loading graph files form database");
      log.error("Error loading graph files form database");
    }
  }, []);

  // load current theme
  useEffect(() => {
    log.info("Loading Theme");
    loadTheme(setSettings);
  }, []);

  // store current theme //
  useEffect(() => {
    if (!settings.appearance.theme) return;
    log.info("Storing current theme if needed");

    storeTheme(settings.appearance.theme);
  }, [settings.appearance.theme]);

  // init uploadedMappingFileNames
  useEffect(() => {
    log.info("Loading uploaded mapping files");
    try {
      loadAnnotationMappings(setGraphData);
    } catch (error) {
      setError("Error loading mapping files form database");
      log.error("Error loading mapping files form database");
    }
  }, []);

  // load uploaded color schemes //
  useEffect(() => {
    log.info("Loading color schemes");
    loadColorSchemes(setColorSchemes);
  }, []);

  // storing uploaded color schemes
  useEffect(() => {
    if (!colorSchemes) return;
    log.info("Storing uploaded color schemes");

    storeColorSchemes(colorSchemes);
  }, [colorSchemes]);

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
    newGraph = applyNodeMapping(newGraph, graphData.activeAnnotationMapping);

    const { minWeight, maxWeight } = getLinkWeightMinMax(newGraph);
    setGraphData("linkWeightMin", minWeight);
    setGraphData("linkWeightMax", maxWeight);

    // set max comp size = amount of nodes

    const nodeAttribsToColorIndices = getNodeAttribsToColorIndices(newGraph);
    setSettings("appearance.nodeAttribsToColorIndices", nodeAttribsToColorIndices);

    const linkAttribsToColorIndices = getLinkAttribsToColorIndices(newGraph);
    setSettings("appearance.linkAttribsToColorIndices", linkAttribsToColorIndices);

    setGraphData("originGraph", newGraph);
    setGraphData("graph", newGraph);
    setGraphData("graphIsPreprocessed", true);
  }, [graphData.originGraph, graphData.activeGraphFileNames, graphData.activeAnnotationMapping]);

  return (
    <div className={settings.appearance.theme.name}>
      <HeaderBar />
      <Sidebar
        handleSelectGraph={handleSelectGraph}
        handleDeleteGraphFile={handleDeleteGraphFile}
        handleRemoveActiveGraphFile={handleRemoveActiveGraphFile}
        handleAddFile={handleAddActiveGraphFile}
        handleNewAnnotationMapping={handleNewAnnotationMapping}
        handleRemoveActiveAnnotationMapping={handleRemoveActiveAnnotationMapping}
        handleAnnotationMappingSelect={handleSelectAnnotationMapping}
        handleDeleteAnnotationMapping={handleDeleteAnnotationMapping}
        handleNewGraphFile={handleNewGraphFile}
        handleNewColorScheme={handleNewColorScheme}
        handleDeleteColorScheme={handleDeleteColorScheme}
        handleCreateDifferenceGraph={handleCreateDifferenceGraph}
        colorSchemes={colorSchemes}
        resetPhysics={resetPhysics}
        resetFilters={resetFilters}
      />
      <main>
        {error && <Erorr error={error} setError={setError} />}
        <ForceGraph reset={reset} setReset={setReset} setError={setError} />
      </main>
    </div>
  );
}
export default App;
