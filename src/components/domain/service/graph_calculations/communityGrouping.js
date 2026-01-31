import { getCommunityData, getComponentData } from "./graphUtils.js";

const DEFAULT_TOP_ATTRIBUTES = 3;
const COMMUNITY_MODE = {
  communities: "communities",
  components: "components",
};

function normalizeMode(mode) {
  return mode === COMMUNITY_MODE.components ? COMMUNITY_MODE.components : COMMUNITY_MODE.communities;
}

function getLabelPrefix() {
  return "Community";
}

function getGroupAssignments(graphData, mode, options = {}) {
  const normalizedMode = normalizeMode(mode);

  const resolution = options.resolution;
  const useComponents = normalizedMode === COMMUNITY_MODE.components || resolution === 0;

  if (useComponents) {
    const [idToComp, compToCompSize] = getComponentData(graphData);
    return { idToGroup: idToComp, groupToSize: compToCompSize };
  }

  const communityOptions = resolution ? { resolution } : {};
  const [idToComm, commToSize] = getCommunityData(graphData, communityOptions);
  return { idToGroup: idToComm, groupToSize: commToSize };
}

function collectTopAttributes(counts, limit) {
  if (!counts) return [];

  return Object.entries(counts)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function getEndpointId(endpoint) {
  if (endpoint == null) return null;
  if (typeof endpoint === "object") {
    if (endpoint.id != null) return endpoint.id;
    if (endpoint.data?.id != null) return endpoint.data.id;
  }
  return endpoint;
}

export function buildGroupSummary(graphData, options = {}) {
  if (!graphData?.nodes?.length) {
    return { groups: [], idToGroup: null, groupToNodeIds: {} };
  }

  const mode = normalizeMode(options.mode);
  const { idToGroup, groupToSize } = getGroupAssignments(graphData, mode, options);
  if (!idToGroup || !groupToSize) {
    return { groups: [], idToGroup: null, groupToNodeIds: {} };
  }

  const groupToNodeIds = {};
  const groupToAttribCounts = {};
  const groupToLinkCount = {};
  const groupToLinkAttribCounts = {};

  graphData.nodes.forEach((node) => {
    const groupId = idToGroup[node.id];
    if (groupId === undefined || groupId === null) return;

    const groupKey = groupId.toString();
    if (!groupToNodeIds[groupKey]) {
      groupToNodeIds[groupKey] = [];
    }
    groupToNodeIds[groupKey].push(node.id);

    const groups = Array.isArray(node.groups) ? node.groups : [];
    if (!groupToAttribCounts[groupKey]) {
      groupToAttribCounts[groupKey] = {};
    }
    groups.forEach((group) => {
      const name = group?.toString();
      if (!name) return;
      groupToAttribCounts[groupKey][name] = (groupToAttribCounts[groupKey][name] || 0) + 1;
    });
  });

  graphData.links?.forEach((link) => {
    const sourceId = getEndpointId(link.source);
    const targetId = getEndpointId(link.target);
    if (!sourceId || !targetId) return;

    const sourceGroup = idToGroup[sourceId];
    const targetGroup = idToGroup[targetId];
    if (sourceGroup === undefined || sourceGroup === null) return;
    if (targetGroup === undefined || targetGroup === null) return;
    if (sourceGroup !== targetGroup) return;

    const groupKey = sourceGroup.toString();
    groupToLinkCount[groupKey] = (groupToLinkCount[groupKey] || 0) + 1;

    const attribs = Array.isArray(link.attribs) ? link.attribs : [];
    if (!groupToLinkAttribCounts[groupKey]) {
      groupToLinkAttribCounts[groupKey] = {};
    }
    attribs.forEach((attrib) => {
      const name = attrib?.toString();
      if (!name) return;
      groupToLinkAttribCounts[groupKey][name] = (groupToLinkAttribCounts[groupKey][name] || 0) + 1;
    });
  });

  const labelPrefix = getLabelPrefix();
  const rawGroups = Object.entries(groupToSize).map(([groupId, size]) => {
    const groupKey = groupId.toString();
    const attribCounts = groupToAttribCounts[groupKey];
    const linkAttribCounts = groupToLinkAttribCounts[groupKey];
    return {
      id: groupKey,
      size,
      linkCount: groupToLinkCount[groupKey] || 0,
      topAttributes: collectTopAttributes(attribCounts, options.topAttributes ?? DEFAULT_TOP_ATTRIBUTES),
      topLinkAttributes: collectTopAttributes(linkAttribCounts, options.topAttributes ?? DEFAULT_TOP_ATTRIBUTES),
    };
  });

  rawGroups.sort((a, b) => {
    if (b.size !== a.size) return b.size - a.size;
    return a.id.localeCompare(b.id);
  });

  const groups = rawGroups.map((group, index) => ({
    ...group,
    label: `${labelPrefix} ${index + 1}`,
  }));

  return { groups, idToGroup, groupToNodeIds };
}

export function isCommunityMode(mode) {
  return normalizeMode(mode) === COMMUNITY_MODE.communities;
}

export function getCommunityIdsOutsideSizeRange(groups, minSize, maxSize) {
  if (!Array.isArray(groups) || groups.length === 0) return [];

  const minValue = typeof minSize === "number" ? minSize : Number(minSize);
  const hasMin = Number.isFinite(minValue) && minValue > 0;

  const hasMaxInput = maxSize !== "" && maxSize !== null && maxSize !== undefined;
  const maxValue = typeof maxSize === "number" ? maxSize : Number(maxSize);
  const hasMax = hasMaxInput && Number.isFinite(maxValue) && maxValue > 0;

  if (!hasMin && !hasMax) return [];

  return groups
    .filter((group) => {
      const sizeValue = Number(group?.size);
      if (!Number.isFinite(sizeValue)) return false;
      if (hasMin && sizeValue < minValue) return true;
      if (hasMax && sizeValue > maxValue) return true;
      return false;
    })
    .map((group) => group?.id?.toString())
    .filter(Boolean);
}
