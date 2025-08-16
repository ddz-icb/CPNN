import { useEffect } from "react";
import log from "../../logger.js";
import { lightTheme, themeInit, useAppearance } from "../adapters/state/appearanceState.js";
import { useColorschemeState } from "../adapters/state/colorschemeState.js";
import { useDownload } from "../adapters/state/downloadState.js";
import { useGraphState } from "../adapters/state/graphState.js";
import { useMappingState } from "../adapters/state/mappingState.js";
import { usePhysics } from "../adapters/state/physicsState.js";
import { downloadAsPDF, downloadAsPNG, downloadAsSVG, downloadGraphJson, downloadLegendPdf } from "../domain_service/download.js";
import { changeCircleBorderColor, changeNodeLabelColor } from "../domain_service/canvas_drawing/draw.js";

export function DownloadStateControl({ app }) {
  const { physics, setPhysics } = usePhysics();
  const { appearance, setAppearance } = useAppearance();
  const { colorschemeState, setColorschemeState } = useColorschemeState();
  const { graphState, setGraphState } = useGraphState();
  const { mappingState, setMappingState } = useMappingState();
  const { download, setDownload } = useDownload();

  // download graph data as json //
  useEffect(() => {
    if (download.json != null && graphState.graph) {
      try {
        log.info("Downloading graph as JSON");
        downloadGraphJson(graphState.graph);
      } catch (error) {
        log.error("Error downloading the graph as JSON:", error);
      }
    }
  }, [download.json]);

  // download graph data as json with coordinates and physics //
  useEffect(() => {
    if (download.jsonCoordsPhysics != null && graphState.graph) {
      try {
        log.info("Downloading graph as JSON with coordinates and physics");
        downloadGraphJson(graphState.graph, graphState.nodeMap, physics);
      } catch (error) {
        log.error("Error downloading the graph as JSON with coordinates:", error);
      }
    }
  }, [download.jsonCoordsPhysics]);

  // download graph as png //
  useEffect(() => {
    if (download.png != null && graphState.graph) {
      log.info("Downloading graph as PNG");

      changeCircleBorderColor(graphState.circles, lightTheme.circleBorderColor);
      changeNodeLabelColor(graphState.nodeLabels, lightTheme.textColor);

      downloadAsPNG(app, document, graphState.graph.name);

      changeCircleBorderColor(graphState.circles, appearance.theme.circleBorderColor);
      changeNodeLabelColor(graphState.nodeLabels, appearance.theme.textColor);
    }
  }, [download.png]);

  // download graph as svg //
  useEffect(() => {
    if (download.svg != null && graphState.graph) {
      log.info("Downloading graph as SVG");

      downloadAsSVG(
        graphState.graph,
        appearance.linkWidth,
        colorschemeState.linkColorscheme.data,
        colorschemeState.linkAttribsToColorIndices,
        themeInit.circleBorderColor,
        themeInit.textColor,
        colorschemeState.nodeColorscheme.data,
        colorschemeState.nodeAttribsToColorIndices,
        graphState.nodeMap
      );
    }
  }, [download.svg]);

  // download graph as pdf //
  useEffect(() => {
    if (download.pdf != null && graphState.graph) {
      log.info("Downloading graph as PDF");

      downloadAsPDF(
        graphState.graph,
        appearance.linkWidth,
        colorschemeState.linkColorscheme.data,
        colorschemeState.linkAttribsToColorIndices,
        themeInit.circleBorderColor,
        themeInit.textColor,
        colorschemeState.nodeColorscheme.data,
        colorschemeState.nodeAttribsToColorIndices,
        graphState.nodeMap
      );
    }
  }, [download.pdf]);

  // download legend as pdf //
  useEffect(() => {
    if (download.legendPdf != null && graphState.graph) {
      log.info("Downloading legend as PDF");

      downloadLegendPdf(
        graphState.graph.name,
        colorschemeState.linkColorscheme.data,
        colorschemeState.linkAttribsToColorIndices,
        colorschemeState.nodeColorscheme.data,
        colorschemeState.nodeAttribsToColorIndices,
        mappingState.activeMapping
      );
    }
  }, [download.legendPdf]);
}
