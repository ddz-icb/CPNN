import { ReactComponent as XIcon } from "../../../icons/x.svg";

export function Tooltip({ heading, isOpen, setIsOpen, children, style, footer }) {
  return (
    <>
      {isOpen && (
        <div className="tooltip tooltip-click" style={style}>
          <div className="tooltip-content">
            <div className="tooltip-header">
              <p>{heading}</p>
              <span className="tooltip-button" onClick={() => setIsOpen(false)}>
                <XIcon />
              </span>
            </div>
            <div className="tooltip-body">{children}</div>

            {footer && <div className="tooltip-footer">{footer}</div>}
          </div>
        </div>
      )}
    </>
  );
}
