import { Tooltip } from "react-tooltip";

export function HeaderButton({ icon, onClick, children, tooltip, tooltipId, shortcut }) {
  return (
    <>
      <div className="header-button-container">
        <a className={"icon-button"} onClick={onClick} data-tooltip-id={tooltipId} data-tooltip-content={tooltip}>
          {icon}
        </a>
        {shortcut && <kbd className="header-shortcut">{shortcut}</kbd>}
      </div>
      <Tooltip id={tooltipId} place="bottom" effect="solid" className="tooltip-gui" />
      {children}
    </>
  );
}
