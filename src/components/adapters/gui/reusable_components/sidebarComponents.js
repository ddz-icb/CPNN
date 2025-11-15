import { ButtonCN } from "./shadcn_blocks/buttonCN.jsx";
import { Fragment, useState } from "react";
import { ReactComponent as InfoCircleIcon } from "../../../../assets/icons/infoCircle.svg";
import { ReactComponent as XIcon } from "../../../../assets/icons/x.svg";
import { handleFieldBlur, handleFieldChange, handleSliderChange } from "../handlers/buttonHandlerFunctions.js";
import { useId } from "react";
import { InputCN } from "./shadcn_blocks/inputFieldCN.jsx";
import { Tooltip } from "react-tooltip";

export function SliderBlock({ value, setValue, setValueText, min, max, step, text, infoHeading, infoDescription, ...props }) {
  return (
    <div className="block-section block-section-stack">
      <div className="sidebar-control-header">
        <label className="label">{text}</label>
        <span className="info-button-container">
          <InfoButtonPopup heading={infoHeading} description={infoDescription} widePopup={true} />
        </span>
      </div>
      <div className="sidebar-control-body">
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
    </div>
  );
}

export function SwitchBlock({ value, setValue, text, infoHeading, infoDescription }) {
  return (
    <div className="block-section">
      <div className="sidebar-control-header">
        <label className="label">{text}</label>
        <span className="info-button-container">
          <InfoButtonPopup heading={infoHeading} description={infoDescription} widePopup={true} />
        </span>
      </div>
      <label className="switch default-height default-width">
        <input type="checkbox" checked={value} onChange={setValue} className="checkbox-input" />
        <span className="switch-button"></span>
      </label>
    </div>
  );
}

export function FieldBlock({ text, infoHeading, infoDescription, ...props }) {
  return (
    <div className="block-section">
      <div className="sidebar-control-header">
        <label className="label">{text}</label>
        <span className="info-button-container">
          <InfoButtonPopup heading={infoHeading} description={infoDescription} widePopup={true} />
        </span>
      </div>
      <NumericInput {...props} />
    </div>
  );
}

export function Button({ onClick, onChange, linkRef, tooltip, tooltipId, text, className }) {
  return (
    <>
      <ButtonCN
        className={`button-rect default-height default-min-width ${className}`}
        data-tooltip-id={tooltipId}
        data-tooltip-content={tooltip}
        onClick={onClick}
      >
        <span>{text}</span>
        <input type="file" style={{ display: "none" }} onChange={onChange} ref={linkRef} />
      </ButtonCN>
      <Tooltip id={tooltipId} place="top" effect="solid" className="tooltip-gui" />
    </>
  );
}

export function LassoSelectionBlock({ selectionCount, onClearSelection }) {
  const hasSelection = selectionCount > 0;
  const message = hasSelection ? `${selectionCount} node${selectionCount === 1 ? "" : "s"} selected` : "Draw a shape on the canvas to select nodes.";

  return (
    <div className="block-section block-section-stack">
      <div className="sidebar-control-body">
        <span className="text-secondary">{message}</span>
        {hasSelection && <Button text={"Clear Lasso Selection"} onClick={onClearSelection} />}
      </div>
    </div>
  );
}

export function CodeEditorBlock({ text, onClick, compilerError, defaultValue, textareaRef, infoHeading, infoDescription }) {
  return (
    <div className="block-section block-section-stack">
      <div className="sidebar-control-header">
        <label className="label">{text}</label>
        <span className="info-button-container">
          <InfoButtonPopup heading={infoHeading} description={infoDescription} />
        </span>
      </div>
      <div className="sidebar-control-body sidebar-control-body--code">
        <div className="code-editor-container">
          <textarea ref={textareaRef} defaultValue={defaultValue}></textarea>
        </div>
        <Button onClick={onClick} text="Apply" />
      </div>
      {compilerError && <span className="sidebar-control-helper text-warning">{compilerError}</span>}
    </div>
  );
}

