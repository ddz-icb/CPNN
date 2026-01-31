import { Button, FieldBlock, SwitchBlock, TableList } from "../reusable_components/sidebarComponents.js";
import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import eyeSvg from "../../../../assets/icons/eye.svg?raw";
import circleCheckSvg from "../../../../assets/icons/circleCheck.svg?raw";

import { useFilter, communityResolutionInit } from "../../state/filterState.js";
import { useCommunityState, communityStateInit } from "../../state/communityState.js";
import { useGraphState } from "../../state/graphState.js";
import { useAppearance } from "../../state/appearanceState.js";
import { useRenderState } from "../../state/canvasState.js";
import { useContainer } from "../../state/containerState.js";
import { isCommunityMode } from "../../../domain/service/graph_calculations/communityGrouping.js";
import { getCentroid } from "../../../domain/service/graph_calculations/graphUtils.js";
import { centerOnNode } from "../../../domain/service/canvas_interaction/centerView.js";

const VisibilityIcon = ({ item, ...props }) => (
  <SvgIcon svg={eyeSvg} className={item?.isHidden ? "icon-muted" : ""} {...props} />
);
const IsolateIcon = (props) => <SvgIcon svg={circleCheckSvg} {...props} />;

export function CommunitySidebar() {
  const { filter, setFilter } = useFilter();
  const { communityState, setCommunityState, setAllCommunityState } = useCommunityState();
  const { graphState } = useGraphState();
  const { appearance } = useAppearance();
  const { renderState } = useRenderState();
  const { container } = useContainer();

  const isCommunity = isCommunityMode(filter.communityMode);
  const hiddenSet = new Set((filter.communityHiddenIds ?? []).map((id) => id?.toString()));

  const rows = (communityState.groups ?? []).map((group) => {
    return {
      ...group,
      primaryText: group.label,
      secondaryText: `${group.size} nodes`,
      isHidden: hiddenSet.has(group.id),
    };
  });

  const hasGroups = rows.length > 0;
  const selectedGroup = (communityState.groups ?? []).find((group) => group.id === communityState.selectedGroupId);

  const handleToggleMode = () => {
    const resolvedMode = isCommunity ? "components" : "communities";
    setFilter("communityMode", resolvedMode);
    setFilter("communityHiddenIds", []);
    setFilter("communityComputeKey", 0);
    setAllCommunityState({
      ...communityStateInit,
      baseGraphData: communityState.baseGraphData,
      baseSignature: communityState.baseSignature,
    });
  };

  const handleResolutionChange = (value) => {
    setFilter("communityResolution", value);
    if ((communityState.groups ?? []).length > 0) {
      setCommunityState("isStale", true);
    }
  };

  const handleResolutionTextChange = (value) => {
    setFilter("communityResolutionText", value);
  };

  const handleCompute = () => {
    setFilter("communityComputeKey", filter.communityComputeKey + 1);
  };

  const handleShowAll = () => {
    setFilter("communityHiddenIds", []);
  };

  const handleClearSelection = () => {
    setCommunityState("selectedGroupId", null);
  };

  const handleToggleVisibility = (item) => {
    const groupId = item?.id?.toString();
    if (!groupId) return;

    const nextHidden = new Set(hiddenSet);
    if (nextHidden.has(groupId)) {
      nextHidden.delete(groupId);
    } else {
      nextHidden.add(groupId);
    }
    setFilter("communityHiddenIds", Array.from(nextHidden));
  };

  const handleIsolateGroup = (item) => {
    const groupId = item?.id?.toString();
    if (!groupId) return;

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

  const statusMessage = communityState.isStale
    ? "Group data is out of date. Recompute to apply current filters."
    : !hasGroups
      ? "No groups computed yet."
      : null;
  const modeLabel = isCommunity ? "Louvain groups" : "Component groups";

  return (
    <>
      <SwitchBlock
        value={isCommunity}
        setValue={handleToggleMode}
        text={"Use Louvain Grouping"}
        infoHeading={"Group Detection"}
        infoDescription={"Toggle between Louvain grouping and component grouping."}
      />
      {isCommunity && (
        <FieldBlock
          valueText={filter.communityResolutionText}
          setValue={handleResolutionChange}
          setValueText={handleResolutionTextChange}
          fallbackValue={communityResolutionInit}
          min={0.1}
          step={0.1}
          text={"Group Resolution"}
          infoHeading={"Louvain Resolution"}
          infoDescription={"Higher values yield smaller groups. Recompute after changing."}
        />
      )}
      <div className="text-secondary pad-top-05 pad-bottom-05">Mode: {modeLabel}</div>
      <div className="block-section">
        <Button text={"Compute Groups"} onClick={handleCompute} />
        <Button text={"Show All"} onClick={handleShowAll} />
        {selectedGroup && <Button text={"Clear Selection"} onClick={handleClearSelection} />}
      </div>
      {statusMessage && <div className="text-secondary pad-top-05 pad-bottom-05">{statusMessage}</div>}
      <TableList
        heading={`Groups (${rows.length})`}
        data={rows}
        displayKey={"primaryText"}
        secondaryKey={"secondaryText"}
        onItemClick={handleFocusGroup}
        ActionIcon={VisibilityIcon}
        onActionIconClick={handleToggleVisibility}
        actionIconTooltipContent={(item) => (item.isHidden ? "Show group" : "Hide group")}
        ActionIcon2={IsolateIcon}
        onActionIcon2Click={handleIsolateGroup}
        actionIcon2TooltipContent={() => "Show only this group"}
      />
      {selectedGroup && (
        <div className="block-section block-section-stack">
          <div className="table-list-heading">Group Details</div>
          <table className="item-table plain-item-table">
            <tbody>
              <DetailRow label={"Label"} value={selectedGroup.label} />
              <DetailRow label={"Group ID"} value={selectedGroup.id} />
              <DetailRow label={"Nodes"} value={selectedGroup.size} />
              <DetailRow label={"Links (internal)"} value={selectedGroup.linkCount ?? 0} />
              <DetailRow label={"Top pathways"} value={formatTopAttributes(selectedGroup.topAttributes) || "None"} />
              <DetailRow
                label={"Top link attributes"}
                value={formatTopAttributes(selectedGroup.topLinkAttributes) || "None"}
              />
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
