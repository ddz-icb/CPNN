import "./index.css";
import log from "./logger.js";
import React, { useState, useRef, useEffect } from "react";

import { ForceGraph } from "./components/GraphStuff/forceGraph.js";
import { Sidebar } from "./components/GUI/sidebar.js";
import { HeaderBar } from "./components/GUI/headerBar.js";
import {
  applyNodeMapping,
  getIdsHavePhosphosites,
  getLinkAttribsToColorIndices,
  getNodeAttribsToColorIndices,
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
} from "./components/Other/handleFunctions.js";
import { useGraphData, useSettings } from "./states.js";
import { Erorr } from "./components/Other/error.js";
import { defaultColorSchemes } from "./components/Other/appearance.js";
import { getFileNameWithoutExtension } from "./components/Other/parseFiles.js";

function App() {
  const { settings, setSettings } = useSettings(); // includes physics, filter and appearance settings
  const { graphData, setGraphData } = useGraphData(); // includes all data concerning the graph

  const [reset, setReset] = useState(false); // true indicates that the simulation (in forceGraph.js) has to be reloaded
  const [error, setError] = useState(null); // error gets printed on screen

  const [colorSchemes, setColorSchemes] = useState(null); // all color schemes in local storage

  // sets corresponding graph after file selection
  const handleSelectGraph = (filename) => {
    if (!filename) return;
    log.info("Replacing graph");

    try {
      selectGraph(filename, setGraphData);
      setGraphData("graphIsPreprocessed", false);
      simulationReset();
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
      selectMapping(mappingName, setGraphData);
      setGraphData("graphIsPreprocessed", false);
      simulationReset();
    } catch (error) {
      setError("Mapping is already the current mapping");
      log.error("Mapping is already the current mapping");
    }
  };

  // adds new graph file //
  const handleNewGraphFile = async (event, takeAbs) => {
    const file = event.target.files[0];
    if (!event || !event.target || !file) return;
    if (graphData.uploadedGraphFileNames.some((name) => getFileNameWithoutExtension(name) === getFileNameWithoutExtension(file.name))) {
      log.warn("Graph with this name already exists");
      setError("Graph with this name already exists");
      return;
    }
    log.info("Adding new graph file");

    addNewGraphFile(file, graphData.uploadedGraphFileNames, setGraphData, takeAbs)
      .then(() => {})
      .catch((error) => {
        setError(`${error}`);
        log.error("Error adding graph file:", error);
      });
  };

  // adds new color scheme
  const handleNewScheme = async (event) => {
    if (!event || !event.target || !event.target.files[0]) return;
    log.info("Adding new color scheme");

    const file = event.target.files[0];
    try {
      addNewColorScheme(file, setColorSchemes);
    } catch (error) {
      setError("Error adding color scheme");
      log.error("Error adding color scheme:", error);
    }
  };

  const handleDeleteColorScheme = (colorSchemeName) => {
    if (!colorSchemeName) return;
    if (defaultColorSchemes.some((scheme) => scheme.name === colorSchemeName)) {
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
        setError(`${error}`);
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

    removeActiveGraphFile(filename, graphData.activeGraphFileNames, setGraphData);
    setGraphData("graphIsPreprocessed", false);
    simulationReset();
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
      addActiveGraphFile(filename, graphData.activeGraphFileNames, setGraphData, graphData.originGraph);
      setGraphData("graphIsPreprocessed", false);
      simulationReset();
    } catch (error) {
      setError("Error loading graph");
      log.error("Error loading graph:", error);
      return;
    }
  };

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
    resetFilterSettings(setSettings);
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

  // forwards graph to forceGraph component //
  useEffect(() => {
    if (!graphData.originGraph || !graphData.activeGraphFileNames) return;
    log.info("Modifying graph and forwarding it to the simulation component");

    let newGraph = structuredClone(graphData.originGraph);
    newGraph = applyNodeMapping(newGraph, graphData.activeAnnotationMapping);

    const nodeAttribsToColorIndices = getNodeAttribsToColorIndices(newGraph);
    setSettings("appearance.nodeAttribsToColorIndices", nodeAttribsToColorIndices);

    const linkAttribsToColorIndices = getLinkAttribsToColorIndices(newGraph);
    setSettings("appearance.linkAttribsToColorIndices", linkAttribsToColorIndices);

    setGraphData("graph", newGraph);
    setGraphData("graphIsPreprocessed", true);
  }, [graphData.originGraph, graphData.activeGraphFileNames, graphData.activeAnnotationMapping]);

  return (
    <div className={settings.appearance.theme.name}>
      <HeaderBar handleDeleteColorScheme={handleDeleteColorScheme} handleNewScheme={handleNewScheme} colorSchemes={colorSchemes} />
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
