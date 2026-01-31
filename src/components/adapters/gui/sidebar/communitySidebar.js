import { FieldApplyBlock, FieldBlock, TableList } from "../reusable_components/sidebarComponents.js";
import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import eyeSvg from "../../../../assets/icons/eye.svg?raw";
import backArrowSvg from "../../../../assets/icons/backArrow.svg?raw";
import microscopeSvg from "../../../../assets/icons/microscope.svg?raw";

import { useFilter, communityResolutionInit, communityDensityInit } from "../../state/filterState.js";
import { useCommunityState } from "../../state/communityState.js";
import { useGraphState } from "../../state/graphState.js";
import { useAppearance } from "../../state/appearanceState.js";
import { useRenderState } from "../../state/canvasState.js";
import { useContainer } from "../../state/containerState.js";
import { getCentroid } from "../../../domain/service/graph_calculations/graphUtils.js";
import { centerOnNode } from "../../../domain/service/canvas_interaction/centerView.js";
import { getCommunityIdsOutsideSizeRange } from "../../../domain/service/graph_calculations/communityGrouping.js";
import { communityDensityDescription, communityFilterSizeDescription } from "./descriptions/filterDescriptions.js";

const VisibilityIcon = ({ item, ...props }) => <SvgIcon svg={eyeSvg} className={item?.isHidden ? "icon-muted" : ""} {...props} />;

export function CommunitySidebar() {
  const { filter, setFilter } = useFilter();
  const { communityState, setCommunityState } = useCommunityState();
  const { graphState } = useGraphState();
  const { appearance } = useAppearance();
  const { renderState } = useRenderState();
  const { container } = useContainer();

  const filterSizeIds = getCommunityIdsOutsideSizeRange(communityState.groups, filter.communityFilterMinSize, filter.communityFilterMaxSize);
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

  const handleApplyFilterMinSize = () => {
    const minSize = parseMinSize(filter.communityFilterMinSizeText);
    setFilter("communityFilterMinSize", minSize);
    setFilter("communityFilterMinSizeText", minSize.toString());
  };

  const handleApplyFilterMaxSize = () => {
    const maxSize = parseMaxSize(filter.communityFilterMaxSizeText);
    if (maxSize === null) {
      setFilter("communityFilterMaxSize", "");
      setFilter("communityFilterMaxSizeText", "");
      return;
    }
    setFilter("communityFilterMaxSize", maxSize);
    setFilter("communityFilterMaxSizeText", maxSize.toString());
  };

  const isGroupIsolated = (groupId) => {
    if (!groupId) return false;
    const allIds = rows.map((group) => group.id?.toString()).filter(Boolean);
    const currentHidden = new Set((filter.communityHiddenIds ?? []).map((id) => id?.toString()));
    const unhiddenIds = allIds.filter((id) => !currentHidden.has(id));
    return unhiddenIds.length === 1 && unhiddenIds[0] === groupId;
  };

  const IsolateIcon = ({ item, ...props }) => <SvgIcon svg={isGroupIsolated(item?.id?.toString()) ? backArrowSvg : microscopeSvg} {...props} />;

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
      <FieldBlock
        valueText={filter.communityResolutionText}
        setValue={handleResolutionChange}
        setValueText={handleResolutionTextChange}
        fallbackValue={communityResolutionInit}
        min={0}
        step={0.1}
        text={"Community Resolution"}
        infoHeading={"Community Resolution"}
        infoDescription={"Higher values yield smaller communities. A resolution of 0 captures connected components."}
      />
      <div className="table-list-heading">Community Filters</div>
      <FieldBlock
        valueText={filter.communityDensityText}
        setValue={(value) => setFilter("communityDensity", value)}
        setValueText={(value) => setFilter("communityDensityText", value)}
        fallbackValue={communityDensityInit}
        min={0}
        step={1}
        text={"Community Density"}
        infoHeading={"Filter by Community Density"}
        infoDescription={communityDensityDescription}
      />
      <FieldApplyBlock
        valueText={filter.communityFilterMinSizeText}
        setValueText={(value) => setFilter("communityFilterMinSizeText", value)}
        onApply={handleApplyFilterMinSize}
        min={0}
        step={1}
        text={"Min Community Size"}
        infoHeading={"Filter communities by size"}
        infoDescription={communityFilterSizeDescription}
      />
      <FieldApplyBlock
        valueText={filter.communityFilterMaxSizeText}
        setValueText={(value) => setFilter("communityFilterMaxSizeText", value)}
        onApply={handleApplyFilterMaxSize}
        min={0}
        step={1}
        text={"Max Community Size"}
        infoHeading={"Filter communities by size"}
        infoDescription={communityFilterSizeDescription}
      />
      <div className="table-list-heading">Community Physics</div>
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
        actionIcon2TooltipContent={(item) => (isGroupIsolated(item?.id?.toString()) ? "Revert (show all communities)" : "Show only this community")}
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

function parseMinSize(valueText) {
  if (valueText === "" || valueText === null || valueText === undefined) return 0;
  const parsed = Number(valueText);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

function parseMaxSize(valueText) {
  if (valueText === "" || valueText === null || valueText === undefined) return null;
  const parsed = Number(valueText);
  if (!Number.isFinite(parsed)) return null;
  if (parsed <= 0) return null;
  return Math.floor(parsed);
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
