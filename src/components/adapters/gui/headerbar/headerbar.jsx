import { useState, useEffect, useCallback } from "react";
import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import eyeSvg from "../../../../assets/icons/eye.svg?raw";
import piechartSvg from "../../../../assets/icons/piechart.svg?raw";
import infoSvg from "../../../../assets/icons/info.svg?raw";
import { TooltipPopup } from "../reusable_components/tooltipComponents.jsx";
import { HeaderbarColorMapping } from "./headerbarMapping.jsx";
import { HeaderbarStatistics } from "./headerbarStatistics.jsx";
import { isTypingTarget, isPopupOpen } from "../hooks/keyboardUtils.js";
import { useTooltipSettings } from "../../state/tooltipState.js";
import { useCommunityState } from "../../state/communityState.js";
import { useAppearance } from "../../state/appearanceState.js";
import { clearViewOrbitCenter } from "../../../domain/service/canvas_interaction/centerView.js";
import { CommunityDetails } from "../reusable_components/communityDetails.jsx";

export function HeaderBar() {
  const [activePanel, setActivePanel] = useState(null);
  const { tooltipSettings, setTooltipSettings } = useTooltipSettings();
  const { communityState, setCommunityState } = useCommunityState();
  const { appearance } = useAppearance();
  const isMappingActive = activePanel === "mapping";
  const isStatisticsActive = activePanel === "statistics";
  const isNodeDetailsActive = tooltipSettings.isClickTooltipActive;
  const selectedCommunity = communityState.communities.find(
    ({ id }) => id?.toString() === communityState.selectedCommunityId?.toString(),
  );
  const isCommunityActive = Boolean(selectedCommunity);
  const mappingPanelId = "headerbar-colormapping-panel";
  const statisticsPanelId = "headerbar-statistics-panel";

  const togglePanel = (panel) => {
    if (activePanel === panel) {
      setActivePanel(null);
      return;
    }
    if (isNodeDetailsActive) setTooltipSettings("isClickTooltipActive", false);
    if (isCommunityActive) setCommunityState("selectedCommunityId", null);
    setActivePanel(panel);
  };

  const closeCommunityPanel = useCallback(() => {
    setCommunityState("selectedCommunityId", null);
    clearViewOrbitCenter({ appearance });
  }, [appearance, setCommunityState]);

  useEffect(() => {
    if (!isNodeDetailsActive) return;
    setActivePanel(null);
    if (communityState.selectedCommunityId != null) setCommunityState("selectedCommunityId", null);
  }, [communityState.selectedCommunityId, isNodeDetailsActive, setCommunityState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key?.toLowerCase();
      if (key === "m" || key === "i") {
        if (isTypingTarget(document.activeElement) || isPopupOpen()) return;
        e.preventDefault();
        const panel = key === "m" ? "mapping" : "statistics";
        if (isNodeDetailsActive) setTooltipSettings("isClickTooltipActive", false);
        if (isCommunityActive) setCommunityState("selectedCommunityId", null);
        setActivePanel((current) => (current === panel ? null : panel));
        return;
      }

      if (e.key === "Escape") {
        if (activePanel) setActivePanel(null);
        if (isCommunityActive) closeCommunityPanel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePanel, closeCommunityPanel, isCommunityActive, isNodeDetailsActive, setCommunityState, setTooltipSettings]);

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
      {!activePanel && !isNodeDetailsActive && !isCommunityActive && (
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
      {isCommunityActive && !isNodeDetailsActive && (
        <TooltipPopup
          id="community-details-panel"
          className="community-side-panel"
          heading={selectedCommunity.label}
          close={closeCommunityPanel}
          contentKey={selectedCommunity.id}
          role="region"
          ariaLabel={`${selectedCommunity.label} details`}
        >
          <CommunityDetails community={selectedCommunity} showHeading={false} />
        </TooltipPopup>
      )}
    </>
  );
}
