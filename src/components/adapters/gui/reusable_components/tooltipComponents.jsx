import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";

export function PortalTooltip(props) {
  if (typeof document === "undefined" || !document.body) {
    return <Tooltip {...props} />;
  }

  return createPortal(<Tooltip {...props} />, document.body);
}

export function TooltipPopupItem({ heading, value }) {
  if (!value) return null;
  return (
    <div className="tooltip-popup-item">
      <span className="tooltip-popup-item-label">{heading}</span>
      <div className="tooltip-popup-item-value">{value}</div>
    </div>
  );
}

export function TooltipPopupLinkItem({ text, link }) {
  if (!text) return null;
  return (
    <a className="tooltip-popup-footer-link" href={link} target="_blank" rel="noreferrer">
      {text}
    </a>
  );
}
