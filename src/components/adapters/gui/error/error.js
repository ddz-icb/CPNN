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
              <span className="error-button" onClick={() => clearError()}>
                <SvgIcon svg={xSvg} />
              </span>
            </div>
            <div>{error}</div>
          </div>
        </div>
      )}
    </>
  );
}
