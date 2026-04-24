import { useCallback, useState } from "react";
import { useSidebarKeyboard } from "../hooks/useSidebarKeyboard.js";
import { useDataFileShortcuts } from "../hooks/useDataFileShortcuts.js";
import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import leftArrowSvg from "../../../../assets/icons/leftArrow.svg?raw";

import { FilterSidebar } from "./filterSidebar.js";
import { AdditionalDataSidebar } from "./additionalDataSidebar.js";
import { PhysicsSidebar } from "./physicsSidebar.js";
import { DataSidebar } from "./dataSidebar.js";
import { SelectionSidebar } from "./selectionSidebar.js";
import { SearchSidebar } from "./searchSidebar.js";
import { AppearanceSidebar } from "./appearanceSidebar.js";
import { ExportSidebar } from "./exportSidebar.js";
import { CommunitySidebar } from "./communitySidebar.js";
import { VideographySidebar } from "./videographySidebar.js";

export function Sidebar(props) {
  const [activeNavItem, setActiveNavItem] = useState("Selection");
  const [lastNavItem, setLastNavItem] = useState("Data");

  const handleSetActiveNavItem = useCallback((item) => {
    setActiveNavItem(item);
    if (item && item !== "Selection") {
      setLastNavItem(item);
    }
  }, []);

  useSidebarKeyboard(handleSetActiveNavItem);
  useDataFileShortcuts();

  const sidebarComponents = {
    Selection: <SelectionSidebar handleNavItemClick={handleSetActiveNavItem} activeNavItem={lastNavItem} />,
    Data: <DataSidebar {...props} />,
    Search: <SearchSidebar />,
    Filter: <FilterSidebar />,
    "Additional Data": <AdditionalDataSidebar />,
    Communities: <CommunitySidebar />,
    Physics: <PhysicsSidebar />,
    Appearance: <AppearanceSidebar {...props} />,
    Videography: <VideographySidebar />,
    Export: <ExportSidebar />,
  };

  const currentSidebar = sidebarComponents[activeNavItem];
  const isSelection = activeNavItem === "Selection";

  return (
    <Navbar short={isSelection}>
      {isSelection ? (
        <>
          <LogoBar />
          <div className="navbar-main sidebar-panel" key="panel-selection">
            {currentSidebar}
          </div>
        </>
      ) : (
        <>
          <BackBar activeNavItem={activeNavItem} onClick={() => handleSetActiveNavItem("Selection")} />
          <div className="navbar-subsection sidebar-panel" key={`panel-${activeNavItem}`}>
            {currentSidebar}
          </div>
        </>
      )}
    </Navbar>
  );
}

function Navbar({ short, children }) {
  return (
    <nav className={short ? "navbar short" : "navbar"}>
      <ul>{children}</ul>
    </nav>
  );
}

function LogoBar() {
  return (
    <li className="logo-container">
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
        <SvgIcon svg={leftArrowSvg} />
      </button>
    </li>
  );
}
