import { ReactComponent as XIcon } from "../../../../assets/icons/x.svg";

export function TooltipPopup({ heading, close, children, style, footer }) {
  return (
    <div className="tooltip tooltip-popup" style={style}>
      <div className="tooltip-popup-content">
        <div className="tooltip-popup-header">
          <span className="tooltip-popup-heading">{heading}</span>
          <span className="tooltip-popup-button" onClick={() => close()}>
            <XIcon />
          </span>
        </div>
        <div className="tooltip-popup-body">{children}</div>

        {footer && <div className="tooltip-popup-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function TooltipPopupItem({ heading, value }) {
  return (
    <>
      {value && (
        <>
          <b className="text-secondary">{heading}</b>
          <div>{value}</div>
        </>
      )}
    </>
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
