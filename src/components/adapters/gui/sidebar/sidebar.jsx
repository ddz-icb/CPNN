import { useCallback, useMemo, useState } from "react";
import { useSidebarKeyboard } from "../hooks/useSidebarKeyboard.js";
import { useAddKeyframe } from "../hooks/useAddKeyframe.js";
import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import { ResizableSidebar } from "../reusable_components/resizableSidebar.jsx";
import { SidebarEdgeTab } from "../reusable_components/sidebarEdgeTab.jsx";
import leftArrowSvg from "../../../../assets/icons/leftArrow.svg?raw";
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
import { AboutSidebar } from "./aboutSidebar.jsx";

export function Sidebar({ collapsed = false, onCollapsedChange, ...props }) {
  const [activeNavItem, setActiveNavItem] = useState("Selection");
  const [lastNavItem, setLastNavItem] = useState("Data");
  const { addKeyframe } = useAddKeyframe();

  const handleSetActiveNavItem = useCallback(
    (item) => {
      if (item === "Selection" && activeNavItem === "Selection" && !collapsed) {
        onCollapsedChange?.(true);
        return;
      }

      setActiveNavItem(item);
      if (item && item !== "Selection") {
        setLastNavItem(item);
        onCollapsedChange?.(false);
      }
    },
    [activeNavItem, collapsed, onCollapsedChange],
  );

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
    "Additional Data": <AdditionalDataSidebar />,
    Search: <SearchSidebar />,
    Filter: <FilterSidebar />,
    Communities: <CommunitySidebar />,
    Physics: <PhysicsSidebar />,
    Appearance: <AppearanceSidebar {...props} />,
    Videography: <VideographySidebar />,
    Export: <ExportSidebar />,
    "Cite & Imprint": <AboutSidebar />,
  };

  const currentSidebar = sidebarComponents[activeNavItem];
  const isSelection = activeNavItem === "Selection";
  const dockLabel = isSelection ? "Menu" : activeNavItem;
  return (
    <>
      {collapsed && (
        <SidebarEdgeTab
          side="left"
          label={`Open ${dockLabel} sidebar`}
          description={dockLabel}
          controls="app-sidebar"
          onClick={openSidebar}
        />
      )}
      {!collapsed && <button className="sidebar-scrim" type="button" aria-label="Collapse sidebar" onClick={collapseSidebar} />}
      {!collapsed && (
        <Navbar key={isSelection ? "selection" : "tool"} short={isSelection} onCollapse={collapseSidebar}>
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

function Navbar({ short, onCollapse, children }) {
  return (
    <ResizableSidebar
      as="nav"
      side="left"
      storageKey={short ? null : "cpnn.leftSidebarWidth"}
      cssVariable="--left-sidebar-width"
      defaultWidth={short ? 15 : 27}
      minWidth={short ? 15 : 22.5}
      allowGrowth={!short}
      onCollapse={onCollapse}
      id="app-sidebar"
      className={short ? "navbar short" : "navbar"}
      aria-label="Application tools"
    >
      <ul>{children}</ul>
    </ResizableSidebar>
  );
}

function LogoBar({ onCollapse }) {
  return (
    <li className="logo-container">
      <img src="./logos/ddz_logo_en.png" className="logo" />
      <button className="sidebar-collapse-button sidebar-panel-header-button" onClick={onCollapse} type="button" aria-label="Collapse sidebar">
        <SvgIcon svg={xSvg} />
      </button>
    </li>
  );
}

function BackBar({ activeNavItem, onBack, onCollapse }) {
  return (
    <li className="back-overlay sidebar-panel-header">
      <button className="back-close back-close--leading sidebar-panel-header-button" onClick={onBack} type="button" aria-label="Back to tool list">
        <SvgIcon svg={leftArrowSvg} />
      </button>
      <p className="back-text sidebar-panel-heading link-text">{activeNavItem}</p>
      <button className="back-close sidebar-panel-header-button" onClick={onCollapse} type="button" aria-label="Collapse sidebar">
        <SvgIcon svg={xSvg} />
      </button>
    </li>
  );
}
