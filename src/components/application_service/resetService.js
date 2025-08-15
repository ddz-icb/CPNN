import log from "../../logger.js";
import { graphService } from "./graphService.js";
import { errorService } from "./errorService.js";
import { filterService } from "./filterService.js";
import { filterInit } from "../adapters/state/filterState.js";
import { physicsService } from "./physicsService.js";
import { physicsInit } from "../adapters/state/physicsState.js";
import { downloadService } from "./downloadService.js";
import { downloadInit } from "../adapters/state/downloadState.js";
import { useReset } from "../adapters/state/resetState.js";

export const resetService = {
  getReset() {
    return useReset.getState().reset.reset;
  },
  setReset(value) {
    useReset.getState().setReset({ reset: value });
  },
  resetSimulation() {
    if (!graphService.getActiveGraphNames()) return;
    log.info("Resetting the simulation");

    errorService.clearError();
    filterService.setAll(filterInit);
    physicsService.setAll(physicsInit);
    downloadService.setAll(downloadInit);
    errorService.clearError();
    this.setReset(true);
  },
};
