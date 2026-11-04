import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import xSvg from "../../../../assets/icons/x.svg?raw";
import { useError } from "../../../adapters/state/errorState.js";

export function Error() {
  const { error, clearError } = useError();

  return (
    <>
      {error && (
        <div className="error-overlay">
          <div className="error-container">
            <div className="error-header pad-bottom-1">
              <b>Warning</b>
              <button type="button" className="svg-button" onClick={clearError} aria-label="Close warning">
                <SvgIcon svg={xSvg} className="popup-close-icon" />
              </button>
            </div>
            <div className="error-message">{error}</div>
          </div>
        </div>
      )}
    </>
  );
}
