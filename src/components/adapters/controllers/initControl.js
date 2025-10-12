import log from "../logging/logger.js";
import { useEffect } from "react";
import { graphService } from "../../application/services/graphService.js";
import { colorschemeService } from "../../application/services/colorschemeService.js";
import { themeService } from "../../application/services/themeService.js";
import { mappingService } from "../../application/services/mappingService.js";

export function InitControl() {
  useEffect(() => {
    log.info("Setting init graph");
    graphService.handleSetInitGraph();
  }, []);

  useEffect(() => {
    log.info("Setting init color schemes");
    colorschemeService.handleSetInitColorschemes();
  }, []);

  useEffect(() => {
    log.info("Loading uploaded graphs");
    graphService.handleLoadGraphNames();
  }, []);

  useEffect(() => {
    log.info("Loading selected theme");
    themeService.handleInitTheme();
  }, []);

  useEffect(() => {
    log.info("Loading uploaded mappings");
    mappingService.handleLoadMappingNames();
  }, []);

  useEffect(() => {
    log.info("Loading uploaded color schemes");
    colorschemeService.handleLoadColorschemeNames();
  }, []);
}
