import { withoutAdditionalLinkAttribs } from "../enrichment/additionalLinkEnrichment.js";
import { buildCommunitySummary } from "./communityGrouping.js";
import { filterIgnoreNegatives, filterLasso, filterLinkAttribs, filterNodesExist, filterThreshold } from "./filterGraphLinks.js";
import {
  filterCommunityDensity,
  filterCommunitySizeRange,
  filterCommunityVisibility,
  filterComponentDensity,
  filterComponentSizeRange,
  filterMinNeighborhood,
  filterNodeAttribs,
  filterNodeIds,
} from "./filterGraphNodes.js";
import { filterMergeByName } from "./joinGraph.js";

const inactiveFilter = {
  ignoreNegatives: false,
  lassoSelection: [],
  nodeIdFilters: [],
  minLinkThreshold: 0,
  maxLinkThreshold: "",
  linkFilter: true,
  nodeFilter: true,
  componentDensity: 0,
  maxComponentDensity: "",
  communityDensity: 0,
  minKCoreSize: 0,
  minCompSize: 0,
  maxCompSize: "",
  minCommunitySize: 0,
  maxCommunitySize: "",
  communityHiddenIds: [],
};

export function applyGraphFilters({ graphData, originGraphData = graphData, filter = {}, mergeByName = false, mergeOptions = {}, communityResolution = 0 } = {}) {
  const filterSettings = { ...inactiveFilter, ...filter };
  const sourceGraphData = originGraphData ?? graphData;
  let filteredGraphData = {
    ...graphData,
    nodes: sourceGraphData.nodes,
    links: sourceGraphData.links,
  };

  filteredGraphData = filterMergeByName(filteredGraphData, mergeByName, mergeOptions);
  filteredGraphData = filterIgnoreNegatives(filteredGraphData, filterSettings.ignoreNegatives);
  filteredGraphData = filterLasso(filteredGraphData, filterSettings.lassoSelection);
  filteredGraphData = filterNodeIds(filteredGraphData, filterSettings.nodeIdFilters);
  filteredGraphData = filterNodesExist(filteredGraphData);

  filteredGraphData = filterThreshold(filteredGraphData, filterSettings.minLinkThreshold, filterSettings.maxLinkThreshold);
  filteredGraphData = filterLinkAttribs(filteredGraphData, filterSettings.linkFilter);
  filteredGraphData = filterNodeAttribs(filteredGraphData, filterSettings.nodeFilter);
  filteredGraphData = filterNodesExist(filteredGraphData);

  const linksBeforeStructural = filteredGraphData.links;
  filteredGraphData = { ...filteredGraphData, links: withoutAdditionalLinkAttribs(filteredGraphData.links) };

  filteredGraphData = filterComponentDensity(filteredGraphData, filterSettings.componentDensity, filterSettings.maxComponentDensity);
  filteredGraphData = filterCommunityDensity(filteredGraphData, filterSettings.communityDensity, communityResolution);
  filteredGraphData = filterMinNeighborhood(filteredGraphData, filterSettings.minKCoreSize);
  filteredGraphData = filterComponentSizeRange(filteredGraphData, filterSettings.minCompSize, filterSettings.maxCompSize);
  filteredGraphData = filterCommunitySizeRange(
    filteredGraphData,
    filterSettings.minCommunitySize,
    filterSettings.maxCommunitySize,
    communityResolution,
  );

  const communitySummary = buildCommunitySummary(filteredGraphData, { resolution: communityResolution });
  filteredGraphData = filterCommunityVisibility(filteredGraphData, communitySummary.idToCommunity, filterSettings.communityHiddenIds);
  filteredGraphData = filterNodesExist(filteredGraphData);

  filteredGraphData = { ...filteredGraphData, links: filterNodesExist({ ...filteredGraphData, links: linksBeforeStructural }).links };

  return { graphData: filteredGraphData, communitySummary };
}

export function applyGraphPrefilters(graphData, settings = {}) {
  return applyGraphFilters({
    graphData,
    originGraphData: graphData,
    filter: {
      ignoreNegatives: settings.ignoreNegatives,
      minLinkThreshold: settings.minEdgeCorr,
      maxLinkThreshold: settings.maxEdgeCorr,
      minCompSize: settings.minCompSize,
      maxCompSize: settings.maxCompSize,
    },
    mergeByName: settings.mergeByName,
  }).graphData;
}
