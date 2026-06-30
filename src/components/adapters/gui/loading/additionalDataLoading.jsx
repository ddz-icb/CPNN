export function AdditionalDataLoading({ isLoading }) {
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
