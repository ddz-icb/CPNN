import { Fragment, useState } from "react";
import { ReactComponent as InfoIcon } from "../../../icons/info.svg";
import { ReactComponent as XIcon } from "../../../icons/x.svg";
import { Tooltip } from "react-tooltip";
import { handleFieldBlur, handleFieldChange, handleSliderChange } from "../../other/handlers.js";

export function SidebarSliderBlock({ value, valueText, setValue, setValueText, fallbackValue, min, max, step, text, infoHeading, infoDescription }) {
  const [infoIsOpen, setInfoIsOpen] = useState(false);

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.target.blur();
    }
  };

  return (
    <>
      <div className="inline">
        <label className="label pad-left-1">{text}</label>
        <span className="tooltip-button pad-left-05 pad-top-11" onClick={() => setInfoIsOpen(true)}>
          <InfoIcon />
        </span>
      </div>
      <div className="sidebar-block">
        <input
          className="sidebar-slider"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => handleSliderChange(event, setValue, setValueText, min, max)}
        ></input>
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
      </div>
      <PopUp heading={infoHeading} description={infoDescription} isOpen={infoIsOpen} setIsOpen={setInfoIsOpen} />
    </>
  );
}

export function PopUpSliderBlock({ value, valueText, setValue, setValueText, fallbackValue, min, max, step, text, infoHeading, infoDescription }) {
  const [infoIsOpen, setInfoIsOpen] = useState(false);

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.target.blur();
    }
  };

  return (
    <>
      <div className="inline">
        <label className="label">{text}</label>
        <span className="tooltip-button pad-left-05 pad-top-11" onClick={() => setInfoIsOpen(true)}>
          <InfoIcon />
        </span>
      </div>
      <div className="popup-block pad-bottom-05">
        <input
          className="sidebar-slider"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => handleSliderChange(event, setValue, setValueText, min, max)}
        ></input>
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
      </div>
      <PopUp heading={infoHeading} description={infoDescription} isOpen={infoIsOpen} setIsOpen={setInfoIsOpen} widePopUp={true} />
    </>
  );
}

export function SidebarSwitchBlock({ value, setValue, text, infoHeading, infoDescription }) {
  const [infoIsOpen, setInfoIsOpen] = useState(false);

  return (
    <>
      <div className="sidebar-block">
        <div className="inline">
          <label className="label">{text}</label>
          <span className="tooltip-button pad-left-05 pad-top-11" onClick={() => setInfoIsOpen(true)}>
            <InfoIcon />
          </span>
        </div>
        <label className="switch">
          <input type="checkbox" checked={value} onChange={setValue} className="checkbox-input" />
          <span className="slider round"></span>
        </label>
      </div>
      <PopUp heading={infoHeading} description={infoDescription} isOpen={infoIsOpen} setIsOpen={setInfoIsOpen} />
    </>
  );
}

export function PopUpSwitchBlock({ value, setValue, text, infoHeading, infoDescription }) {
  const [infoIsOpen, setInfoIsOpen] = useState(false);

  return (
    <>
      <div className="popup-block">
        <div className="inline">
          <label className="label">{text}</label>
          <span className="tooltip-button pad-left-05 pad-top-11" onClick={() => setInfoIsOpen(true)}>
            <InfoIcon />
          </span>
        </div>
        <label className="switch">
          <input type="checkbox" checked={value} onChange={setValue} className="checkbox-input" />
          <span className="slider round"></span>
        </label>
      </div>
      <PopUp heading={infoHeading} description={infoDescription} isOpen={infoIsOpen} setIsOpen={setInfoIsOpen} widePopUp={true} />
    </>
  );
}

export function SidebarFieldBlock({ valueText, setValue, setValueText, fallbackValue, min, max, step, text, infoHeading, infoDescription }) {
  const [infoIsOpen, setInfoIsOpen] = useState(false);

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.target.blur();
    }
  };

  return (
    <>
      <div className="sidebar-block">
        <div className="inline">
          <label className="label">{text}</label>
          <span className="tooltip-button pad-left-05 pad-top-11" onClick={() => setInfoIsOpen(true)}>
            <InfoIcon />
          </span>
        </div>
        <input
          className="input-field"
          type="number"
          value={valueText}
          min={min}
          max={max}
          step={step}
          onChange={(event) => handleFieldChange(event, setValueText, min, max)}
          onKeyDown={handleKeyDown}
          onBlur={(event) => handleFieldBlur(event, setValue, setValueText, min, max, fallbackValue)}
        ></input>
      </div>
      <PopUp heading={infoHeading} description={infoDescription} isOpen={infoIsOpen} setIsOpen={setInfoIsOpen} />
    </>
  );
}

export function PopUpFieldBlock({ valueText, setValue, setValueText, fallbackValue, min, max, step, text, infoHeading, infoDescription }) {
  const [infoIsOpen, setInfoIsOpen] = useState(false);

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.target.blur();
    }
  };

  return (
    <>
      <div className="popup-block">
        <div className="inline">
          <label className="label">{text}</label>
          <span className="tooltip-button pad-left-05 pad-top-11" onClick={() => setInfoIsOpen(true)}>
            <InfoIcon />
          </span>
        </div>
        <input
          className="input-field"
          type="number"
          value={valueText}
          min={min}
          max={max}
          step={step}
          onKeyDown={handleKeyDown}
          onChange={(event) => handleFieldChange(event, setValueText, min, max)}
          onBlur={(event) => handleFieldBlur(event, setValue, setValueText, min, max, fallbackValue)}
        ></input>
      </div>
      <PopUp heading={infoHeading} description={infoDescription} isOpen={infoIsOpen} setIsOpen={setInfoIsOpen} widePopUp={true} />
    </>
  );
}

