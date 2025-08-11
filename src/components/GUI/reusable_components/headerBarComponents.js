import { Tooltip } from "react-tooltip";

export function HeaderButton({ icon, onClick, innerClass, children, tooltip, tooltipId }) {
  return (
    <>
      <div className="sidebar-tooltip-wrapper">
        <a className={innerClass} onClick={onClick} data-tooltip-id={tooltipId} data-tooltip-content={tooltip}>
          {icon}
        </a>
        <Tooltip id={tooltipId} place="bottom" effect="solid" className="sidebar-tooltip" />
      </div>
      {children}
    </>
  );
}
