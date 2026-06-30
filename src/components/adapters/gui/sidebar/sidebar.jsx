import { useCallback, useMemo, useState } from "react";
import { useSidebarKeyboard } from "../hooks/useSidebarKeyboard.js";
import { useAddKeyframe } from "../hooks/useAddKeyframe.js";
import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import leftArrowSvg from "../../../../assets/icons/leftArrow.svg?raw";
import listSvg from "../../../../assets/icons/list.svg?raw";
import xSvg from "../../../../assets/icons/x.svg?raw";

import { FilterSidebar } from "./filterSidebar.jsx";
import { AdditionalDataSidebar } from "./additionalDataSidebar.jsx";
import { PhysicsSidebar } from "./physicsSidebar.jsx";
import { DataSidebar } from "./dataSidebar.jsx";
import { SelectionSidebar } from "./selectionSidebar.jsx";
import { SearchSidebar } from "./searchSidebar.jsx";
import { AppearanceSidebar } from "./appearanceSidebar.jsx";
import { ExportSidebar } from "./exportSidebar.jsx";
import { CommunitySidebar } from "./communitySidebar.jsx";
import { VideographySidebar } from "./videographySidebar.jsx";

export function Sidebar({ collapsed = false, onCollapsedChange, ...props }) {
  const [activeNavItem, setActiveNavItem] = useState("Selection");
  const [lastNavItem, setLastNavItem] = useState("Data");
  const { addKeyframe } = useAddKeyframe();

  const handleSetActiveNavItem = useCallback((item) => {
    if (item === "Selection" && activeNavItem === "Selection" && !collapsed) {
      onCollapsedChange?.(true);
      return;
    }

    setActiveNavItem(item);
    if (item && item !== "Selection") {
      setLastNavItem(item);
      onCollapsedChange?.(false);
    }
  }, [activeNavItem, collapsed, onCollapsedChange]);

  const openSidebar = useCallback(() => {
    onCollapsedChange?.(false);
  }, [onCollapsedChange]);

  const collapseSidebar = useCallback(() => {
    onCollapsedChange?.(true);
  }, [onCollapsedChange]);

  const shortcutActions = useMemo(() => ({ k: addKeyframe }), [addKeyframe]);
  useSidebarKeyboard(handleSetActiveNavItem, shortcutActions);

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
  const dockLabel = isSelection ? "Menu" : activeNavItem;

  return (
    <>
      {collapsed && <SidebarDockTab label={dockLabel} onClick={openSidebar} />}
      {!collapsed && <button className="sidebar-scrim" type="button" aria-label="Collapse sidebar" onClick={collapseSidebar} />}
      {!collapsed && (
        <Navbar short={isSelection}>
          {isSelection ? (
            <>
              <LogoBar onCollapse={collapseSidebar} />
              <div className="navbar-main sidebar-panel" key="panel-selection">
                {currentSidebar}
              </div>
            </>
          ) : (
            <>
              <BackBar activeNavItem={activeNavItem} onBack={() => handleSetActiveNavItem("Selection")} onCollapse={collapseSidebar} />
              <div className="navbar-subsection sidebar-panel" key={`panel-${activeNavItem}`}>
                {currentSidebar}
              </div>
            </>
          )}
        </Navbar>
      )}
    </>
  );
}

function Navbar({ short, children }) {
  return (
    <nav id="app-sidebar" className={short ? "navbar short" : "navbar"} aria-label="Application tools">
      <ul>{children}</ul>
    </nav>
  );
}

function SidebarDockTab({ label, onClick }) {
  return (
    <div className="sidebar-dock">
      <button
        className="icon-button sidebar-dock-button"
        type="button"
        onClick={onClick}
        aria-label={`Open ${label} sidebar`}
        aria-controls="app-sidebar"
        aria-expanded="false"
      >
        <SvgIcon svg={listSvg} />
      </button>
      <span className="sidebar-dock-label">{label}</span>
    </div>
  );
}

function LogoBar({ onCollapse }) {
  return (
    <li className="logo-container">
      <img src="./logos/ddz_logo_en.png" className="logo" />
      <button className="sidebar-collapse-button" onClick={onCollapse} type="button" aria-label="Collapse sidebar">
        <SvgIcon svg={xSvg} />
      </button>
    </li>
  );
}

function BackBar({ activeNavItem, onBack, onCollapse }) {
  return (
    <li className="back-overlay">
      <button className="back-close back-close--leading" onClick={onBack} type="button" aria-label="Back to tool list">
        <SvgIcon svg={leftArrowSvg} />
      </button>
      <div className="back-text">
        <p className="link-text">{activeNavItem}</p>
      </div>
      <button className="back-close" onClick={onCollapse} type="button" aria-label="Collapse sidebar">
        <SvgIcon svg={xSvg} />
      </button>
    </li>
  );
}
