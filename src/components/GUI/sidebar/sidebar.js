import "../../../index.css";
import { useState } from "react";
import { ReactComponent as BackArrowIcon } from "../../../icons/backArrow.svg";

import { FilterSidebar } from "./filterSidebar.js";
import { PhysicsSidebar } from "./physicsSidebar.js";
import { DataSidebar } from "./dataSidebar.js";
import { SelectionSidebar } from "./selectionSidebar.js";
import { AppearanceSidebar } from "./appearanceSidebar.js";
import { ExportSidebar } from "./exportSidebar.js";

export function Sidebar(props) {
  const [activeNavItem, setActiveNavItem] = useState("Selection");

  const sidebarComponents = {
    Selection: <SelectionSidebar handleNavItemClick={(item) => setActiveNavItem(item)} />,
    Data: <DataSidebar {...props} />,
    Filter: <FilterSidebar />,
    Physics: <PhysicsSidebar />,
    Appearance: <AppearanceSidebar {...props} />,
    Export: <ExportSidebar />,
  };

  const currentSidebar = sidebarComponents[activeNavItem];
  const isSelection = activeNavItem === "Selection";

  return (
    <Navbar short={isSelection}>
      {!isSelection && <BackBar activeNavItem={activeNavItem} onClick={() => setActiveNavItem("Selection")} />}
      <div className="pad-bottom-05 width-100">{currentSidebar}</div>
    </Navbar>
  );
}

function Navbar({ short, children }) {
  return (
    <nav className={`navbar ${short && "short"}`}>
      <ul className="navbar-nav">{children}</ul>
    </nav>
  );
}

function BackBar({ activeNavItem, onClick }) {
  return (
    <li className="back sidebar-tooltip-wrapper">
      <span data-tooltip-id={`back-tooltip`} data-tooltip-content="Go Back" className="back-icon" onClick={onClick}>
        <BackArrowIcon />
      </span>
      <div className="link-text-container">
        <p className="link-text back-text">{activeNavItem}</p>
      </div>
    </li>
  );
}
