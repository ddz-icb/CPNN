import { ReactComponent as XIcon } from "../../icons/x.svg";
import { useError } from "../adapters/state/errorState.js";

export function Error() {
  const { error, setError } = useError();

  return (
    <>
      {error && (
        <div className="error-overlay">
          <div className="error-container">
            <div className="error-header pad-bottom-1">
              <b>Warning</b>
              <span className="error-button" onClick={() => setError(null)}>
                <XIcon />
              </span>
            </div>
            <div>{error}</div>
          </div>
        </div>
      )}
    </>
  );
}
