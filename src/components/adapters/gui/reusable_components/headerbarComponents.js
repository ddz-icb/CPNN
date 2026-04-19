import { Tooltip } from "react-tooltip";

export function HeaderButton({ icon, onClick, children, tooltip, tooltipId, shortcut }) {
  return (
    <>
      <div className="header-button-container">
        <button
          type="button"
          className="icon-button"
          onClick={onClick}
          aria-label={tooltip || "Toggle panel"}
          data-tooltip-id={tooltipId}
          data-tooltip-content={tooltip}
        >
          {icon}
        </button>
        {shortcut && <kbd className="header-shortcut">{shortcut}</kbd>}
      </div>
      <Tooltip id={tooltipId} place="bottom" effect="solid" className="tooltip-gui" />
      {children}
    </>
  );
}
