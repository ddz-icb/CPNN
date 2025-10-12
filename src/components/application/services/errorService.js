import { useError } from "../../adapters/state/errorState.js";
import { erorrInit } from "../../adapters/state/errorState.js";

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
