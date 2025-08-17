import log from "../../adapters/logging/logger.js";
import { useEffect } from "react";
import { graphService } from "../services/graphService.js";
import { colorschemeService } from "../services/colorschemeService.js";
import { themeService } from "../services/themeService.js";
import { mappingService } from "../services/mappingService.js";

export function Init() {
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
