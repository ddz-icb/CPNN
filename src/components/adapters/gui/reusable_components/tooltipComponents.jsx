import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";
import { SvgIcon } from "./SvgIcon.jsx";
import xSvg from "../../../../assets/icons/x.svg?raw";

export function PortalTooltip(props) {
  if (typeof document === "undefined" || !document.body) {
    return <Tooltip {...props} />;
  }

  return createPortal(<Tooltip {...props} />, document.body);
}

export function TooltipPopup({
  heading,
  close,
  contentKey,
  children,
  footer,
  navigation,
  className = "",
  id,
  role = "dialog",
  ariaLabel,
  dataAttributes = {},
}) {
  const panelClassName = ["tooltip", "tooltip-popup", className].filter(Boolean).join(" ");

  return (
    <aside
      id={id}
      className={panelClassName}
      role={role}
      aria-label={ariaLabel ?? `Node details: ${heading}`}
      {...dataAttributes}
    >
      <div className="tooltip-popup-content">
        <div className="tooltip-popup-header sidebar-panel-header">
          <span className="tooltip-popup-heading sidebar-panel-heading link-text">{heading}</span>
          <div className="tooltip-popup-header-side tooltip-popup-header-side--right">
            <button type="button" className="tooltip-nav-button sidebar-panel-header-button" onClick={close} aria-label="Close tooltip">
              <SvgIcon svg={xSvg} />
            </button>
          </div>
        </div>
        {navigation && <div className="tooltip-popup-navigation">{navigation}</div>}
        <div className="tooltip-popup-body">
          <div key={contentKey} className="tooltip-popup-body-inner">
            {children}
          </div>
        </div>
        {footer && <div className="tooltip-popup-footer">{footer}</div>}
      </div>
    </aside>
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
  if (!text) return null;
  return (
    <a className="tooltip-popup-footer-link" href={link} target="_blank" rel="noreferrer">
      {text}
    </a>
  );
}
