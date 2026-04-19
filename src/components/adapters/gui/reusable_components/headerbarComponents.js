import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";

function PortalTooltip(props) {
  if (typeof document === "undefined" || !document.body) {
    return <Tooltip {...props} />;
  }

  return createPortal(<Tooltip {...props} />, document.body);
}

export function HeaderButton({ icon, onClick, children, tooltip, tooltipId, shortcut, ...buttonProps }) {
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
          {...buttonProps}
        >
          {icon}
        </button>
        {shortcut && <kbd className="header-shortcut">{shortcut}</kbd>}
      </div>
      <PortalTooltip id={tooltipId} place="bottom" effect="solid" className="tooltip-gui" positionStrategy="fixed" />
      {children}
    </>
  );
}
