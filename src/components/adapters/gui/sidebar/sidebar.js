import { useState } from "react";
import { ReactComponent as CloseIcon } from "../../../../assets/icons/x.svg";

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
      {isSelection ? (
        <>
          <LogoBar />
          <div className="navbar-main">{currentSidebar}</div>
        </>
      ) : (
        <>
          <BackBar activeNavItem={activeNavItem} onClick={() => setActiveNavItem("Selection")} />
          <div className="navbar-subsection">{currentSidebar}</div>
        </>
      )}
    </Navbar>
  );
}

function Navbar({ short, children }) {
  return (
    <nav className={`navbar ${short && "short"}`}>
      <ul>{children}</ul>
    </nav>
  );
}

function LogoBar({ onClick }) {
  return (
    <li className="logo-container" onClick={onClick}>
      <img src="./logos/ddz_logo_en.png" className="logo" />
    </li>
  );
}

function BackBar({ activeNavItem, onClick }) {
  return (
    <li className="back-overlay">
      <div className="back-text">
        <p className="link-text">{activeNavItem}</p>
      </div>
      <button className="back-close" onClick={onClick} type="button" aria-label="Close sidebar">
        <CloseIcon />
      </button>
    </li>
  );
}
