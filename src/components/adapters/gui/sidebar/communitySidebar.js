import { FieldApplyBlock, FieldBlock, TableList } from "../reusable_components/sidebarComponents.js";
import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import eyeSvg from "../../../../assets/icons/eye.svg?raw";
import microscopeSvg from "../../../../assets/icons/microscope.svg?raw";

import { useFilter, communityResolutionInit } from "../../state/filterState.js";
import { useCommunityState } from "../../state/communityState.js";
import { useGraphState } from "../../state/graphState.js";
import { useAppearance } from "../../state/appearanceState.js";
import { useRenderState } from "../../state/canvasState.js";
import { useContainer } from "../../state/containerState.js";
import { getCentroid } from "../../../domain/service/graph_calculations/graphUtils.js";
import { centerOnNode } from "../../../domain/service/canvas_interaction/centerView.js";
import { getHiddenCommunityIdsBySize } from "../../../domain/service/graph_calculations/communityGrouping.js";

const VisibilityIcon = ({ item, ...props }) => <SvgIcon svg={eyeSvg} className={item?.isHidden ? "icon-muted" : ""} {...props} />;
const IsolateIcon = (props) => <SvgIcon svg={microscopeSvg} {...props} />;

export function CommunitySidebar() {
  const { filter, setFilter } = useFilter();
  const { communityState, setCommunityState } = useCommunityState();
  const { graphState } = useGraphState();
  const { appearance } = useAppearance();
  const { renderState } = useRenderState();
  const { container } = useContainer();

  const manualHiddenSet = new Set((filter.communityHiddenIds ?? []).map((id) => id?.toString()));
  const sizeHiddenIds = getHiddenCommunityIdsBySize(communityState.groups, filter.communityMinSize, filter.communityMaxSize);
  const hiddenSet = new Set([...manualHiddenSet, ...sizeHiddenIds].map((id) => id?.toString()));

  const rows = (communityState.groups ?? []).map((group) => {
    return {
      ...group,
      primaryText: group.label,
      secondaryText: `${group.size} nodes`,
      isHidden: hiddenSet.has(group.id?.toString()),
    };
  });

  const selectedGroup = (communityState.groups ?? []).find((group) => group.id === communityState.selectedGroupId);

  const handleResolutionChange = (value) => {
    if (value === filter.communityResolution) return;
    setFilter("communityResolution", value);
    setFilter("communityComputeKey", filter.communityComputeKey + 1);
  };

  const handleResolutionTextChange = (value) => {
    setFilter("communityResolutionText", value);
  };

  const handleApplyMinSize = () => {
    const minSize = parseMinSize(filter.communityMinSizeText);
    setFilter("communityMinSize", minSize);
    setFilter("communityMinSizeText", minSize.toString());
  };

  const handleApplyMaxSize = () => {
    const maxSize = parseMaxSize(filter.communityMaxSizeText);
    if (maxSize === null) {
      setFilter("communityMaxSize", "");
      setFilter("communityMaxSizeText", "");
      return;
    }
    setFilter("communityMaxSize", maxSize);
    setFilter("communityMaxSizeText", maxSize.toString());
  };

  const handleToggleVisibility = (item) => {
    const groupId = item?.id?.toString();
    if (!groupId) return;

    const nextHidden = new Set(manualHiddenSet);
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
      <FieldApplyBlock
        valueText={filter.communityMinSizeText}
        setValueText={(value) => setFilter("communityMinSizeText", value)}
        onApply={handleApplyMinSize}
        min={0}
        step={1}
        text={"Min Communitiy size"}
        infoHeading={"Min Communitiy size"}
        infoDescription={"Hide communities with fewer than this many nodes. Set to 0 to show all communities."}
      />
      <FieldApplyBlock
        valueText={filter.communityMaxSizeText}
        setValueText={(value) => setFilter("communityMaxSizeText", value)}
        onApply={handleApplyMaxSize}
        min={0}
        step={1}
        text={"Max Communitiy size"}
        infoHeading={"Max Communitiy size"}
        infoDescription={"Hide communities with more than this many nodes. Leave empty to show all communities."}
      />
      <TableList
        heading={`Communities (${rows.length})`}
        data={rows}
        displayKey={"primaryText"}
        secondaryKey={"secondaryText"}
        onItemClick={handleFocusGroup}
        ActionIcon={VisibilityIcon}
        onActionIconClick={handleToggleVisibility}
        actionIconTooltipContent={(item) => (item.isHidden ? "Show community" : "Hide community")}
        ActionIcon2={IsolateIcon}
        onActionIcon2Click={handleIsolateGroup}
        actionIcon2TooltipContent={() => "Show only this community"}
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
