import React, { useState } from "react";
import { Tooltip } from "react-tooltip";

import { Colors } from "./headerBarColors";
import { Mapping } from "./headerBarMapping";
import { DropDownExport } from "./headerBarExport";

export function HeaderBar({
  handleDownloadJSONClick,
  handleDownloadPNGClick,
  handleDownloadSVGClick,
  handleUploadSchemeClick,
  colorSchemeInputRef,
  handleNewScheme,
  setNodeColorScheme,
  nodeColorScheme,
  linkColorScheme,
  setLinkColorScheme,
  colorSchemes,
  mapping,
  handleDeleteColorScheme,
  groupToColorIndex,
  attribToColorIndex,
}) {
  const [activeMenu, setActiveMenu] = useState("None");

  const handleActiveMenuClick = (item) => {
    if (activeMenu === item) {
      setActiveMenu("None");
    } else {
      setActiveMenu(item);
    }
  };

  return (
    <div className="top-right-buttons">
      <Mapping
        mapping={mapping}
        nodeColorScheme={nodeColorScheme}
        linkColorScheme={linkColorScheme}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        handleActiveMenuClick={handleActiveMenuClick}
        groupToColorIndex={groupToColorIndex}
        attribToColorIndex={attribToColorIndex}
      />
      <Colors
        handleUploadSchemeClick={handleUploadSchemeClick}
        colorSchemeInputRef={colorSchemeInputRef}
        handleNewScheme={handleNewScheme}
        setNodeColorScheme={setNodeColorScheme}
        nodeColorScheme={nodeColorScheme}
        linkColorScheme={linkColorScheme}
        setLinkColorScheme={setLinkColorScheme}
        colorSchemes={colorSchemes}
        handleDeleteColorScheme={handleDeleteColorScheme}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        handleActiveMenuClick={handleActiveMenuClick}
      />
      <DropDownExport
        handleDownloadJSONClick={handleDownloadJSONClick}
        handleDownloadPNGClick={handleDownloadPNGClick}
        handleDownloadSVGClick={handleDownloadSVGClick}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        handleActiveMenuClick={handleActiveMenuClick}
      />
    </div>
  );
}

export function Button({ icon, onClick, innerClass, children, tooltip, tooltipId }) {
  return (
    <>
      <div className="sidebar-tooltip-wrapper">
        <a className={innerClass} onClick={onClick} data-tooltip-id={tooltipId} data-tooltip-content={tooltip}>
          {icon}
        </a>
        <Tooltip id={tooltipId} place="bottom" effect="solid" className="sidebar-tooltip" />
      </div>
      {children}
    </>
  );
}

export function Item({ icon, onClick, tooltip, tooltipId, text, children }) {
  return (
    <div className="sidebar-tooltip-wrapper">
      <li className="dropdown-item" data-tooltip-id={tooltipId} data-tooltip-content={tooltip}>
        <a className="dropdown-link" onClick={onClick}>
          <span className="fa-primary">{icon}</span>
          <b className="dropdown-text pad-right-05">{text}</b>
        </a>
        <Tooltip id={tooltipId} place="top" effect="solid" className="sidebar-tooltip" />
        {children}
      </li>
    </div>
  );
}

export function UploadItem({ icon, onClick, onChange, linkRef, text, children }) {
  return (
    <li className="dropdown-item">
      <a className="dropdown-link" onClick={onClick}>
        <span className="fa-primary">{icon}</span>
        <b className="dropdown-text pad-right-05">{text}</b>
        <input type="file" style={{ display: "none" }} onChange={onChange} ref={linkRef} />
      </a>
      {children}
    </li>
  );
}
