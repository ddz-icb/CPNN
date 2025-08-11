import { useState } from "react";
import { ReactComponent as InfoCircleIcon } from "../../../icons/infoCircle.svg";
import { ReactComponent as XIcon } from "../../../icons/x.svg";
import { Tooltip } from "react-tooltip";
import { handleFieldBlur, handleFieldChange, handleSliderChange } from "../handlers/buttonHandlerFunctions.js";

export function SliderBlock({ variant = "sidebar", value, setValue, setValueText, min, max, step, text, infoHeading, infoDescription, ...props }) {
  const isPopup = variant === "popup";
  const wrapperClassName = isPopup ? "popup-block pad-bottom-05" : "sidebar-block";
  const labelClassName = isPopup ? "label" : "label pad-left-1";

  return (
    <>
      <div className="inline">
        <label className={labelClassName}>{text}</label>
        <span className="tooltip-button pad-left-05 pad-top-11">
          <InfoButtonPopup heading={infoHeading} description={infoDescription} widePopup={isPopup} />
        </span>
      </div>
      <div className={wrapperClassName}>
        <input
          className="sidebar-slider"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => handleSliderChange(event, setValue, setValueText, min, max)}
        />
        <NumericInput setValue={setValue} setValueText={setValueText} min={min} max={max} step={step} {...props} />
      </div>
    </>
  );
}

export function SwitchBlock({ variant = "sidebar", value, setValue, text, infoHeading, infoDescription }) {
  const isPopup = variant === "popup";
  const wrapperClassName = isPopup ? "popup-block" : "sidebar-block";

  return (
    <div className={wrapperClassName}>
      <div className="inline">
        <label className="label">{text}</label>
        <span className="tooltip-button pad-left-05 pad-top-11">
          <InfoButtonPopup heading={infoHeading} description={infoDescription} widePopup={isPopup} />
        </span>
      </div>
      <label className="switch">
        <input type="checkbox" checked={value} onChange={setValue} className="checkbox-input" />
        <span className="slider round"></span>
      </label>
    </div>
  );
}

export function FieldBlock({ variant = "sidebar", text, infoHeading, infoDescription, ...props }) {
  const isPopup = variant === "popup";
  const wrapperClassName = isPopup ? "popup-block" : "sidebar-block";

  return (
    <div className={wrapperClassName}>
      <div className="inline">
        <label className="label">{text}</label>
        <span className="tooltip-button pad-left-05 pad-top-11">
          <InfoButtonPopup heading={infoHeading} description={infoDescription} widePopup={isPopup} />
        </span>
      </div>
      <NumericInput {...props} />
    </div>
  );
}

export function Button({ variant = "sidebar", onClick, onChange, linkRef, tooltip, tooltipId, text, className }) {
  const isPopup = variant === "popup";

  const wrapperClass = isPopup ? `popup-tooltip-wrapper justify-right pad-top-1 ${className || ""}` : "sidebar-tooltip-wrapper";
  const buttonClass = isPopup ? "popup-button-rect" : "sidebar-button-rect";
  const textClass = isPopup ? "popup-button-rect-text" : "sidebar-button-rect-text";
  const tooltipClass = isPopup ? "popup-tooltip" : "sidebar-tooltip";

  return (
    <div className={wrapperClass}>
      <button className={buttonClass} data-tooltip-id={tooltipId} data-tooltip-content={tooltip} onClick={onClick}>
        <span className={textClass}>{text}</span>
        <input type="file" style={{ display: "none" }} onChange={onChange} ref={linkRef} />
      </button>
      <Tooltip id={tooltipId} place="top" effect="solid" className={tooltipClass} />
    </div>
  );
}
export function CodeEditorBlock({ text, onClick, compilerError, defaultValue, textareaRef, infoHeading, infoDescription }) {
  return (
    <>
      <div className="inline">
        <label className="label pad-left-1">{text}</label>
        <span className="tooltip-button pad-left-05 pad-top-11">
          <InfoButtonPopup heading={infoHeading} description={infoDescription} />
        </span>
      </div>
      <div className={`editor-sidebar-block ${compilerError ? "no-pad-bottom" : ""}`}>
        <div className="custom-editor">
          <textarea ref={textareaRef} defaultValue={defaultValue}></textarea>
        </div>
        <Button onClick={onClick} text="Run" />
      </div>
      <span className={`pad-left-1 warning ${compilerError ? "pad-bottom-1" : ""}`}>{compilerError}</span>
    </>
  );
}

export function Popup({ heading, description, isOpen, setIsOpen, widePopup, children }) {
  const popupContainer = widePopup ? "popup-container-wide" : "popup-container";

  return (
    isOpen && (
      <div className="popup-overlay">
        <div className={popupContainer}>
          <div className="popup-header pad-bottom-1">
            <p>{heading}</p>
            <span className="tooltip-button" onClick={() => setIsOpen(false)}>
              <XIcon />
            </span>
          </div>
          <div className="popup-block color-text-primary">{description}</div>
          {children}
        </div>
      </div>
    )
  );
}

