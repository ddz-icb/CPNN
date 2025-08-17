import log from "../../adapters/logging/logger.js";
import { graphService } from "./graphService.js";
import { errorService } from "./errorService.js";
import { filterInit, useFilter } from "../../adapters/state/filterState.js";
import { physicsInit, usePhysics } from "../../adapters/state/physicsState.js";
import { downloadInit, useDownload } from "../../adapters/state/downloadState.js";
import { useReset } from "../../adapters/state/resetState.js";

export const resetService = {
  resetSimulation() {
    if (!graphService.getActiveGraphNames()) return;
    log.info("Resetting the simulation");

    errorService.clearError();

    useFilter.getState().setAllFilter(filterInit);
    useDownload.getState().setAllDownload(downloadInit);
    usePhysics.getState().setAllPhysics(physicsInit);

    errorService.clearError();
    this.setReset(true);
  },
  getReset() {
    return useReset.getState().reset;
  },
  setReset(value) {
    useReset.getState().setReset(value);
  },
};
