import { getCommunityData, getComponentData, getEndpointId } from "./graphUtils.js";

const DEFAULT_TOP_ATTRIBUTES = 3;
function getLabelPrefix() {
  return "Community";
}

function getCommunityAssignments(graphData, options = {}) {
  const resolution = options.resolution;
  const useComponents = resolution === 0;

  if (useComponents) {
    const [idToComp, compToCompSize] = getComponentData(graphData);
    return { idToCommunity: idToComp, communityToSize: compToCompSize };
  }

  const communityOptions = resolution ? { resolution } : {};
  const [idToComm, commToSize] = getCommunityData(graphData, communityOptions);
  return { idToCommunity: idToComm, communityToSize: commToSize };
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

export function buildCommunitySummary(graphData, options = {}) {
  if (!graphData?.nodes?.length) {
    return { communities: [], idToCommunity: null, communityToNodeIds: {} };
  }

  const { idToCommunity, communityToSize } = getCommunityAssignments(graphData, options);
  if (!idToCommunity || !communityToSize) {
    return { communities: [], idToCommunity: null, communityToNodeIds: {} };
  }

  const communityToNodeIds = {};
  const communityToAttribCounts = {};
  const communityToLinkCount = {};
  const communityToExternalLinkCount = {};
  const communityToLinkAttribCounts = {};

  graphData.nodes.forEach((node) => {
    const communityId = idToCommunity[node.id];
    if (communityId === undefined || communityId === null) return;

    const communityKey = communityId.toString();
    if (!communityToNodeIds[communityKey]) {
      communityToNodeIds[communityKey] = [];
    }
    communityToNodeIds[communityKey].push(node.id);

    const nodeAttribs = Array.isArray(node.attribs) ? node.attribs : [];
    if (!communityToAttribCounts[communityKey]) {
      communityToAttribCounts[communityKey] = {};
    }
    nodeAttribs.forEach((groupName) => {
      const name = groupName?.toString();
      if (!name) return;
      communityToAttribCounts[communityKey][name] = (communityToAttribCounts[communityKey][name] || 0) + 1;
    });
  });

  graphData.links?.forEach((link) => {
    const sourceId = getEndpointId(link.source);
    const targetId = getEndpointId(link.target);
    if (!sourceId || !targetId) return;

    const sourceCommunity = idToCommunity[sourceId];
    const targetCommunity = idToCommunity[targetId];
    if (sourceCommunity === undefined || sourceCommunity === null) return;
    if (targetCommunity === undefined || targetCommunity === null) return;
    if (sourceCommunity === targetCommunity) {
      const communityKey = sourceCommunity.toString();
      communityToLinkCount[communityKey] = (communityToLinkCount[communityKey] || 0) + 1;

      if (!communityToLinkAttribCounts[communityKey]) {
        communityToLinkAttribCounts[communityKey] = {};
      }
      const name = link.attrib?.toString();
      if (name) {
        communityToLinkAttribCounts[communityKey][name] = (communityToLinkAttribCounts[communityKey][name] || 0) + 1;
      }
    } else {
      const sourceKey = sourceCommunity.toString();
      const targetKey = targetCommunity.toString();
      communityToExternalLinkCount[sourceKey] = (communityToExternalLinkCount[sourceKey] || 0) + 1;
      communityToExternalLinkCount[targetKey] = (communityToExternalLinkCount[targetKey] || 0) + 1;
    }
  });

  const labelPrefix = getLabelPrefix();
  const rawCommunities = Object.entries(communityToSize).map(([communityId, size]) => {
    const communityKey = communityId.toString();
    const attribCounts = communityToAttribCounts[communityKey];
    const linkAttribCounts = communityToLinkAttribCounts[communityKey];
    const internalLinks = communityToLinkCount[communityKey] || 0;
    const topAttributes = collectTopAttributes(attribCounts, options.topNodeAttribs ?? DEFAULT_TOP_ATTRIBUTES);
    const topLinkAttributes = collectTopAttributes(linkAttribCounts, options.topNodeAttribs ?? DEFAULT_TOP_ATTRIBUTES);
    return {
      id: communityKey,
      size,
      linkCount: internalLinks,
      externalLinkCount: communityToExternalLinkCount[communityKey] || 0,
      density: size > 0 ? (2 * internalLinks) / size : 0,
      topAttributes,
      topNodeAttribs: topAttributes,
      topLinkAttributes,
      topLinkAttribs: topLinkAttributes,
    };
  });

  rawCommunities.sort((a, b) => {
    if (b.size !== a.size) return b.size - a.size;
    return a.id.localeCompare(b.id);
  });

  const communities = rawCommunities.map((community, index) => ({
    ...community,
    label: `${labelPrefix} ${index + 1}`,
  }));

  return { communities, idToCommunity, communityToNodeIds };
}
