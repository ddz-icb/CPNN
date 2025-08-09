import "../../../index.css";
import { useState } from "react";
import { ReactComponent as BackArrowIcon } from "../../../icons/backArrow.svg";

import { FilterSidebar } from "./filterSidebar.js";
import { PhysicsSidebar } from "./physicsSidebar.js";
import { DataSidebar } from "./dataSidebar.js";
import { MainSidebar } from "./selectionSidebar.js";
import { AppearanceSidebar } from "./appearanceSidebar.js";

export function Sidebar(props) {
  const [activeNavItem, setActiveNavItem] = useState("Main");

  const sidebarComponents = {
    Main: <MainSidebar handleNavItemClick={(item) => setActiveNavItem(item)} />,
    Data: <DataSidebar {...props} />,
    Filter: <FilterSidebar />,
    Physics: <PhysicsSidebar />,
    Appearance: <AppearanceSidebar {...props} />,
  };

  const currentSidebar = sidebarComponents[activeNavItem];
  const isMain = activeNavItem === "Main";

  return (
    <Navbar short={isMain}>
      {!isMain && <Back activeNavItem={activeNavItem} onClick={() => setActiveNavItem("Main")} />}
      {currentSidebar}
    </Navbar>
  );
}

function Navbar({ short, children }) {
  return (
    <nav className={`navbar ${short ? "short" : ""}`}>
      <ul className="navbar-nav">{children}</ul>
    </nav>
  );
}

function Back({ activeNavItem, onClick }) {
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
