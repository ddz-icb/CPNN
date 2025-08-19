import { useEffect } from "react";
import log from "../../adapters/logging/logger.js";
import { useAppearance } from "../../adapters/state/appearanceState.js";
import { useColorschemeState } from "../../adapters/state/colorschemeState.js";
import { useDownload } from "../../adapters/state/downloadState.js";
import { useGraphState } from "../../adapters/state/graphState.js";
import { useMappingState } from "../../adapters/state/mappingState.js";
import { usePhysics } from "../../adapters/state/physicsState.js";
import { downloadAsPDF, downloadAsPNG, downloadAsSVG, downloadGraphJson, downloadLegendPdf } from "../../domain_service/download/download.js";
import { changeCircleBorderColor, changeNodeLabelColor } from "../../domain_service/canvas_drawing/draw.js";
import { lightTheme, themeInit, useTheme } from "../../adapters/state/themeState.js";
import { usePixiState } from "../../adapters/state/pixiState.js";
import { useRenderState } from "../../adapters/state/canvasState.js";
import { errorService } from "../services/errorService.js";

export function DownloadControl() {
  const { physics } = usePhysics();
  const { appearance } = useAppearance();
  const { theme } = useTheme();
  const { colorschemeState } = useColorschemeState();
  const { graphState } = useGraphState();
  const { pixiState } = usePixiState();
  const { mappingState } = useMappingState();
  const { download } = useDownload();
  const { renderState } = useRenderState();

  // download graph data as json //
  useEffect(() => {
    if (!(download.json != null && graphState.graph)) return;
    log.info("Downloading graph as JSON");

    try {
      downloadGraphJson(graphState.graph);
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error downloading the graph as JSON:", error);
    }
  }, [download.json]);

  // download graph data as json with coordinates and physics //
  useEffect(() => {
    if (!(download.jsonCoordsPhysics != null && graphState.graph)) return;
    log.info("Downloading graph as JSON with coordinates and physics");

    try {
      downloadGraphJson(graphState.graph, pixiState.nodeMap, physics);
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error downloading the graph as JSON with coordinates:", error);
    }
  }, [download.jsonCoordsPhysics]);

  // download graph as png //
  useEffect(() => {
    if (!(download.png != null && graphState.graph)) return;
    log.info("Downloading graph as PNG");

    try {
      changeCircleBorderColor(pixiState.circles, lightTheme.circleBorderColor);
      changeNodeLabelColor(pixiState.nodeLabels, lightTheme.textColor);

      downloadAsPNG(renderState.app, document, graphState.graph.name);

      changeCircleBorderColor(pixiState.circles, theme.circleBorderColor);
      changeNodeLabelColor(pixiState.nodeLabels, theme.textColor);
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error downloading the graph as PNG:", error);
    }
  }, [download.png]);

  // download graph as svg //
  useEffect(() => {
    if (!(download.svg != null && graphState.graph)) return;
    log.info("Downloading graph as SVG");

    try {
      downloadAsSVG(
        graphState.graph,
        appearance.linkWidth,
        colorschemeState.linkColorscheme.data,
        colorschemeState.linkAttribsToColorIndices,
        themeInit.circleBorderColor,
        themeInit.textColor,
        colorschemeState.nodeColorscheme.data,
        colorschemeState.nodeAttribsToColorIndices,
        pixiState.nodeMap
      );
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error downloading the graph as SVG:", error);
    }
  }, [download.svg]);

  // download graph as pdf //
  useEffect(() => {
    if (!(download.pdf != null && graphState.graph)) return;
    log.info("Downloading graph as PDF");

    try {
      downloadAsPDF(
        graphState.graph,
        appearance.linkWidth,
        colorschemeState.linkColorscheme.data,
        colorschemeState.linkAttribsToColorIndices,
        themeInit.circleBorderColor,
        themeInit.textColor,
        colorschemeState.nodeColorscheme.data,
        colorschemeState.nodeAttribsToColorIndices,
        pixiState.nodeMap
      );
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error downloading the graph as PDF:", error);
    }
  }, [download.pdf]);

  // download legend as pdf //
  useEffect(() => {
    if (!(download.legendPdf != null && graphState.graph)) return;
    log.info("Downloading legend as PDF");

    try {
      downloadLegendPdf(
        graphState.graph.name,
        colorschemeState.linkColorscheme.data,
        colorschemeState.linkAttribsToColorIndices,
        colorschemeState.nodeColorscheme.data,
        colorschemeState.nodeAttribsToColorIndices,
        mappingState.mapping
      );
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error downloading the legend as PDF:", error);
    }
  }, [download.legendPdf]);
}
