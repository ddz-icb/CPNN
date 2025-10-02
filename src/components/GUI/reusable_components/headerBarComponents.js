import { Tooltip } from "react-tooltip";

export function HeaderButton({ icon, onClick, children, tooltip, tooltipId }) {
  return (
    <>
      <div className="tooltip-wrapper">
        <a className={"icon-button"} onClick={onClick} data-tooltip-id={tooltipId} data-tooltip-content={tooltip}>
          {icon}
        </a>
        <Tooltip id={tooltipId} place="bottom" effect="solid" className="tooltip" />
      </div>
      {children}
    </>
  );
}