export function Popup({ heading, description, isOpen, setIsOpen, widePopup, children }) {
  const popupContainer = widePopup ? "popup-container-wide" : "popup-container";

  return (
    isOpen && (
      <div className="popup-overlay">
        <div className={popupContainer}>
          <div className="popup-header pad-bottom-1">
            <span className="popup-heading">{heading}</span>
            <span className="svg-button" onClick={() => setIsOpen(false)}>
              <XIcon />
            </span>
          </div>
          <div className="block-section text-primary">{description}</div>
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
      <button type="button" className="info-button" onClick={() => setIsOpen(!isOpen)}>
        <InfoCircleIcon className="info-button-icon" />
      </button>
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
        <div className={"block-section pad-top-05 pad-bottom-05"}>
          <label className="label">{textInfront}</label>
          <div className="text-field pad-left-025 pad-right-025">{textInside}</div>
        </div>
      </>
    );
  } else {
    return (
      <>
        <label className="label">{textInfront}</label>
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
  showActionIconOn,
  itemTooltipContent,
  actionIconTooltipContent,
  ActionIcon2,
  onActionIcon2Click,
  actionIcon2TooltipContent,
  dark,
}) {
  const instanceId = useId();

  return (
    <div>
      <div className="table-list-heading">{heading}</div>
      <table className={`item-table ${dark && "dark-item-table"}`}>
        <tbody>
          {data && data.length > 0 ? (
            data.map((item, index) => (
              <tr key={`row-${instanceId}-${index}`} className="item-table-entry-highlight">
                <td
                  className="item-table-text"
                  onClick={() => onItemClick && onItemClick(item)}
                  {...(itemTooltipContent && {
                    "data-tooltip-id": `item-tooltip-${instanceId}-${index}`,
                    "data-tooltip-content": itemTooltipContent(item),
                  })}
                >
                  <span>{displayKey ? item[displayKey] : item}</span>
                </td>

                {ActionIcon && (
                  <>
                    {!showActionIconOn || showActionIconOn(item) ? (
                      <td className="item-table-logo">
                        <ActionIcon
                          key={`action-icon-${instanceId}-${index}`}
                          onClick={() => onActionIconClick && onActionIconClick(item)}
                          {...(actionIconTooltipContent && {
                            "data-tooltip-id": `action-tooltip-${instanceId}-${index}`,
                            "data-tooltip-content": actionIconTooltipContent(item),
                          })}
                        />
                      </td>
                    ) : (
                      <td className="item-table-empty-logo">
                        <ActionIcon key={`action-icon-empty-${instanceId}-${index}`} />
                      </td>
                    )}
                  </>
                )}

                {ActionIcon2 && (
                  <td className="item-table-logo">
                    <ActionIcon2
                      key={`action-icon-2-${instanceId}-${index}`}
                      onClick={() => onActionIcon2Click && onActionIcon2Click(item)}
                      {...(actionIcon2TooltipContent && {
                        "data-tooltip-id": `action-tooltip-2-${instanceId}-${index}`,
                        "data-tooltip-content": actionIcon2TooltipContent(item),
                      })}
                    />
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td className="item-table-text">
                <span>None</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {data &&
        data.length > 0 &&
        data.map((item, index) => (
          <Fragment key={`tooltip-set-${instanceId}-${index}`}>
            {itemTooltipContent && <Tooltip id={`item-tooltip-${instanceId}-${index}`} className="tooltip-gui" />}
            {actionIconTooltipContent && <Tooltip id={`action-tooltip-${instanceId}-${index}`} className="tooltip-gui" />}
            {actionIcon2TooltipContent && <Tooltip id={`action-tooltip-2-${instanceId}-${index}`} className="tooltip-gui" />}
          </Fragment>
        ))}
    </div>
  );
}

function NumericInput({ valueText, setValue, setValueText, fallbackValue, min, max, step }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.target.blur();
    }
  };

  return (
    <>
      <InputCN
        className="input-field default-width default-height"
        type="number"
        lang="en"
        min={min}
        max={max}
        step={step}
        value={valueText}
        onChange={(event) => handleFieldChange(event, setValueText, min, max)}
        onKeyDown={handleKeyDown}
        onBlur={(event) => handleFieldBlur(event, setValue, setValueText, min, max, fallbackValue)}
      />
    </>
  );
}
