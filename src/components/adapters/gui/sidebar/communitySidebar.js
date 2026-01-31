import { FieldBlock, SliderBlock, TableList } from "../reusable_components/sidebarComponents.js";
import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import eyeSvg from "../../../../assets/icons/eye.svg?raw";
import rotateArrowSvg from "../../../../assets/icons/rotateArrow.svg?raw";
import microscopeSvg from "../../../../assets/icons/microscope.svg?raw";

import {
  useFilter,
  communityResolutionInit,
  communityDensityInit,
  communityMinSizeInit,
  communityMaxSizeInit,
} from "../../state/filterState.js";
import { communityForceStrengthInit, usePhysics } from "../../state/physicsState.js";
import { useCommunityState } from "../../state/communityState.js";
import { useGraphState } from "../../state/graphState.js";
import { useAppearance } from "../../state/appearanceState.js";
import { useRenderState } from "../../state/canvasState.js";
import { useContainer } from "../../state/containerState.js";
import { getCentroid } from "../../../domain/service/graph_calculations/graphUtils.js";
import { centerOnNode } from "../../../domain/service/canvas_interaction/centerView.js";
import { getCommunityIdsOutsideSizeRange } from "../../../domain/service/graph_calculations/communityGrouping.js";
import { communityDensityDescription, communityFilterSizeDescription } from "./descriptions/filterDescriptions.js";
import { communityForceStrengthDescription } from "./descriptions/physicsDescriptions.js";

const VisibilityIcon = ({ item, ...props }) => <SvgIcon svg={eyeSvg} className={item?.isHidden ? "icon-muted" : ""} {...props} />;

