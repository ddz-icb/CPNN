import React, { useState } from "react";
import { Tooltip } from "react-tooltip";

import { Mapping } from "./headerBarMapping.js";
import { HeaderBarExport } from "./headerBarExport.js";

export function HeaderBar({}) {
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
      <Mapping activeMenu={activeMenu} handleActiveMenuClick={handleActiveMenuClick} />
      <HeaderBarExport activeMenu={activeMenu} handleActiveMenuClick={handleActiveMenuClick} />
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
          <span className="fa-primary small-icon">{icon}</span>
          <p className="dropdown-text pad-right-1">{text}</p>
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
        <span className="fa-primary small-icon">{icon}</span>
        <p className="dropdown-text pad-right-1 inline">{text}</p>
        <input type="file" style={{ display: "none" }} onChange={onChange} ref={linkRef} />
      </a>
      {children}
    </li>
  );
}
