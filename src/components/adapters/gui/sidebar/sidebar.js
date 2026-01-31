import { useState } from "react";
import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import xSvg from "../../../../assets/icons/x.svg?raw";

import { FilterSidebar } from "./filterSidebar.js";
import { PhysicsSidebar } from "./physicsSidebar.js";
import { DataSidebar } from "./dataSidebar.js";
import { SelectionSidebar } from "./selectionSidebar.js";
import { SearchSidebar } from "./searchSidebar.js";
import { AppearanceSidebar } from "./appearanceSidebar.js";
import { ExportSidebar } from "./exportSidebar.js";
import { CommunitySidebar } from "./communitySidebar.js";

export function Sidebar(props) {
  const [activeNavItem, setActiveNavItem] = useState("Selection");

  const sidebarComponents = {
    Selection: <SelectionSidebar handleNavItemClick={(item) => setActiveNavItem(item)} />,
    Data: <DataSidebar {...props} />,
    Search: <SearchSidebar />,
    Filter: <FilterSidebar />,
    Groups: <CommunitySidebar />,
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
        <SvgIcon svg={xSvg} />
      </button>
    </li>
  );
}
