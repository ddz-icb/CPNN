import "../../index.css";
import React, { useState } from "react";
import { ReactComponent as BackIcon } from "../../icons/leftArrow.svg";
import { Tooltip } from "react-tooltip";

import { FilterSidebar } from "./filterSidebar.js";
import { PhysicsSidebar } from "./physicsSidebar.js";
import { DataSidebar } from "./dataSidebar.js";
import { MainSidebar } from "./mainSidebar.js";

export function Sidebar({
  changeTheme,
  theme,
  uploadedFiles,
  activeFiles,
  handleFileSelect,
  handleDeleteFile,
  handleRemoveActiveFile,
  handleAddFile,
  linkThreshold,
  minCompSize,
  linkAttribs,
  setLinkThreshold,
  setMinCompSize,
  setLinkAttribs,
  linkAttribsText,
  setLinkAttribsText,
  linkLength,
  checkBorder,
  borderHeight,
  borderWidth,
  setLinkLength,
  setCheckBorder,
  setBorderHeight,
  setBorderWidth,
  xStrength,
  setXStrength,
  yStrength,
  setYStrength,
  componentStrength,
  setComponentStrength,
  linkForce,
  setLinkForce,
  nodeRepulsionStrength,
  setNodeRepulsionStrength,
  circleLayout,
  setCircleLayout,
  handleNewMapping,
  mappingInputRef,
  handleUploadMappingClick,
  activeMapping,
  handleRemoveActiveMapping,
  uploadedMappings,
  handleMappingSelect,
  handleDeleteMapping,
  handleGraphAbsUploadClick,
  handleGraphZeroUploadClick,
  graphInputRef,
  handleNewFile,
  nodeFilterText,
  setNodeFilterText,
  setNodeFilter,
  resetPhysics,
  resetFilters,
  graphAbsInputRef,
  graphZeroInputRef,
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
        <MainSidebar theme={theme} changeTheme={changeTheme} handleNavItemClick={handleNavItemClick} />
      </Navbar>
    );
  } else if (activeNavItem === "Data") {
    content = (
      <Navbar>
        <Back activeNavItem={activeNavItem} icon={<BackIcon />} onClick={() => handleNavItemClick("Main")} />
        <DataSidebar
          activeFiles={activeFiles}
          handleRemoveActiveFile={handleRemoveActiveFile}
          uploadedFiles={uploadedFiles}
          handleFileSelect={handleFileSelect}
          handleDeleteFile={handleDeleteFile}
          handleAddFile={handleAddFile}
          handleNewMapping={handleNewMapping}
          mappingInputRef={mappingInputRef}
          handleUploadMappingClick={handleUploadMappingClick}
          activeMapping={activeMapping}
          handleRemoveActiveMapping={handleRemoveActiveMapping}
          uploadedMappings={uploadedMappings}
          handleMappingSelect={handleMappingSelect}
          handleDeleteMapping={handleDeleteMapping}
          handleGraphAbsUploadClick={handleGraphAbsUploadClick}
          handleGraphZeroUploadClick={handleGraphZeroUploadClick}
          handleNewFile={handleNewFile}
          graphAbsInputRef={graphAbsInputRef}
          graphZeroInputRef={graphZeroInputRef}
        />
      </Navbar>
    );
  } else if (activeNavItem === "Filter") {
    content = (
      <Navbar>
        <Back activeNavItem={activeNavItem} icon={<BackIcon />} onClick={() => handleNavItemClick("Main")} />
        <FilterSidebar
          linkThreshold={linkThreshold}
          minCompSize={minCompSize}
          linkAttribs={linkAttribs}
          setLinkThreshold={setLinkThreshold}
          setMinCompSize={setMinCompSize}
          setLinkAttribs={setLinkAttribs}
          linkAttribsText={linkAttribsText}
          setLinkAttribsText={setLinkAttribsText}
          theme={theme}
          nodeFilterText={nodeFilterText}
          setNodeFilterText={setNodeFilterText}
          setNodeFilter={setNodeFilter}
          resetFilters={resetFilters}
        />
      </Navbar>
    );
  } else if (activeNavItem === "Physics") {
    content = (
      <Navbar>
        <Back activeNavItem={activeNavItem} icon={<BackIcon />} onClick={() => handleNavItemClick("Main")} />
        <PhysicsSidebar
          linkLength={linkLength}
          checkBorder={checkBorder}
          borderHeight={borderHeight}
          borderWidth={borderWidth}
          setLinkLength={setLinkLength}
          setCheckBorder={setCheckBorder}
          setBorderHeight={setBorderHeight}
          setBorderWidth={setBorderWidth}
          xStrength={xStrength}
          setXStrength={setXStrength}
          yStrength={yStrength}
          setYStrength={setYStrength}
          componentStrength={componentStrength}
          setComponentStrength={setComponentStrength}
          linkForce={linkForce}
          setLinkForce={setLinkForce}
          nodeRepulsionStrength={nodeRepulsionStrength}
          setNodeRepulsionStrength={setNodeRepulsionStrength}
          circleLayout={circleLayout}
          setCircleLayout={setCircleLayout}
          resetPhysics={resetPhysics}
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
          <Tooltip id={`back-tooltip`} place="bottom" effect="solid" className="sidebar-tooltip" />
        </span>
        <div className="link-text-container">
          <b className="link-text back-text">{activeNavItem}</b>
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
      <div className="sidebar-block">
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

export function SidebarFieldBlock({ text, min, max, step, value, onChange, onBlur }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.target.blur();
    }
  };

  return (
    <div className="sidebar-block">
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

export function SidebarCodeEditorBlock({ text, onClick, compilerError, defaultValue, textareaRef }) {
  return (
    <>
      <label className="label pad-left-1">{text}</label>
      <div className={`sidebar-block ${compilerError ? "no-pad-bottom" : ""}`}>
        <div className="custom-editor">
          <textarea ref={textareaRef} defaultValue={defaultValue}></textarea>
        </div>
        <SidebarButtonRect onClick={onClick} text={"Run"} />
      </div>
      <span className={`warning ${compilerError ? "pad-bottom-1" : ""}`}>{compilerError}</span>
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
