import log from "../../logger.js";
import { graphService } from "./graphService.js";
import { errorService } from "./errorService.js";
import { filterService } from "./filterService.js";
import { filterInit } from "../config/filterInitValues.js";
import { physicsService } from "./physicsService.js";
import { physicsInit } from "../config/physicsInitValues.js";
import { downloadService } from "./downloadService.js";
import { downloadInit } from "../config/downloadInitValues.js";
import { useReset } from "../adapters/state/resetState.js";

export const resetService = {
  getReset() {
    return useReset.getState().reset.reset;
  },
  setReset(value) {
    useReset.getState().setReset({ reset: value });
  },
  simulationReset() {
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
