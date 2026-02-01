import { FieldBlock, SliderBlock, ToggleList } from "../reusable_components/sidebarComponents.js";
import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import eyeSvg from "../../../../assets/icons/eye.svg?raw";
import rotateArrowSvg from "../../../../assets/icons/rotateArrow.svg?raw";
import microscopeSvg from "../../../../assets/icons/microscope.svg?raw";

import { communityDensityInit, maxCommunitySizeInit, minCommunitySizeInit, useFilter } from "../../state/filterState.js";
import { communityResolutionInit, useCommunityState } from "../../state/communityState.js";
import { useGraphState } from "../../state/graphState.js";
import { useAppearance } from "../../state/appearanceState.js";
import { useRenderState } from "../../state/canvasState.js";
import { useContainer } from "../../state/containerState.js";
import { communityForceStrengthInit, usePhysics } from "../../state/physicsState.js";
import { getCentroid } from "../../../domain/service/graph_calculations/graphUtils.js";
import { centerOnNode } from "../../../domain/service/canvas_interaction/centerView.js";
import { communityForceStrengthDescription } from "./descriptions/physicsDescriptions.js";
import { communityFilterSizeDescription } from "./descriptions/filterDescriptions.js";

const VisibilityIcon = ({ item, ...props }) => <SvgIcon svg={eyeSvg} className={item?.isHidden ? "icon-muted" : ""} {...props} />;

