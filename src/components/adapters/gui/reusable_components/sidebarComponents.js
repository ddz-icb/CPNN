import { ButtonCN } from "./shadcn_blocks/buttonCN.jsx";
import { Fragment, useState } from "react";
import { SvgIcon } from "./SvgIcon.jsx";
import infoCircleSvg from "../../../../assets/icons/infoCircle.svg?raw";
import xSvg from "../../../../assets/icons/x.svg?raw";
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
          <InfoButtonPopup heading={infoHeading} description={infoDescription} />
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
          <InfoButtonPopup heading={infoHeading} description={infoDescription} />
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
          <InfoButtonPopup heading={infoHeading} description={infoDescription} />
        </span>
      </div>
      <NumericInput {...props} />
    </div>
  );
}

export function TextFieldBlock({ text, infoHeading, infoDescription, infoChildren, value, setValue, placeholder = "", size = "default" }) {
  const showInfo = Boolean(infoHeading || infoDescription || infoChildren);
  return (
    <div className="block-section">
      <div className="sidebar-control-header">
        <label className="label">{text}</label>
        {showInfo && (
          <span className="info-button-container">
            <InfoButtonPopup heading={infoHeading} description={infoDescription}>
              {infoChildren}
            </InfoButtonPopup>
          </span>
        )}
      </div>
      <TextInput value={value} setValue={setValue} placeholder={placeholder} size={size} />
    </div>
  );
}

export function SelectFieldBlock({
  text,
  infoHeading,
  infoDescription,
  infoChildren,
  infoWidePopup = false,
  value,
  setValue,
  options = [],
  size = "default",
}) {
  const showInfo = Boolean(infoHeading || infoDescription || infoChildren);

  return (
    <div className="block-section">
      <div className="sidebar-control-header">
        <label className="label">{text}</label>
        {showInfo && (
          <span className="info-button-container">
            <InfoButtonPopup heading={infoHeading} description={infoDescription} widePopup={infoWidePopup}>
              {infoChildren}
            </InfoButtonPopup>
          </span>
        )}
      </div>
      <SelectInput value={value} setValue={setValue} options={options} size={size} />
    </div>
  );
}

export function FieldApplyBlock({
  text,
  infoHeading,
  infoDescription,
  valueText,
  setValueText,
  onApply,
  min = 0,
  max = Infinity,
  step = 1,
  applyText = "Apply",
}) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (onApply) onApply();
      event.target.blur();
    }
  };

  return (
    <div className="block-section block-section-stack">
      <div className="sidebar-control-header">
        <label className="label">{text}</label>
        <span className="info-button-container">
          <InfoButtonPopup heading={infoHeading} description={infoDescription} />
        </span>
      </div>
      <div className="sidebar-control-body">
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
        />
        <Button text={applyText} onClick={onApply} />
      </div>
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

export function LassoSelectionBlock({ selectionCount, onClearSelection, isActive }) {
  const hasSelection = selectionCount > 0;
  const message = hasSelection
    ? `${selectionCount} node${selectionCount === 1 ? "" : "s"} selected`
    : isActive
      ? "Draw a shape on the canvas to select nodes."
      : 'Click "Draw Lasso" to select nodes.';

  return (
    <div className="block-section block-section-stack">
      <div className="sidebar-control-body">
        <span className="text-secondary">{message}</span>
        {hasSelection && <Button text={"Clear Lasso Selection"} onClick={onClearSelection} />}
      </div>
    </div>
  );
}

export function LassoFilterBlock({ isActive, selectionCount, onToggle, onClearSelection, infoHeading, infoDescription }) {
  const showSelection = isActive || selectionCount > 0;

  return (
    <>
      <div className="block-section">
        <div className="sidebar-control-header">
          <label className="label">Lasso Filter</label>
          <span className="info-button-container">
            <InfoButtonPopup heading={infoHeading} description={infoDescription} />
          </span>
        </div>
        <Button text={isActive ? "Cancel Lasso" : "Draw Lasso"} onClick={onToggle} />
      </div>
      {showSelection && <LassoSelectionBlock selectionCount={selectionCount} onClearSelection={onClearSelection} isActive={isActive} />}
    </>
  );
}

export function CodeEditorBlock({ text, onClick, compilerError, defaultValue, textareaRef, infoHeading, infoDescription, buttonText = "Apply" }) {
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
        <Button onClick={onClick} text={buttonText} />
      </div>
      {compilerError && <span className="sidebar-control-helper text-warning">{compilerError}</span>}
    </div>
  );
}

export function Popup({ heading, description, isOpen, setIsOpen, widePopup = false, compactPopup = false, onClose, children }) {
  const popupContainer = widePopup ? "popup-container-wide" : compactPopup ? "popup-container popup-container-compact" : "popup-container";
  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  return (
    isOpen && (
      <div className="popup-overlay">
        <div className={popupContainer}>
          <div className="popup-header pad-bottom-1">
            <span className="popup-heading">{heading}</span>
            <span className="svg-button" onClick={handleClose}>
              <SvgIcon svg={xSvg} className="popup-close-icon" />
            </span>
          </div>
          <div className="popup-description text-primary">{description}</div>
          {children}
        </div>
      </div>
    )
  );
}

