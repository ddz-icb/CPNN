import { useState } from "react";
import { ReactComponent as InfoIcon } from "../../../icons/info.svg";
import { ReactComponent as XIcon } from "../../../icons/x.svg";
import { Tooltip } from "react-tooltip";
import { handleFieldBlur, handleFieldChange, handleSliderChange } from "../../Other/handlers.js";

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
      <div className="sidebar-block pad-bottom-15">
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

export function NewPopUpSliderBlock({ value, valueText, setValue, setValueText, fallbackValue, min, max, step, text, infoHeading, infoDescription }) {
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

export function SidebarSwitchBlock({ text, value, onChange, infoHeading, infoDescription }) {
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
          <input type="checkbox" checked={value} onChange={onChange} className="checkbox-input" />
          <span className="slider round"></span>
        </label>
      </div>
      <PopUp heading={infoHeading} description={infoDescription} isOpen={infoIsOpen} setIsOpen={setInfoIsOpen} />
    </>
  );
}

export function PopUpSwitchBlock({ text, value, onChange, infoHeading, infoDescription }) {
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
          <input type="checkbox" checked={value} onChange={onChange} className="checkbox-input" />
          <span className="slider round"></span>
        </label>
      </div>
      <PopUp heading={infoHeading} description={infoDescription} isOpen={infoIsOpen} setIsOpen={setInfoIsOpen} widePopUp={true} />
    </>
  );
}

export function SidebarFieldBlock({ text, min, max, step, value, onChange, onBlur, infoHeading, infoDescription }) {
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
          min={min}
          max={max}
          step={step}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          value={value}
          onBlur={onBlur}
        ></input>
      </div>
      <PopUp heading={infoHeading} description={infoDescription} isOpen={infoIsOpen} setIsOpen={setInfoIsOpen} />
    </>
  );
}

export function PopUpFieldBlock({ text, min, max, step, value, onChange, onBlur, infoHeading, infoDescription }) {
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
          min={min}
          max={max}
          step={step}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          value={value}
          onBlur={onBlur}
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

export function PopupButtonRect({ className, onClick, onChange, linkRef, tooltip, tooltipId, text }) {
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

export function PopUpTextFieldInline({ textInfront, textInside }) {
  return (
    <div className="popup-block">
      <label className="label-no-pad">{textInfront}</label>
      <div className="popup-text-field pad-left-025 pad-right-025">{textInside}</div>
    </div>
  );
}

export function PopUpTextFieldCompact({ textInfront, textInside }) {
  return (
    <>
      <label className="label-no-pad">{textInfront}</label>
      <div className="popup-text-field pad-left-025 pad-right-025 margin-bottom-025">{textInside}</div>
    </>
  );
}

export function PopUpTextField({ textInfront, textInside }) {
  return (
    <div>
      <label className="label-no-pad pad-top-1">{textInfront}</label>
      <div className={"popup-block"}>
        <div className="popup-text-field pad-left-025 pad-right-025">{textInside}</div>
      </div>
    </div>
  );
}

export function PopUpDoubleTextField({ textInfront, textInside1, textInside2 }) {
  return (
    <>
      <label className="label-no-pad pad-top-1">{textInfront}</label>
      <div className={"popup-block"}>
        <div className="popup-text-field pad-left-025 pad-right-025">{textInside1}</div>
      </div>
      <div className={"popup-block"}>
        <div className="popup-text-field pad-left-025 pad-right-025">{textInside2}</div>
      </div>
    </>
  );
}

export function SidebarDropdownItem({ onClick, onChange, linkRef, tooltip, tooltipId, text, children }) {
  return (
    <div className="sidebar-tooltip-wrapper">
      <li className="sidebar-dropdown-item pad-top-05 pad-bottom-05 pad-left-05" data-tooltip-id={tooltipId} data-tooltip-content={tooltip}>
        <a
          className="dropdown-link"
          onClick={() => {
            onClick();
          }}
        >
          <span className="dropdown-text pad-right-05">{text}</span>
        </a>
        <input type="file" style={{ display: "none" }} onChange={onChange} ref={linkRef} />
        <Tooltip id={tooltipId} place="top" effect="solid" className="sidebar-tooltip" />
        {children}
      </li>
    </div>
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