export function CommunitySidebar() {
  const { filter, setFilter } = useFilter();
  const { physics, setPhysics } = usePhysics();
  const { communityState, setCommunityState } = useCommunityState();
  const { graphState } = useGraphState();
  const { appearance } = useAppearance();
  const { renderState } = useRenderState();
  const { container } = useContainer();

  const filterSizeIds = getCommunityIdsOutsideSizeRange(communityState.groups, filter.communityMinSize, filter.communityMaxSize);
  const filterSizeSet = new Set(filterSizeIds.map((id) => id?.toString()));
  const visibleGroups = (communityState.groups ?? []).filter((group) => !filterSizeSet.has(group?.id?.toString()));
  const graphHiddenSet = new Set((filter.communityHiddenIds ?? []).map((id) => id?.toString()));
  const rows = visibleGroups.map((group) => {
    const isHidden = graphHiddenSet.has(group.id?.toString());
    return {
      ...group,
      primaryText: group.label,
      secondaryText: `${group.size} nodes`,
      isHidden,
    };
  });

  const selectedGroup = visibleGroups.find((group) => group.id === communityState.selectedGroupId);

  const handleResolutionChange = (value) => {
    if (value === filter.communityResolution) return;
    setFilter("communityResolution", value);
    setFilter("communityComputeKey", filter.communityComputeKey + 1);
  };

  const handleResolutionTextChange = (value) => {
    setFilter("communityResolutionText", value);
  };

  const handleToggleVisibility = (item) => {
    const groupId = item?.id?.toString();
    if (!groupId) return;

    const nextHidden = new Set(graphHiddenSet);
    if (nextHidden.has(groupId)) {
      nextHidden.delete(groupId);
    } else {
      nextHidden.add(groupId);
    }
    setFilter("communityHiddenIds", Array.from(nextHidden));
  };

  const isGroupIsolated = (groupId) => {
    if (!groupId) return false;
    const allIds = rows.map((group) => group.id?.toString()).filter(Boolean);
    const currentHidden = new Set((filter.communityHiddenIds ?? []).map((id) => id?.toString()));
    const unhiddenIds = allIds.filter((id) => !currentHidden.has(id));
    return unhiddenIds.length === 1 && unhiddenIds[0] === groupId;
  };

  const IsolateIcon = ({ item, ...props }) => <SvgIcon svg={isGroupIsolated(item?.id?.toString()) ? rotateArrowSvg : microscopeSvg} {...props} />;

  const handleIsolateGroup = (item) => {
    const groupId = item?.id?.toString();
    if (!groupId) return;

    if (isGroupIsolated(groupId)) {
      setFilter("communityHiddenIds", []);
      return;
    }

    const allIds = rows.map((group) => group.id?.toString()).filter(Boolean);
    const hiddenIds = allIds.filter((id) => id !== groupId);
    setFilter("communityHiddenIds", hiddenIds);
  };

  const handleFocusGroup = (item) => {
    const groupId = item?.id?.toString();
    if (!groupId) return;
    const nextSelection = communityState.selectedGroupId === groupId ? null : groupId;
    setCommunityState("selectedGroupId", nextSelection);
    if (!nextSelection) return;

    const nodeIds = communityState.groupToNodeIds?.[groupId];
    if (!Array.isArray(nodeIds) || nodeIds.length === 0) return;

    const nodes = graphState.graph?.data?.nodes ?? [];
    if (nodes.length === 0) return;

    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const groupNodes = nodeIds.map((id) => nodeMap.get(id)).filter(Boolean);
    if (groupNodes.length === 0) return;

    const centroid = getCentroid(groupNodes);
    centerOnNode(centroid, { appearance, renderState, container });
  };

  return (
    <>
      <SliderBlock
        value={filter.communityResolution}
        valueText={filter.communityResolutionText}
        setValue={handleResolutionChange}
        setValueText={handleResolutionTextChange}
        fallbackValue={communityResolutionInit}
        min={0}
        max={10}
        step={1}
        text={"Community Resolution"}
        infoHeading={"Community Resolution"}
        infoDescription={"Higher values yield smaller communities. A resolution of 0 captures connected components."}
      />
      <div className="table-list-heading">Community Physics</div>
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
      <div className="table-list-heading">Community Filters</div>
      <FieldBlock
        valueText={filter.communityDensityText}
        setValue={(value) => setFilter("communityDensity", value)}
        setValueText={(value) => setFilter("communityDensityText", value)}
        fallbackValue={communityDensityInit}
        min={0}
        step={1}
        text={"Min Community Density"}
        infoHeading={"Filter by Community Density"}
        infoDescription={communityDensityDescription}
      />
      <FieldBlock
        valueText={filter.communityMinSizeText}
        setValue={(value) => setFilter("communityMinSize", value)}
        setValueText={(value) => setFilter("communityMinSizeText", value)}
        fallbackValue={communityMinSizeInit}
        min={0}
        step={1}
        text={"Min Community Size"}
        infoHeading={"Filter communities by size"}
        infoDescription={communityFilterSizeDescription}
      />
      <FieldBlock
        valueText={filter.communityMaxSizeText}
        setValue={(value) => setFilter("communityMaxSize", value)}
        setValueText={(value) => setFilter("communityMaxSizeText", value)}
        fallbackValue={communityMaxSizeInit}
        min={0}
        step={1}
        text={"Max Community Size"}
        infoHeading={"Filter communities by size"}
        infoDescription={communityFilterSizeDescription}
      />
      <TableList
        heading={`Communities (${rows.length})`}
        data={rows}
        displayKey={"primaryText"}
        secondaryKey={"secondaryText"}
        onItemClick={handleFocusGroup}
        ActionIcon={VisibilityIcon}
        onActionIconClick={handleToggleVisibility}
        actionIconTooltipContent={(item) => (item?.isHidden ? "Show community" : "Hide community")}
        ActionIcon2={IsolateIcon}
        onActionIcon2Click={handleIsolateGroup}
        actionIcon2TooltipContent={(item) => (isGroupIsolated(item?.id?.toString()) ? "Revert" : "Show only this community")}
      />
      {selectedGroup && (
        <div className="block-section block-section-stack">
          <div className="table-list-heading">Community Details</div>
          <table className="item-table plain-item-table">
            <tbody>
              <DetailRow label={"Label"} value={selectedGroup.label} />
              <DetailRow label={"Community ID"} value={selectedGroup.id} />
              <DetailRow label={"Nodes"} value={selectedGroup.size} />
              <DetailRow label={"Links (internal)"} value={selectedGroup.linkCount ?? 0} />
              <DetailRow label={"Top pathways"} value={formatTopAttributes(selectedGroup.topAttributes) || "None"} />
              <DetailRow label={"Top link attributes"} value={formatTopAttributes(selectedGroup.topLinkAttributes) || "None"} />
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function formatTopAttributes(topAttributes) {
  if (!Array.isArray(topAttributes) || topAttributes.length === 0) return "";
  return topAttributes.map((entry) => `${entry.name} (${entry.count})`).join(", ");
}

function DetailRow({ label, value }) {
  return (
    <tr>
      <td className="item-table-primary-text">{label}</td>
      <td className="text-secondary" style={{ textAlign: "right" }}>
        {value}
      </td>
    </tr>
  );
}
