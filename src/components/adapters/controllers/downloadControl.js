import { useEffect } from "react";
import log from "../logging/logger.js";
import { useAppearance } from "../state/appearanceState.js";
import { useColorschemeState } from "../state/colorschemeState.js";
import { useDownload } from "../state/downloadState.js";
import { useGraphState } from "../state/graphState.js";
import { useMappingState } from "../state/mappingState.js";
import {
  downloadAsPDF,
  downloadAsSVG,
  downloadColorschemeTsv,
  downloadGraphJson,
  downloadLegendPdf,
  downloadNodeIdsCsv,
} from "../../domain/service/download/download.js";
import { themeInit } from "../state/themeState.js";
import { usePixiState } from "../state/pixiState.js";
import { errorService } from "../../application/services/errorService.js";
import { useContainer } from "../state/containerState.js";
import { buildCurrentGraphSettingsExport } from "../../application/services/graphSettingsService.js";

export function DownloadControl() {
  const { appearance } = useAppearance();
  const { colorschemeState } = useColorschemeState();
  const { graphState } = useGraphState();
  const { pixiState } = usePixiState();
  const { mappingState } = useMappingState();
  const { download } = useDownload();
  const { container } = useContainer();

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

  // download graph data as json with coordinates and current settings //
  useEffect(() => {
    if (!(download.jsonCoordsPhysics != null && graphState.graph)) return;
    log.info("Downloading graph as JSON with coordinates and settings");

    try {
      downloadGraphJson(graphState.graph, { includeCoordinates: true, settings: buildCurrentGraphSettingsExport() });
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error downloading the graph as JSON with coordinates:", error);
    }
  }, [download.jsonCoordsPhysics]);

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
        pixiState.nodeMap,
        {
          threeD: appearance.threeD,
          enableShading: appearance.enable3DShading,
          showGrid: appearance.show3DGrid,
          camera: appearance.cameraRef?.current,
          gridLines: pixiState.grid3D?.__gridLines,
          container,
        }
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
        pixiState.nodeMap,
        {
          threeD: appearance.threeD,
          enableShading: appearance.enable3DShading,
          showGrid: appearance.show3DGrid,
          camera: appearance.cameraRef?.current,
          gridLines: pixiState.grid3D?.__gridLines,
          container,
        }
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

  // download legend as pdf //
  useEffect(() => {
    if (!(download.nodeIds != null && graphState.graph)) return;
    log.info("Downloading node ids as CSV");

    try {
      downloadNodeIdsCsv(graphState.graph.data.nodes, graphState.graph.name);
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error downloading the node ids as CSV:", error);
    }
  }, [download.nodeIds]);

  // download active node color scheme as tsv //
  useEffect(() => {
    if (download.nodeColorscheme == null) return;
    log.info("Downloading active node color scheme as TSV");

    try {
      downloadColorschemeTsv(colorschemeState.nodeColorscheme, "node_colorscheme");
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error downloading the active node color scheme as TSV:", error);
    }
  }, [download.nodeColorscheme]);

  // download active link color scheme as tsv //
  useEffect(() => {
    if (download.linkColorscheme == null) return;
    log.info("Downloading active link color scheme as TSV");

    try {
      downloadColorschemeTsv(colorschemeState.linkColorscheme, "link_colorscheme");
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error downloading the active link color scheme as TSV:", error);
    }
  }, [download.linkColorscheme]);
}
