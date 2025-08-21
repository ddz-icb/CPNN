import { ReactComponent as XIcon } from "../../../icons/x.svg";

export function Tooltip({ heading, close, children, style, footer }) {
  return (
    <div className="tooltip tooltip-click" style={style}>
      <div className="tooltip-content">
        <div className="tooltip-header">
          <span className="tooltip-heading">{heading}</span>
          <span className="tooltip-button" onClick={() => close()}>
            <XIcon />
          </span>
        </div>
        <div className="tooltip-body">{children}</div>

        {footer && <div className="tooltip-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function TooltipItem({ heading, value }) {
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
export function TooltipLinkItem({ text, link }) {
  return (
    <>
      {text && (
        <a className="tooltip-footer-item" href={link} target="_blank" rel="noreferrer">
          <div>{text}</div>
        </a>
      )}
    </>
  );
}
