import "../../index.css";
import React, { useState } from "react";
import { ReactComponent as BackArrowIcon } from "../../icons/backArrow.svg";
import { ReactComponent as InfoIcon } from "../../icons/info.svg";
import { ReactComponent as XIcon } from "../../icons/x.svg";
import { Tooltip } from "react-tooltip";

import { FilterSidebar } from "./filterSidebar.js";
import { PhysicsSidebar } from "./physicsSidebar.js";
import { DataSidebar } from "./dataSidebar.js";
import { MainSidebar } from "./mainSidebar.js";
import { AppearanceSidebar } from "./appearanceSidebar.js";

export function Sidebar({
  handleSelectGraph,
  handleDeleteGraphFile,
  handleRemoveActiveGraphFile,
  handleAddFile,
  handleNewAnnotationMapping,
  handleRemoveActiveAnnotationMapping,
  handleAnnotationMappingSelect,
  handleDeleteAnnotationMapping,
  handleNewGraphFile,
  handleNewColorScheme,
  handleDeleteColorScheme,
  colorSchemes,
  resetPhysics,
  resetFilters,
}) {
  const [activeNavItem, setActiveNavItem] = useState("Main");

  function handleNavItemClick(item) {
    if (activeNavItem === item) {
      setActiveNavItem("Main");
    } else {
      setActiveNavItem(item);
    }
  }

  let content = null;
  if (activeNavItem === "Main") {
    content = (
      <Navbar short={true}>
        <MainSidebar handleNavItemClick={handleNavItemClick} />
      </Navbar>
    );
  } else if (activeNavItem === "Data") {
    content = (
      <Navbar>
        <Back activeNavItem={activeNavItem} icon={<BackArrowIcon />} onClick={() => handleNavItemClick("Main")} />
        <DataSidebar
          handleRemoveActiveGraphFile={handleRemoveActiveGraphFile}
          handleSelectGraph={handleSelectGraph}
          handleDeleteGraphFile={handleDeleteGraphFile}
          handleAddFile={handleAddFile}
          handleNewAnnotationMapping={handleNewAnnotationMapping}
          handleRemoveActiveAnnotationMapping={handleRemoveActiveAnnotationMapping}
          handleAnnotationMappingSelect={handleAnnotationMappingSelect}
          handleDeleteAnnotationMapping={handleDeleteAnnotationMapping}
          handleNewGraphFile={handleNewGraphFile}
        />
      </Navbar>
    );
  } else if (activeNavItem === "Filter") {
    content = (
      <Navbar>
        <Back activeNavItem={activeNavItem} icon={<BackArrowIcon />} onClick={() => handleNavItemClick("Main")} />
        <FilterSidebar resetFilters={resetFilters} />
      </Navbar>
    );
  } else if (activeNavItem === "Physics") {
    content = (
      <Navbar>
        <Back activeNavItem={activeNavItem} icon={<BackArrowIcon />} onClick={() => handleNavItemClick("Main")} />
        <PhysicsSidebar resetPhysics={resetPhysics} />
      </Navbar>
    );
  } else if (activeNavItem === "Appearance") {
    content = (
      <Navbar>
        <Back activeNavItem={activeNavItem} icon={<BackArrowIcon />} onClick={() => handleNavItemClick("Main")} />
        <AppearanceSidebar
          handleNewColorScheme={handleNewColorScheme}
          handleDeleteColorScheme={handleDeleteColorScheme}
          colorSchemes={colorSchemes}
        />
      </Navbar>
    );
  }

  return <>{content}</>;
}

function Navbar({ short, children }) {
  return (
    <nav className={`navbar ${short ? "short" : ""}`}>
      <ul className="navbar-nav">{children}</ul>
    </nav>
  );
}

function Back({ activeNavItem, icon, onClick }) {
  return (
    <>
      <li className="back sidebar-tooltip-wrapper">
        <span data-tooltip-id={`back-tooltip`} data-tooltip-content="Go Back" className="back-icon" onClick={onClick}>
          {icon}
        </span>
        <div className="link-text-container">
          <p className="link-text back-text">{activeNavItem}</p>
        </div>
      </li>
    </>
  );
}

