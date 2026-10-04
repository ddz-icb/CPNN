import { useState, useEffect } from "react";
import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import eyeSvg from "../../../../assets/icons/eye.svg?raw";
import piechartSvg from "../../../../assets/icons/piechart.svg?raw";
import infoSvg from "../../../../assets/icons/info.svg?raw";
import { TooltipPopup } from "../reusable_components/tooltipComponents.jsx";
import { HeaderbarColorMapping } from "./headerbarMapping.jsx";
import { HeaderbarStatistics } from "./headerbarStatistics.jsx";
import { isTypingTarget, isPopupOpen } from "../hooks/keyboardUtils.js";
import { useTooltipSettings } from "../../state/tooltipState.js";

export function HeaderBar() {
  const [activePanel, setActivePanel] = useState(null);
  const { tooltipSettings, setTooltipSettings } = useTooltipSettings();
  const isMappingActive = activePanel === "mapping";
  const isStatisticsActive = activePanel === "statistics";
  const isNodeDetailsActive = tooltipSettings.isClickTooltipActive;
  const mappingPanelId = "headerbar-colormapping-panel";
  const statisticsPanelId = "headerbar-statistics-panel";

  const togglePanel = (panel) => {
    if (activePanel === panel) {
      setActivePanel(null);
      return;
    }
    if (isNodeDetailsActive) setTooltipSettings("isClickTooltipActive", false);
    setActivePanel(panel);
  };

  useEffect(() => {
    if (isNodeDetailsActive) setActivePanel(null);
  }, [isNodeDetailsActive]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key?.toLowerCase();
      if (key === "m" || key === "i") {
        if (isTypingTarget(document.activeElement) || isPopupOpen()) return;
        e.preventDefault();
        const panel = key === "m" ? "mapping" : "statistics";
        if (isNodeDetailsActive) setTooltipSettings("isClickTooltipActive", false);
        setActivePanel((current) => (current === panel ? null : panel));
        return;
      }

      if (e.key === "Escape" && activePanel) {
        setActivePanel(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePanel, isNodeDetailsActive, setTooltipSettings]);

  const panelNavigation = (
    <nav className="right-panel-tabs" aria-label="Insights views">
      <button
        type="button"
        className={`right-panel-tab${isMappingActive ? " right-panel-tab--active" : ""}`}
        onClick={() => togglePanel("mapping")}
        aria-label="Mapping"
        aria-current={isMappingActive ? "page" : undefined}
      >
        <span className="right-panel-tab-icon"><SvgIcon svg={eyeSvg} /></span>
        <span>Mapping</span>
        <kbd className="nav-shortcut">M</kbd>
      </button>
      <button
        type="button"
        className={`right-panel-tab${isStatisticsActive ? " right-panel-tab--active" : ""}`}
        onClick={() => togglePanel("statistics")}
        aria-label="Statistics"
        aria-current={isStatisticsActive ? "page" : undefined}
      >
        <span className="right-panel-tab-icon"><SvgIcon svg={piechartSvg} /></span>
        <span>Statistics</span>
        <kbd className="nav-shortcut">I</kbd>
      </button>
    </nav>
  );

  return (
    <>
      {!activePanel && !isNodeDetailsActive && (
        <div className="sidebar-dock insights-dock">
          <button
            className="icon-button sidebar-dock-button"
            type="button"
            onClick={() => setActivePanel("mapping")}
            aria-label="Open insights sidebar"
            aria-expanded="false"
          >
            <SvgIcon svg={infoSvg} />
          </button>
          <span className="sidebar-dock-label">Info</span>
        </div>
      )}
      {isMappingActive && (
        <TooltipPopup
          id={mappingPanelId}
          className="headerbar-side-panel"
          heading="Color mapping"
          close={() => setActivePanel(null)}
          contentKey="mapping"
          role="region"
          ariaLabel="Color mapping"
          navigation={panelNavigation}
        >
          <HeaderbarColorMapping />
        </TooltipPopup>
      )}
      {isStatisticsActive && (
        <TooltipPopup
          id={statisticsPanelId}
          className="headerbar-side-panel"
          heading="Graph statistics"
          close={() => setActivePanel(null)}
          contentKey="statistics"
          role="region"
          ariaLabel="Graph statistics"
          navigation={panelNavigation}
        >
          <HeaderbarStatistics />
        </TooltipPopup>
      )}
    </>
  );
}
