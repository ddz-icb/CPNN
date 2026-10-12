import { useEffect, useCallback } from "react";
import { RightSidebar } from "../reusable_components/rightSidebar.jsx";
import { SidebarEdgeTab } from "../reusable_components/sidebarEdgeTab.jsx";
import { HeaderbarColorMapping } from "./headerbarMapping.jsx";
import { HeaderbarStatistics } from "./headerbarStatistics.jsx";
import { isTypingTarget, isPopupOpen } from "../hooks/keyboardUtils.js";
import { useTooltipSettings } from "../../state/tooltipState.js";
import { useCommunityState } from "../../state/communityState.js";
import { useAppearance } from "../../state/appearanceState.js";
import { clearViewOrbitCenter } from "../../../domain/service/canvas_interaction/centerView.js";
import { CommunityDetails } from "../reusable_components/communityDetails.jsx";
import { RightPanelNavigation } from "../reusable_components/rightPanelNavigation.jsx";

export function HeaderBar({ activePanel, setActivePanel }) {
  const { tooltipSettings, setTooltipSettings } = useTooltipSettings();
  const { communityState, setCommunityState } = useCommunityState();
  const { appearance } = useAppearance();
  const isMappingActive = activePanel === "mapping";
  const isStatisticsActive = activePanel === "statistics";
  const isNodeDetailsActive = tooltipSettings.isClickTooltipActive;
  const hasNodeDetails = Boolean(tooltipSettings.clickTooltipData?.node);
  const selectedCommunity = communityState.communities.find(
    ({ id }) => id?.toString() === communityState.selectedCommunityId?.toString(),
  );
  const isCommunityActive = Boolean(selectedCommunity);
  const mappingPanelId = "headerbar-colormapping-panel";
  const statisticsPanelId = "headerbar-statistics-panel";

  const selectPanel = useCallback((panel) => {
    if (panel === "node") {
      if (!hasNodeDetails) return;
      if (!activePanel) setActivePanel("mapping");
      if (isCommunityActive) setCommunityState("selectedCommunityId", null);
      setTooltipSettings("isClickTooltipActive", true);
      return;
    }
    if (isNodeDetailsActive) setTooltipSettings("isClickTooltipActive", false);
    if (isCommunityActive) setCommunityState("selectedCommunityId", null);
    setActivePanel(panel);
  }, [activePanel, hasNodeDetails, isCommunityActive, isNodeDetailsActive, setActivePanel, setCommunityState, setTooltipSettings]);

  const closeCommunityPanel = useCallback(() => {
    setCommunityState("selectedCommunityId", null);
    clearViewOrbitCenter({ appearance });
  }, [appearance, setCommunityState]);

  useEffect(() => {
    if (!isNodeDetailsActive) return;
    if (!activePanel) setActivePanel("mapping");
    if (communityState.selectedCommunityId != null) setCommunityState("selectedCommunityId", null);
  }, [activePanel, communityState.selectedCommunityId, isNodeDetailsActive, setActivePanel, setCommunityState]);

  useEffect(() => {
    if (isCommunityActive) setActivePanel(null);
  }, [isCommunityActive, setActivePanel]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key?.toLowerCase();
      if (key === "m" || key === "i" || key === "n") {
        if (isTypingTarget(document.activeElement) || isPopupOpen()) return;
        if (key === "n" && !hasNodeDetails) return;
        e.preventDefault();
        const panel = key === "m" ? "mapping" : key === "i" ? "statistics" : "node";
        const isCurrentPanel = panel === "node" ? isNodeDetailsActive : activePanel === panel;
        if (isCurrentPanel) {
          if (panel === "node") {
            setTooltipSettings("isClickTooltipActive", false);
            setActivePanel(null);
          } else {
            setActivePanel(null);
          }
        } else {
          selectPanel(panel);
        }
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
  }, [activePanel, closeCommunityPanel, hasNodeDetails, isCommunityActive, isNodeDetailsActive, selectPanel, setActivePanel, setTooltipSettings]);

  const panelNavigation = (
    <RightPanelNavigation
      activeView={activePanel}
      nodeAvailable={hasNodeDetails}
      onSelect={selectPanel}
    />
  );

  return (
    <>
      {!activePanel && !isNodeDetailsActive && !isCommunityActive && (
        <SidebarEdgeTab
          side="right"
          label="Open insights sidebar"
          description="Insights"
          controls={mappingPanelId}
          onClick={() => selectPanel("mapping")}
        />
      )}
      {!isNodeDetailsActive && (isMappingActive || isStatisticsActive) && (
        <RightSidebar
          id={isMappingActive ? mappingPanelId : statisticsPanelId}
          className="headerbar-side-panel"
          heading={isMappingActive ? "Color mapping" : "Graph statistics"}
          close={() => setActivePanel(null)}
          contentKey={activePanel}
          role="region"
          ariaLabel={isMappingActive ? "Color mapping" : "Graph statistics"}
          navigation={panelNavigation}
        >
          {isMappingActive ? <HeaderbarColorMapping /> : <HeaderbarStatistics />}
        </RightSidebar>
      )}
      {isCommunityActive && !isNodeDetailsActive && (
        <RightSidebar
          id="community-details-panel"
          className="community-side-panel"
          heading={selectedCommunity.label}
          close={closeCommunityPanel}
          contentKey={selectedCommunity.id}
          role="region"
          ariaLabel={`${selectedCommunity.label} details`}
        >
          <CommunityDetails community={selectedCommunity} showHeading={false} />
        </RightSidebar>
      )}
    </>
  );
}
