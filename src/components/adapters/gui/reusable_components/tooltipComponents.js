import { SvgIcon } from "./SvgIcon.jsx";
import xSvg from "../../../../assets/icons/x.svg?raw";

export function TooltipPopup({ heading, close, children, tooltipRef, isPositioned, footer }) {
  return (
    <div
      className="tooltip tooltip-popup"
      ref={tooltipRef}
      style={{ visibility: isPositioned ? "visible" : "hidden" }}
    >
      <div className="tooltip-popup-content">
        <div className="tooltip-popup-header">
          <span className="tooltip-popup-heading">{heading}</span>
          <button className="back-close" type="button" onClick={() => close()} aria-label="Close tooltip">
            <SvgIcon svg={xSvg} />
          </button>
        </div>
        <div className="tooltip-popup-body">{children}</div>
        {footer && <div className="tooltip-popup-footer">{footer}</div>}
      </div>
    </div>
  );
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
  return (
    <>
      {text && (
        <a className="tooltip-popup-footer-item" href={link} target="_blank" rel="noreferrer">
          <div>{text}</div>
        </a>
      )}
    </>
  );
}
