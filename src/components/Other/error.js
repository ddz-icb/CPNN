import { ReactComponent as XIcon } from "../../icons/x.svg";
import { useSettings } from "../../states.js";

export function Erorr({ error, setError }) {
  const { settings, setSettings } = useSettings();

  const closeError = () => {
    setError(null);
  };

  return (
    <div className="error-overlay">
      <div className="error-container">
        <div className="error-header pad-bottom-1">
          {error && <b>Warning</b>}
          <span className="error-button" onClick={closeError}>
            <XIcon />
          </span>
        </div>
        <div>{error}</div>
      </div>
    </div>
  );
}
