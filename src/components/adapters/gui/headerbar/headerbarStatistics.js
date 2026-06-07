import { useMemo } from "react";
import { useGraphState } from "../../state/graphState.js";
import { useCommunityState } from "../../state/communityState.js";
import { calculateGraphStatistics } from "../../../domain/service/graph_calculations/graphStatistics.js";
import {
  AttributeStatisticsSection,
  CommunityStatisticsSection,
  StatisticMetric,
  StatisticRow,
} from "./headerbarStatisticsSections.js";
import {
  formatStatisticDecimal,
  formatStatisticInteger,
  formatStatisticPercent,
} from "./statisticsFormatters.js";

export function HeaderbarStatistics() {
  const graphData = useGraphState((state) => state.graphState.graph?.data);
  const communities = useCommunityState((state) => state.communityState.communities);
  const communityResolution = useCommunityState((state) => state.communityState.communityResolution);
  const statistics = useMemo(() => calculateGraphStatistics(graphData), [graphData]);
  const largestCommunity = communities[0];
  const hasGraph = Boolean(graphData);

  return (
    <div className="headerbar-statistics">
      <div className="statistics-heading">
        <div>
          <h2>Graph statistics</h2>
          <p>{hasGraph ? "Current displayed graph" : "No graph loaded"}</p>
        </div>
      </div>

      <div className="statistics-metric-grid">
        <StatisticMetric label="Nodes" value={formatStatisticInteger(statistics.nodeCount)} />
        <StatisticMetric label="Links" value={formatStatisticInteger(statistics.linkCount)} />
        <StatisticMetric label="Average degree" value={formatStatisticDecimal(statistics.averageDegree)} />
        <StatisticMetric label="Density" value={formatStatisticPercent(statistics.density)} />
        <StatisticMetric label="Components" value={formatStatisticInteger(statistics.componentCount)} />
      </div>

      <section className="statistics-section" aria-labelledby="statistics-structure-heading">
        <h3 id="statistics-structure-heading">Structure</h3>
        <div className="statistics-row-grid">
          <StatisticRow
            label="Degree range"
            value={`${formatStatisticInteger(statistics.minDegree)} - ${formatStatisticInteger(statistics.maxDegree)}`}
          />
          <StatisticRow label="Median degree" value={formatStatisticDecimal(statistics.medianDegree)} />
          <StatisticRow label="Isolated nodes" value={formatStatisticInteger(statistics.isolatedNodeCount)} />
          <StatisticRow
            label="Largest component"
            value={`${formatStatisticInteger(statistics.largestComponentSize)} (${formatStatisticPercent(statistics.largestComponentShare)})`}
          />
          <StatisticRow label="Communities" value={formatStatisticInteger(communities.length)} />
          <StatisticRow
            label="Largest community"
            value={
              largestCommunity
                ? `${formatStatisticInteger(largestCommunity.size)} (${formatStatisticPercent(largestCommunity.size / statistics.nodeCount)})`
                : "0"
            }
          />
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
