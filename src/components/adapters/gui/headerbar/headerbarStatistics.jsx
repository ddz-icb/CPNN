import { useMemo } from "react";
import { useGraphState } from "../../state/graphState.js";
import { useCommunityState } from "../../state/communityState.js";
import { calculateGraphStatistics } from "../../../domain/service/graph_calculations/graphStatistics.js";
import {
  AttributeStatisticsSection,
  CommunityStatisticsSection,
  StatisticMetric,
} from "./headerbarStatisticsSections.jsx";
import {
  formatStatisticDecimal,
  formatStatisticInteger,
  formatStatisticPercent,
} from "./statisticsFormatters.js";

export function HeaderbarStatistics() {
  const graphData = useGraphState((state) => state.graphState.graph?.data);
  const originalGraphData = useGraphState((state) => state.graphState.originGraph?.data);
  const communities = useCommunityState((state) => state.communityState.communities);
  const communityResolution = useCommunityState((state) => state.communityState.communityResolution);
  const statistics = useMemo(() => calculateGraphStatistics(graphData), [graphData]);
  const largestCommunity = communities[0];
  const hasGraph = Boolean(graphData);
  const largestCommunityValue = largestCommunity
    ? `${formatStatisticInteger(largestCommunity.size)} (${formatStatisticPercent(largestCommunity.size / statistics.nodeCount)})`
    : "0";
  const originalNodeCount = originalGraphData?.nodes?.length ?? 0;
  const originalLinkCount = originalGraphData?.links?.length ?? 0;
  const filteredNodeCount = Math.max(0, originalNodeCount - statistics.nodeCount);
  const filteredLinkCount = Math.max(0, originalLinkCount - statistics.linkCount);
  const filteredNodeShare = originalNodeCount === 0 ? 0 : filteredNodeCount / originalNodeCount;
  const filteredLinkShare = originalLinkCount === 0 ? 0 : filteredLinkCount / originalLinkCount;
  const displayedGraphMetrics = [
    { label: "Nodes", value: formatStatisticInteger(statistics.nodeCount), description: "Nodes in the currently displayed graph" },
    { label: "Links", value: formatStatisticInteger(statistics.linkCount), description: "Links in the currently displayed graph" },
    ...(originalGraphData ? [
      {
        label: "Nodes filtered out",
        value: `${formatStatisticInteger(filteredNodeCount)} (${formatStatisticPercent(filteredNodeShare)})`,
        description: "Nodes excluded from the displayed graph relative to the unfiltered graph",
      },
      {
        label: "Links filtered out",
        value: `${formatStatisticInteger(filteredLinkCount)} (${formatStatisticPercent(filteredLinkShare)})`,
        description: "Links excluded from the displayed graph relative to the unfiltered graph",
      },
    ] : []),
    { label: "Average degree", value: formatStatisticDecimal(statistics.averageDegree), description: "Average number of incident links per node" },
    {
      label: "Degree range",
      value: `${formatStatisticInteger(statistics.minDegree)}–${formatStatisticInteger(statistics.maxDegree)}`,
      description: "Minimum and maximum node degree",
    },
    { label: "Density", value: formatStatisticPercent(statistics.density), description: "Share of possible node pairs connected by at least one link" },
    { label: "Components", value: formatStatisticInteger(statistics.componentCount), description: "Disconnected parts of the graph" },
    { label: "Isolated nodes", value: formatStatisticInteger(statistics.isolatedNodeCount), description: "Nodes without any links" },
    { label: "Communities", value: formatStatisticInteger(communities.length), description: "Communities detected at the current resolution" },
    { label: "Largest community", value: largestCommunityValue, description: "Nodes contained in the largest detected community" },
  ];

  if (statistics.directedLinkCount > 0) {
    displayedGraphMetrics.push({
      label: "Directed links",
      value: `${formatStatisticInteger(statistics.directedLinkCount)} (${formatStatisticPercent(statistics.directedLinkShare)})`,
      description: "Links with a defined source-to-target direction",
    });
  }
  if (statistics.meanWeight !== null) {
    displayedGraphMetrics.push({
      label: "Mean weight",
      value: formatStatisticDecimal(statistics.meanWeight),
      description: "Arithmetic mean across links carrying a numeric weight",
    });
  }
  if (statistics.selfLoopCount > 0) {
    displayedGraphMetrics.push({
      label: "Self-loops",
      value: formatStatisticInteger(statistics.selfLoopCount),
      description: "Links whose source and target are the same node",
    });
  }

  return (
    <div className="headerbar-statistics">
      {!hasGraph && <p className="statistics-empty-state">No graph loaded</p>}

      <section className="statistics-overview" aria-labelledby="statistics-displayed-heading">
        <h3 className="table-list-heading" id="statistics-displayed-heading">Displayed graph</h3>
        <div className="statistics-metric-grid">
          {displayedGraphMetrics.map((metric) => (
            <StatisticMetric key={metric.label} {...metric} />
          ))}
        </div>
      </section>

      <CommunityStatisticsSection communities={communities} resolution={communityResolution} />

      <div className="statistics-attribute-sections">
        <AttributeStatisticsSection title="Node attributes" attributes={statistics.nodeAttributes} total={statistics.nodeCount} />
        <AttributeStatisticsSection title="Link attributes" attributes={statistics.linkAttributes} total={statistics.linkCount} />
      </div>
    </div>
  );
}
