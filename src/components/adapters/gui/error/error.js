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
              <button className="back-close" onClick={() => clearError()}>
                <SvgIcon svg={xSvg} />
              </button>
            </div>
            <div>{error}</div>
          </div>
        </div>
      )}
    </>
  );
}
