import { useState, useEffect } from "react";
import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import eyeSvg from "../../../../assets/icons/eye.svg?raw";
import piechartSvg from "../../../../assets/icons/piechart.svg?raw";
import xSvg from "../../../../assets/icons/x.svg?raw";
import { HeaderButton } from "../reusable_components/headerbarComponents.js";
import { HeaderbarColorMapping } from "./headerbarMapping.js";
import { HeaderbarStatistics } from "./headerbarStatistics.js";
import { isTypingTarget, isPopupOpen } from "../hooks/keyboardUtils.js";

export function HeaderBar() {
  const [activePanel, setActivePanel] = useState(null);
  const isMappingActive = activePanel === "mapping";
  const isStatisticsActive = activePanel === "statistics";
  const mappingPanelId = "headerbar-colormapping-panel";
  const statisticsPanelId = "headerbar-statistics-panel";

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key?.toLowerCase();
      if (key === "m" || key === "i") {
        if (isTypingTarget(document.activeElement) || isPopupOpen()) return;
        e.preventDefault();
        const panel = key === "m" ? "mapping" : "statistics";
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
  }, [activePanel]);

  return (
    <div className="headerbar-overlay">
      <div className="headerbar-actions">
        <HeaderButton
          onClick={() => setActivePanel(isMappingActive ? null : "mapping")}
          icon={isMappingActive ? <SvgIcon svg={xSvg} /> : <SvgIcon svg={eyeSvg} />}
          tooltip={isMappingActive ? "Hide Mapping" : "View Mapping"}
          tooltipId={isMappingActive ? "close-colormapping-tooltip" : "open-colormapping-tooltip"}
          shortcut="M"
          aria-controls={mappingPanelId}
          aria-expanded={isMappingActive}
        />
        <HeaderButton
          onClick={() => setActivePanel(isStatisticsActive ? null : "statistics")}
          icon={isStatisticsActive ? <SvgIcon svg={xSvg} /> : <SvgIcon svg={piechartSvg} />}
          tooltip={isStatisticsActive ? "Hide Statistics" : "View Statistics"}
          tooltipId={isStatisticsActive ? "close-statistics-tooltip" : "open-statistics-tooltip"}
          shortcut="I"
          aria-controls={statisticsPanelId}
          aria-expanded={isStatisticsActive}
        />
      </div>
      {isMappingActive && (
        <div id={mappingPanelId} role="region" aria-label="Color mapping">
          <HeaderbarColorMapping />
        </div>
      )}
      {isStatisticsActive && (
        <div id={statisticsPanelId} role="region" aria-label="Graph statistics">
          <HeaderbarStatistics />
        </div>
      )}
    </div>
  );
}