export function ButtonPopup({ buttonText, tooltip, tooltipId, heading, description, widePopup, onClose, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const closePopup = () => setIsOpen(false);
  const renderedChildren = typeof children === "function" ? children({ closePopup }) : children;

  return (
    <>
      <Button onClick={() => setIsOpen(!isOpen)} tooltip={tooltip} tooltipId={tooltipId} text={buttonText} />
      {isOpen && (
        <Popup
          heading={heading}
          description={description}
          children={renderedChildren}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          widePopup={widePopup}
          onClose={onClose}
        />
      )}
    </>
  );
}

export function InfoButtonPopup({ heading, description, widePopup = false, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" className="info-button" onClick={() => setIsOpen(!isOpen)}>
        <SvgIcon svg={infoCircleSvg} className="info-button-icon" />
      </button>
      {isOpen && (
        <Popup
          heading={heading}
          description={description}
          children={children}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          widePopup={widePopup}
          compactPopup={!widePopup}
        />
      )}
    </>
  );
}

export function PopupTextField({ textInfront, textInside, inline }) {
  if (inline) {
    return (
      <span className="popup-text-field-inline">
        {textInfront && <span className="label">{textInfront}</span>}
        <span className="text-field pad-left-025 pad-right-025">{textInside}</span>
      </span>
    );
  } else {
    return (
      <>
        {textInfront && <label className="label">{textInfront}</label>}
        <div className="text-field pad-left-025 pad-right-025 margin-bottom-025">{textInside}</div>
      </>
    );
  }
}

export function TableList({
  heading,
  data,
  displayKey,
  secondaryKey,
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
      <table className={`item-table ${dark && "plain-item-table"}`}>
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
                  <span className="item-table-primary-text">{displayKey ? item[displayKey] : item}</span>
                  {secondaryKey && item[secondaryKey] && <span className="item-table-secondary-text">{item[secondaryKey]}</span>}
                </td>

                {ActionIcon && (
                  <>
                    {!showActionIconOn || showActionIconOn(item) ? (
                      <td className="item-table-logo">
                        <ActionIcon
                          item={item}
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
                        <ActionIcon item={item} key={`action-icon-empty-${instanceId}-${index}`} />
                      </td>
                    )}
                  </>
                )}

                {ActionIcon2 && (
                  <td className="item-table-logo">
                    <ActionIcon2
                      item={item}
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

export function ToggleList({
  heading,
  data,
  displayKey,
  secondaryKey,
  expandedId,
  getItemId,
  onItemToggle,
  renderExpandedContent,
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
  const normalizedExpandedId = expandedId === null || expandedId === undefined ? null : expandedId.toString();
  const columnCount = 1 + (ActionIcon ? 1 : 0) + (ActionIcon2 ? 1 : 0);

  return (
    <div>
      <div className="table-list-heading">{heading}</div>
      <table className={`item-table ${dark && "plain-item-table"}`}>
        <tbody>
          {data && data.length > 0 ? (
            data.map((item, index) => {
              const rawItemId = getItemId ? getItemId(item) : item?.id;
              const itemId = rawItemId === null || rawItemId === undefined ? "" : rawItemId.toString();
              const isExpanded = normalizedExpandedId !== null && itemId !== "" && itemId === normalizedExpandedId;
              const rowKey = itemId || `row-${index}`;

              return (
                <Fragment key={`row-${instanceId}-${rowKey}`}>
                  <tr className="item-table-entry-highlight">
                    <td
                      className="item-table-text"
                      onClick={() => onItemToggle && onItemToggle(item)}
                      {...(itemTooltipContent && {
                        "data-tooltip-id": `item-tooltip-${instanceId}-${index}`,
                        "data-tooltip-content": itemTooltipContent(item),
                      })}
                    >
                      <span className="item-table-primary-text">{displayKey ? item[displayKey] : item}</span>
                      {secondaryKey && item[secondaryKey] && <span className="item-table-secondary-text">{item[secondaryKey]}</span>}
                    </td>

                    {ActionIcon && (
                      <>
                        {!showActionIconOn || showActionIconOn(item) ? (
                          <td className="item-table-logo">
                            <ActionIcon
                              item={item}
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
                            <ActionIcon item={item} key={`action-icon-empty-${instanceId}-${index}`} />
                          </td>
                        )}
                      </>
                    )}

                    {ActionIcon2 && (
                      <td className="item-table-logo">
                        <ActionIcon2
                          item={item}
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
                  {isExpanded && renderExpandedContent && (
                    <tr>
                      <td className="item-table-details-cell" colSpan={columnCount}>
                        {renderExpandedContent(item)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })
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

export function DetailRow({ label, value }) {
  const isList = Array.isArray(value);

  return (
    <div className={`toggle-list-detail-item toggle-list-detail-row${isList ? " toggle-list-detail-row--multiline" : ""}`}>
      <span className="item-table-primary-text">{label}</span>
      <div className="text-secondary toggle-list-detail-value">
        {isList ? value.map((entry, index) => <div key={`${label}-${index}`}>{entry}</div>) : value}
      </div>
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

function TextInput({ value, setValue, placeholder, size = "default" }) {
  const widthClass = size === "wide" ? "sidebar-control-input--wide" : "default-width";
  return (
    <InputCN
      className={`input-field input-field--text ${widthClass} default-height`}
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

function SelectInput({ value, setValue, options, size = "default" }) {
  const widthClass = size === "wide" ? "sidebar-control-input--wide" : "default-width";
  return (
    <select className={`sidebar-select ${widthClass} default-height`} value={value} onChange={(event) => setValue(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