export function SidebarButtonRect({ onClick, onChange, linkRef, tooltip, tooltipId, text }) {
  return (
    <div className="sidebar-tooltip-wrapper">
      <button className="sidebar-button-rect" data-tooltip-id={tooltipId} data-tooltip-content={tooltip} onClick={onClick}>
        <span className="sidebar-button-rect-text">{text}</span>
        <input type="file" style={{ display: "none" }} onChange={onChange} ref={linkRef} />
      </button>
      <Tooltip id={tooltipId} place="top" effect="solid" className="sidebar-tooltip" />
    </div>
  );
}

export function PopupButtonRect({ onClick, onChange, linkRef, tooltip, tooltipId, text, className }) {
  return (
    <div className={`popup-tooltip-wrapper justify-right pad-top-1 ${className}`}>
      <button className="popup-button-rect" data-tooltip-id={tooltipId} data-tooltip-content={tooltip} onClick={onClick}>
        <span className="popup-button-rect-text">{text}</span>
        <input type="file" style={{ display: "none" }} onChange={onChange} ref={linkRef} />
      </button>
      <Tooltip id={tooltipId} place="top" effect="solid" className="popup-tooltip" />
    </div>
  );
}

export function SidebarCodeEditorBlock({ text, onClick, compilerError, defaultValue, textareaRef, infoHeading, infoDescription }) {
  const [infoIsOpen, setInfoIsOpen] = useState(false);

  return (
    <>
      <div className="inline">
        <label className="label pad-left-1">{text}</label>
        <span className="tooltip-button pad-left-05 pad-top-11" onClick={() => setInfoIsOpen(true)}>
          <InfoIcon />
        </span>
      </div>
      <div className={`editor-sidebar-block ${compilerError ? "no-pad-bottom" : ""}`}>
        <div className="custom-editor">
          <textarea ref={textareaRef} defaultValue={defaultValue}></textarea>
        </div>
        <SidebarButtonRect onClick={onClick} text="Run" />
      </div>
      <span className={`pad-left-1 warning ${compilerError ? "pad-bottom-1" : ""}`}>{compilerError}</span>
      <PopUp heading={infoHeading} description={infoDescription} isOpen={infoIsOpen} setIsOpen={setInfoIsOpen} />
    </>
  );
}

export function PopUpTextField({ textInfront, textInside }) {
  return (
    <>
      <label className="label-no-pad">{textInfront}</label>
      <div className="popup-text-field pad-left-025 pad-right-025 margin-bottom-025">{textInside}</div>
    </>
  );
}

export function PopUpTextFieldInline({ textInfront, textInside }) {
  return (
    <>
      <div className={"popup-block pad-top-05 pad-bottom-05"}>
        <label className="label-no-pad">{textInfront}</label>
        <div className="popup-text-field pad-left-025 pad-right-025">{textInside}</div>
      </div>
    </>
  );
}

export function PopUp({ heading, description, children, isOpen, setIsOpen, widePopUp }) {
  const popUpContainer = widePopUp ? "popup-container-wide" : "popup-container";

  return (
    isOpen && (
      <div className="popup-overlay">
        <div className={popUpContainer}>
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

export function ColorMappingSelect({ heading, colorScheme, attribsToColorIndices, setMapping }) {
  const handleColorChange = (colorIndex, newAttribute) => {
    const updatedMapping = { ...attribsToColorIndices };

    const oldAttribute = Object.keys(updatedMapping).find((key) => updatedMapping[key] === colorIndex);

    const previousColorIndex = updatedMapping[newAttribute];

    updatedMapping[newAttribute] = colorIndex;

    if (oldAttribute) {
      if (previousColorIndex !== undefined) {
        updatedMapping[oldAttribute] = previousColorIndex;
      } else {
        const usedColors = Object.values(updatedMapping);
        const firstAvailableColor = Object.keys(colorScheme.content).find((index) => !usedColors.includes(parseInt(index, 10)));

        if (firstAvailableColor !== undefined) {
          updatedMapping[oldAttribute] = parseInt(firstAvailableColor, 10);
        } else {
          delete updatedMapping[oldAttribute];
        }
      }
    }

    setMapping(updatedMapping);
  };

  return (
    <div>
      <span className="heading-label-no-pad pad-bottom-05">{heading}</span>
      <div className="sidebar-block-no-pad">
        <div className="colormapping-selector">
          {Object.entries(colorScheme.content).map(([colorIndex, color]) => {
            const currentAttribute = Object.keys(attribsToColorIndices).find((key) => attribsToColorIndices[key] === parseInt(colorIndex, 10));

            return (
              <Fragment key={colorIndex}>
                <div
                  className="color-square colorscheme-item"
                  style={{
                    backgroundColor: color,
                  }}
                ></div>
                <select
                  className="popup-button-rect-small"
                  value={currentAttribute || ""}
                  onChange={(event) => handleColorChange(parseInt(colorIndex, 10), event.target.value)}
                >
                  {!currentAttribute && <option value="">None</option>}

                  {Object.keys(attribsToColorIndices || {}).map((attribute) => (
                    <option key={attribute} value={attribute}>
                      {attribute}
                    </option>
                  ))}
                </select>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