export function CommunitySidebar() {
  const { filter, setFilter } = useFilter();
  const { communityState, setCommunityState } = useCommunityState();
  const { graphState } = useGraphState();
  const { appearance } = useAppearance();
  const { renderState } = useRenderState();
  const { container } = useContainer();
  const { physics, setPhysics } = usePhysics();

  const graphHiddenSet = new Set((filter.communityHiddenIds ?? []).map((id) => id?.toString()));
  const rows = communityState.communities.map((community) => {
    const isHidden = graphHiddenSet.has(community.id?.toString());
    return {
      ...community,
      primaryText: community.label,
      secondaryText: `${community.size} nodes`,
      isHidden,
    };
  });

  const handleToggleVisibility = (item) => {
    const communityId = item?.id?.toString();
    if (!communityId) return;

    const nextHidden = new Set(graphHiddenSet);
    if (nextHidden.has(communityId)) {
      nextHidden.delete(communityId);
    } else {
      nextHidden.add(communityId);
    }
    setFilter("communityHiddenIds", Array.from(nextHidden));
  };

  const isCommunityIsolated = (communityId) => {
    if (!communityId) return false;
    const allIds = rows.map((community) => community.id?.toString()).filter(Boolean);
    const currentHidden = new Set((filter.communityHiddenIds ?? []).map((id) => id?.toString()));
    const unhiddenIds = allIds.filter((id) => !currentHidden.has(id));
    return unhiddenIds.length === 1 && unhiddenIds[0] === communityId;
  };

  const IsolateIcon = ({ item, ...props }) => <SvgIcon svg={isCommunityIsolated(item?.id?.toString()) ? rotateArrowSvg : microscopeSvg} {...props} />;

  const handleIsolateCommunity = (item) => {
    const communityId = item?.id?.toString();
    if (!communityId) return;

    if (isCommunityIsolated(communityId)) {
      setFilter("communityHiddenIds", []);
      return;
    }

    const allIds = rows.map((community) => community.id?.toString()).filter(Boolean);
    const hiddenIds = allIds.filter((id) => id !== communityId);
    setFilter("communityHiddenIds", hiddenIds);
  };

  const handleFocusCommunity = (item) => {
    const communityId = item?.id?.toString();
    if (!communityId) return;
    const nextSelection = communityState.selectedCommunityId === communityId ? null : communityId;
    setCommunityState("selectedCommunityId", nextSelection);
    if (!nextSelection) return;

    const nodeIds = communityState.communityToNodeIds?.[communityId];
    if (!Array.isArray(nodeIds) || nodeIds.length === 0) return;

    const nodes = graphState.graph?.data?.nodes ?? [];
    if (nodes.length === 0) return;

    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const communityNodes = nodeIds.map((id) => nodeMap.get(id)).filter(Boolean);
    if (communityNodes.length === 0) return;

    const centroid = getCentroid(communityNodes);
    centerOnNode(centroid, { appearance, renderState, container });
  };

  return (
    <>
      <SliderBlock
        value={communityState.communityResolution}
        valueText={communityState.communityResolutionText}
        setValue={(value) => setCommunityState("communityResolution", value)}
        setValueText={(value) => setCommunityState("communityResolutionText", value)}
        fallbackValue={communityResolutionInit}
        min={0}
        max={5}
        step={0.5}
        text={"Community Resolution"}
        infoHeading={"Community Resolution"}
        infoDescription={"Higher values yield smaller communities. A resolution of 0 captures connected components."}
      />
      <div className="table-list-heading">Physics</div>
      <SliderBlock
        value={physics.communityForceStrength}
        valueText={physics.communityForceStrengthText}
        setValue={(value) => setPhysics("communityForceStrength", value)}
        setValueText={(value) => setPhysics("communityForceStrengthText", value)}
        fallbackValue={communityForceStrengthInit}
        min={0}
        max={10}
        step={0.1}
        text={"Community Force"}
        infoHeading={"Adjusting the Community Force Strength"}
        infoDescription={communityForceStrengthDescription}
      />
      <div className="table-list-heading">Filter</div>
      <FieldBlock
        valueText={filter.communityDensityText}
        setValue={(value) => setFilter("communityDensity", value)}
        setValueText={(value) => setFilter("communityDensityText", value)}
        fallbackValue={communityDensityInit}
        min={0}
        step={1}
        text={"Community Density"}
        infoHeading={"Community Density"}
        infoDescription={"aösdlkaslödkfj"}
      />
      <FieldBlock
        valueText={filter.minCommunitySizeText}
        setValue={(value) => setFilter("minCommunitySize", value)}
        setValueText={(value) => setFilter("minCommunitySizeText", value)}
        fallbackValue={minCommunitySizeInit}
        min={0}
        step={1}
        text={"Min Community Size"}
        infoHeading={"Filter communities by size"}
        infoDescription={communityFilterSizeDescription}
      />
      <FieldBlock
        valueText={filter.maxCommunitySizeText}
        setValue={(value) => setFilter("maxCommunitySize", value)}
        setValueText={(value) => setFilter("maxCommunitySizeText", value)}
        fallbackValue={maxCommunitySizeInit}
        min={1}
        step={1}
        text={"Max Community Size"}
        infoHeading={"Filter communities by size"}
        infoDescription={communityFilterSizeDescription}
      />
      <ToggleList
        heading={`Communities (${rows.length})`}
        data={rows}
        displayKey={"primaryText"}
        secondaryKey={"secondaryText"}
        expandedId={communityState.selectedCommunityId}
        getItemId={(community) => community?.id}
        onItemToggle={handleFocusCommunity}
        renderExpandedContent={(community) => (
          <div className="toggle-list-details">
            <DetailRow label={"Label"} value={community.label} />
            <DetailRow label={"Nodes"} value={community.size} />
            <DetailRow label={"Internal Links"} value={community.linkCount ?? 0} />
            <DetailRow label={"External Links"} value={community.externalLinkCount ?? 0} />
            <DetailRow label={"Community Density"} value={formatDensity(community.density)} />
            <DetailRow label={"Top pathways"} value={formatTopAttributes(community.topAttributes) || "None"} />
            <DetailRow label={"Top link attributes"} value={formatTopAttributes(community.topLinkAttributes) || "None"} />
          </div>
        )}
        ActionIcon={VisibilityIcon}
        onActionIconClick={handleToggleVisibility}
        actionIconTooltipContent={(item) => (item?.isHidden ? "Show community" : "Hide community")}
        ActionIcon2={IsolateIcon}
        onActionIcon2Click={handleIsolateCommunity}
        actionIcon2TooltipContent={(item) => (isCommunityIsolated(item?.id?.toString()) ? "Revert" : "Show only this community")}
      />
    </>
  );
}

function formatTopAttributes(topAttributes) {
  if (!Array.isArray(topAttributes) || topAttributes.length === 0) return "";
  return topAttributes.map((entry) => `${entry.name} (${entry.count})`).join(", ");
}

function formatDensity(value) {
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(2);
}

function DetailRow({ label, value }) {
  return (
    <div className="toggle-list-detail-row">
      <span className="item-table-primary-text">{label}</span>
      <span className="text-secondary toggle-list-detail-value">{value}</span>
    </div>
  );
}
