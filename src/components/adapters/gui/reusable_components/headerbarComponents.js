import { Tooltip } from "react-tooltip";

export function HeaderButton({ icon, onClick, children, tooltip, tooltipId }) {
  return (
    <>
      <a className={"icon-button"} onClick={onClick} data-tooltip-id={tooltipId} data-tooltip-content={tooltip}>
        {icon}
      </a>
      <Tooltip id={tooltipId} place="bottom" effect="solid" className="tooltip-gui" />
      {children}
    </>
  );
}
