import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import xSvg from "../../../../assets/icons/x.svg?raw";

export function AdditionalDataLoading({ isLoading, onCancel }) {
  if (!isLoading) return null;

  return (
    <div
      className="popup-overlay additional-data-loading-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="additional-data-loading-heading"
      aria-busy="true"
    >
      <div className="additional-data-loading-container">
        <button
          type="button"
          className="svg-button additional-data-loading-close"
          onClick={onCancel}
          aria-label="Cancel additional data loading"
        >
          <SvgIcon svg={xSvg} className="popup-close-icon" />
        </button>
        <div className="additional-data-loading-spinner" aria-hidden="true" />
        <div>
          <div id="additional-data-loading-heading" className="additional-data-loading-heading">
            Loading additional graph data
          </div>
          <div className="additional-data-loading-description">Requesting data from external services...</div>
        </div>
      </div>
    </div>
  );
}