export function ButtonPopup({ buttonText, tooltip, tooltipId, heading, description, widePopup, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(!isOpen)} tooltip={tooltip} tooltipId={tooltipId} text={buttonText} />
      {isOpen && (
        <Popup heading={heading} description={description} children={children} isOpen={isOpen} setIsOpen={setIsOpen} widePopup={widePopup} />
      )}
    </>
  );
}

export function InfoButtonPopup({ heading, description, widePopup, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <InfoCircleIcon onClick={() => setIsOpen(!isOpen)} />
      {isOpen && (
        <Popup heading={heading} description={description} children={children} isOpen={isOpen} setIsOpen={setIsOpen} widePopup={widePopup} />
      )}
    </>
  );
}

export function PopupTextField({ textInfront, textInside, inline }) {
  if (inline) {
    return (
      <>
        <div className={"popup-block pad-top-05 pad-bottom-05"}>
          <label className="label-no-pad">{textInfront}</label>
          <div className="text-field pad-left-025 pad-right-025">{textInside}</div>
        </div>
      </>
    );
  } else {
    return (
      <>
        <label className="label-no-pad">{textInfront}</label>
        <div className="text-field pad-left-025 pad-right-025 margin-bottom-025">{textInside}</div>
      </>
    );
  }
}

export function TableList({
  heading,
  data,
  displayKey,
  onItemClick,
  ActionIcon,
  onActionIconClick,
  itemTooltipContent,
  actionIconTooltipContent,
  ActionIcon2,
  onActionIcon2Click,
  actionIcon2TooltipContent,
  dark,
}) {
  return (
    <>
      <span className="heading-label">{heading}</span>
      <table className={dark ? "dark-item-table" : "item-table"}>
        <tbody>
          {data && data.length > 0 ? (
            data.map((item, index) => (
              <tr key={`row-${item}-${index}`} className="item-table-entry item-table-entry-highlight">
                <td
                  className={onItemClick ? "item-table-text-hoverable" : "item-table-text"}
                  onClick={() => onItemClick && onItemClick(item)}
                  {...(itemTooltipContent && {
                    "data-tooltip-id": `item-tooltip-${item}-${index}`,
                    "data-tooltip-content": itemTooltipContent(item),
                  })}
                >
                  <span className="pad-left-025">{displayKey ? item[displayKey] : item}</span>
                </td>
                {ActionIcon && (
                  <td className="item-table-logo">
                    <ActionIcon
                      onClick={() => onActionIconClick && onActionIconClick(item)}
                      {...(actionIconTooltipContent && {
                        "data-tooltip-id": `action-tooltip-${item}-${index}`,
                        "data-tooltip-content": actionIconTooltipContent(item),
                      })}
                    />
                  </td>
                )}
                {ActionIcon2 && (
                  <td className="item-table-logo">
                    <ActionIcon2
                      onClick={() => onActionIcon2Click && onActionIcon2Click(item)}
                      {...(actionIcon2TooltipContent && {
                        "data-tooltip-id": `action-tooltip-2-${item}-${index}`,
                        "data-tooltip-content": actionIcon2TooltipContent(item),
                      })}
                    />
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr className="item-table-entry">
              <td>
                <span className="pad-left-025">None</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {data &&
        data.length > 0 &&
        itemTooltipContent &&
        data.map((item, index) => (
          <div key={`item-tooltip-wrapper-${item}-${index}`} className="sidebar-tooltip-wrapper">
            <Tooltip key={`item-tooltip-${item}-${index}`} id={`item-tooltip-${item}-${index}`} className="sidebar-tooltip" />
          </div>
        ))}

      {data &&
        data.length > 0 &&
        actionIconTooltipContent &&
        data.map((item, index) => (
          <div key={`action-tooltip-wrapper-${item}-${index}`} className="sidebar-tooltip-wrapper">
            <Tooltip key={`action-tooltip-${item}-${index}`} id={`action-tooltip-${item}-${index}`} className="sidebar-tooltip" />
          </div>
        ))}

      {data &&
        data.length > 0 &&
        actionIcon2TooltipContent &&
        data.map((item, index) => (
          <div key={`action-tooltip-2-wrapper-${item}-${index}`} className="sidebar-tooltip-wrapper">
            <Tooltip key={`action-tooltip-2-${item}-${index}`} id={`action-tooltip-2-${item}-${index}`} className="sidebar-tooltip" />
          </div>
        ))}
    </>
  );
}

function NumericInput({ valueText, setValue, setValueText, fallbackValue, min, max, step }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.target.blur();
    }
  };

  return (
    <input
      className="input-field"
      type="number"
      min={min}
      max={max}
      step={step}
      value={valueText}
      onChange={(event) => handleFieldChange(event, setValueText, min, max)}
      onKeyDown={handleKeyDown}
      onBlur={(event) => handleFieldBlur(event, setValue, setValueText, min, max, fallbackValue)}
    />
  );
}