export function SidebarSliderBlock({ text, value, valueText, onChangeSlider, onChangeField, onChangeBlur, min, max, stepSlider, stepField }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.target.blur();
    }
  };

  return (
    <>
      <label className="label pad-left-1">{text}</label>
      <div className="sidebar-block pad-bottom-15">
        <input className="sidebar-slider" type="range" min={min} max={max} step={stepSlider} value={value} onChange={onChangeSlider}></input>
        <input
          className="input-field"
          type="number"
          min={min}
          max={max}
          step={stepField}
          value={valueText}
          onChange={onChangeField}
          onKeyDown={handleKeyDown}
          onBlur={onChangeBlur}
        />
      </div>
    </>
  );
}

export function PopUpSliderBlock({ text, value, valueText, onChangeSlider, onChangeField, onChangeBlur, min, max, stepSlider, stepField }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.target.blur();
    }
  };

  return (
    <>
      <label className="label">{text}</label>
      <div className="popup-block pad-bottom-05">
        <input className="sidebar-slider" type="range" min={min} max={max} step={stepSlider} value={value} onChange={onChangeSlider}></input>
        <input
          className="input-field"
          type="number"
          min={min}
          max={max}
          step={stepField}
          value={valueText}
          onChange={onChangeField}
          onKeyDown={handleKeyDown}
          onBlur={onChangeBlur}
        />
      </div>
    </>
  );
}

export function SidebarSwitchBlock({ text, value, onChange }) {
  return (
    <>
      <div className="sidebar-block">
        <label className="label">{text}</label>
        <label className="switch">
          <input type="checkbox" checked={value} onChange={onChange} className="checkbox-input" />
          <span className="slider round"></span>
        </label>
      </div>
    </>
  );
}

export function PopUpSwitchBlock({ text, value, onChange }) {
  return (
    <>
      <div className="popup-block">
        <label className="label">{text}</label>
        <label className="switch">
          <input type="checkbox" checked={value} onChange={onChange} className="checkbox-input" />
          <span className="slider round"></span>
        </label>
      </div>
    </>
  );
}

export function SidebarFieldBlock({ text, min, max, step, value, onChange, onBlur }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.target.blur();
    }
  };

  return (
    <>
      <label className="label pad-left-1">{text}</label>
      <div className="sidebar-block">
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
    </>
  );
}

export function PopUpFieldBlock({ text, min, max, step, value, onChange, onBlur }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.target.blur();
    }
  };

  return (
    <>
      <div className="popup-block">
        <label className="label">{text}</label>
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

export function PopupButtonRect({ onClick, onChange, linkRef, tooltip, tooltipId, text }) {
  return (
    <div className="popup-tooltip-wrapper justify-right pad-top-1">
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
        <span className="tooltip-button pad-left-1 pad-top-05" onClick={() => setInfoIsOpen(true)}>
          <InfoIcon />
        </span>
      </div>
      <div className={`sidebar-block ${compilerError ? "no-pad-bottom" : ""}`}>
        <div className="custom-editor">
          <textarea ref={textareaRef} defaultValue={defaultValue}></textarea>
        </div>
        <SidebarButtonRect onClick={onClick} text="Run" />
      </div>
      <span className={`warning ${compilerError ? "pad-bottom-1" : ""}`}>{compilerError}</span>
      <PopUp heading={infoHeading} description={infoDescription} isOpen={infoIsOpen} setIsOpen={setInfoIsOpen} />
    </>
  );
}

export function PopUpTextFieldInline({ textInfront, textInside }) {
  return (
    <div className="inline">
      <label className="label-no-pad pad-top-1">{textInfront}</label>
      <div className={"popup-block"}>
        <div className="popup-text-field pad-left-025 pad-right-025">{textInside}</div>
      </div>
    </div>
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

export function PopUp({ heading, description, children, isOpen, setIsOpen }) {
  return (
    isOpen && (
      <div className="popup-overlay">
        <div className="popup-container">
          <div className="popup-header pad-bottom-1">
            <b>{heading}</b>
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
