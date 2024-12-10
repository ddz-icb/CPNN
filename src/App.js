import "./index.css";
import log from "./logger.js";
import React, { useState, useRef, useEffect } from "react";

import { ForceGraph } from "./components/GraphStuff/forceGraph.js";
import { Sidebar } from "./components/GUI/sidebar.js";
import { HeaderBar } from "./components/GUI/headerBar.js";
import { applyNodeMapping, getLinkAttribsToColorIndices, getNodeAttribsToColorIndices } from "./components/GraphStuff/graphCalculations.js";
import { resetFilterSettings, resetPhysicsSettings } from "./components/Other/reset.js";
import {
  addActiveGraphFile,
  addAnnotationMapping,
  addNewColorScheme,
  addNewGraphFile,
  deleteAnnotationMapping,
  deleteGraphFile,
  loadAnnotationMappings,
  loadColorSchemes,
  loadFileNames,
  loadTheme,
  removeActiveGraphFile,
  removeColorScheme,
  selectGraph,
  selectMapping,
  setInitGraph,
  storeAnnotationMappings,
  storeColorSchemes,
  storeTheme,
} from "./components/Other/handleFunctions.js";
import { useGraphData, useSettings } from "./states.js";

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
      simulationReset();
    } catch (error) {
      setError("Error loading graph");
      log.error("Error loading graph:", error);
    }
  };

  // sets corresponding mapping after selection
  const handleAnnotationMappingSelect = (mapping) => {
    if (!mapping) return;
    log.info("Replacing annotation mapping");

    try {
      selectMapping(mapping, graphData.activeAnnotationMapping, setGraphData);
      simulationReset();
    } catch (error) {
      setError("Mapping is already the current mapping");
      log.error("Mapping is already the current mapping");
    }
  };

  // adds new graph file //
  const handleNewGraphFile = async (event, takeAbs) => {
    if (!event || !event.target || !event.target.files[0]) return;
    log.info("Adding new file");

    const file = event.target.files[0];
    addNewGraphFile(file, graphData.uploadedGraphFileNames, setGraphData, takeAbs)
      .then(() => {})
      .catch((error) => {
        setError("Error adding graph file");
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
    if (!event || !event.target || !event.target.files[0]) return;
    log.info("Processing new Mapping");

    const file = event.target.files[0];
    try {
      addAnnotationMapping(file, graphData.uploadedAnnotationMappings, setGraphData);
    } catch (error) {
      setError("Error adding annotation mapping");
      log.error("Error adding annotation mapping:", error);
    }
  };

  // disables currently active annotation mapping
  const handleRemoveActiveAnnotationMapping = () => {
    log.info("Removing currently active annotation mapping");

    setGraphData("activeAnnotationMapping", null);
    simulationReset();
  };

  // deletes annotation mapping files
  const handleDeleteAnnotationMapping = (mappingName) => {
    if (!mappingName) return;
    log.info("Deleting mapping with name", mappingName);

    deleteAnnotationMapping(graphData.uploadedAnnotationMappings, mappingName, setGraphData);
  };

  // deletes uploaded files with filename //
  const handleDeleteGraphFile = (filename) => {
    if (!filename) return;
    log.info("Deleting files with name", filename);

    deleteGraphFile(graphData.uploadedGraphFileNames, filename, setGraphData);
  };

  // removes graph file from currently active files //
  const handleRemoveActiveGraphFile = (file) => {
    if (!file || !file.name) return;
    log.info("removing graph file with name:", file.name);

    removeActiveGraphFile(file, graphData.activeGraphFiles, setGraphData);
    simulationReset();
  };

  const handleAddActiveGraphFile = (filename) => {
    if (!filename) return;
    if (graphData.activeGraphFiles.some((file) => file.name === filename)) {
      setError("Graph already active");
      log.error("Graph already active");
      return;
    }
    log.info("Adding file with name: ", filename);

    try {
      addActiveGraphFile(filename, graphData.activeGraphFiles, setGraphData, graphData.graph);
      simulationReset();
    } catch (error) {
      setError("Error loading graph");
      log.error("Error loading graph:", error);
      return;
    }
  };

  // initates reset //
  const simulationReset = () => {
    if (!graphData.activeGraphFiles) return;
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
    simulationReset();
  }, []);

  // init uploadedGraphFileNames
  useEffect(() => {
    log.info("Loading uploaded files");
    try {
      loadFileNames(setGraphData);
    } catch (error) {
      setError("Error loading files form database");
      log.error("Error loading files form database");
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
    log.info("Storing theme");

    storeTheme(settings.appearance.theme);
  }, [settings.appearance.theme]);

  // load uploaded annotation mapping files
  useEffect(() => {
    log.info("Loading annotation mapping files");
    loadAnnotationMappings(setGraphData);
  }, []);

  // store uploaded annotation mapping files //
  useEffect(() => {
    if (!graphData.uploadedAnnotationMappings) return;
    log.info("Storing mapping files");

    storeAnnotationMappings(graphData.uploadedAnnotationMappings);
  }, [graphData.uploadedAnnotationMappings]);

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
    if (!graphData.graph || !graphData.activeGraphFiles) return;
    log.info("Modifying graph and forwarding it to the simulation component");

    let newGraphCurrent = structuredClone(graphData.graph);
    newGraphCurrent = applyNodeMapping(newGraphCurrent, graphData.activeAnnotationMapping);

    const nodeAttribsToColorIndices = getNodeAttribsToColorIndices(newGraphCurrent);
    setSettings("appearance.nodeAttribsToColorIndices", nodeAttribsToColorIndices);

    const linkAttribsToColorIndices = getLinkAttribsToColorIndices(newGraphCurrent);
    setSettings("appearance.linkAttribsToColorIndices", linkAttribsToColorIndices);

    setGraphData("graphCurrent", newGraphCurrent);
  }, [graphData.graph, graphData.activeGraphFiles, graphData.activeAnnotationMapping]);

  return (
    <div className={settings.appearance.theme.name}>
      <HeaderBar
        handleDeleteColorScheme={handleDeleteColorScheme}
        handleNewScheme={handleNewScheme}
        colorSchemes={colorSchemes}
        activeAnnotationMapping={graphData.activeAnnotationMapping}
      />
      <Sidebar
        handleSelectGraph={handleSelectGraph}
        handleDeleteGraphFile={handleDeleteGraphFile}
        handleRemoveActiveGraphFile={handleRemoveActiveGraphFile}
        handleAddFile={handleAddActiveGraphFile}
        handleNewAnnotationMapping={handleNewAnnotationMapping}
        handleRemoveActiveAnnotationMapping={handleRemoveActiveAnnotationMapping}
        handleAnnotationMappingSelect={handleAnnotationMappingSelect}
        handleDeleteAnnotationMapping={handleDeleteAnnotationMapping}
        handleNewGraphFile={handleNewGraphFile}
        resetPhysics={resetPhysics}
        resetFilters={resetFilters}
      />
      <main>
        {error && <div className="errorStyle">{error}</div>}
        <ForceGraph reset={reset} setReset={setReset} setError={setError} />
      </main>
    </div>
  );
}
export default App;
