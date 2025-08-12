import { useError } from "../adapters/state/error/errorState.js";
import { erorrInit } from "../adapters/state/error/errorInit.js";

export const errorService = {
  getError() {
    return useError.getState().error;
  },
  setError(message) {
    useError.setState({ error: message });
  },
  clearError() {
    useError.setState({ error: erorrInit });
  },
};
