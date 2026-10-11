import { SvgIcon } from "./SvgIcon.jsx";
import { ResizableSidebar } from "./resizableSidebar.jsx";
import xSvg from "../../../../assets/icons/x.svg?raw";

export function RightSidebar({
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
  const panelClassName = ["tooltip", "tooltip-popup", "right-sidebar", className].filter(Boolean).join(" ");

  return (
    <ResizableSidebar
      side="right"
      storageKey="cpnn.rightSidebarWidth"
      cssVariable="--right-sidebar-width"
      defaultWidth={29}
      onCollapse={close}
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
            <button type="button" className="tooltip-nav-button sidebar-panel-header-button" onClick={close} aria-label="Collapse sidebar">
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
    </ResizableSidebar>
  );
}
