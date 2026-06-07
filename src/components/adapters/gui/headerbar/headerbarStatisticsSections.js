import {
  formatStatisticDecimal,
  formatStatisticInteger,
  formatStatisticPercent,
} from "./statisticsFormatters.js";

export function StatisticMetric({ label, value }) {
  return (
    <div className="statistics-metric">
      <span className="statistics-metric-value">{value}</span>
      <span className="statistics-metric-label">{label}</span>
    </div>
  );
}

export function StatisticRow({ label, value }) {
  return (
    <div className="statistics-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function AttributeStatisticsSection({ title, attributes, total }) {
  return (
    <details className="statistics-attributes">
      <summary>
        <span>{title}</span>
        <span>{formatStatisticInteger(attributes.length)}</span>
      </summary>
      <div className="statistics-attribute-list">
        {attributes.length === 0 ? (
          <span className="statistics-empty">No attributes</span>
        ) : (
          attributes.map(({ name, count }) => (
            <div className="statistics-attribute-row" key={name}>
              <span title={name}>{name}</span>
              <strong>
                {formatStatisticInteger(count)}{" "}
                <small>{formatStatisticPercent(total === 0 ? 0 : count / total)}</small>
              </strong>
            </div>
          ))
        )}
      </div>
    </details>
  );
}

export function CommunityStatisticsSection({ communities, resolution }) {
  return (
    <details className="statistics-attributes statistics-communities">
      <summary>
        <span>Communities</span>
        <span>{formatStatisticInteger(communities.length)}</span>
      </summary>
      <div className="statistics-community-resolution">
        Louvain resolution {formatStatisticDecimal(resolution)}
      </div>
      <div className="statistics-attribute-list">
        {communities.length === 0 ? (
          <span className="statistics-empty">No communities</span>
        ) : (
          communities.map((community) => (
            <div className="statistics-community-row" key={community.id}>
              <div>
                <strong>{community.label}</strong>
                <span>{formatStatisticInteger(community.size)} nodes</span>
              </div>
              <div>
                <span>{formatStatisticInteger(community.linkCount ?? 0)} internal</span>
                <span>{formatStatisticInteger(community.externalLinkCount ?? 0)} external</span>
              </div>
            </div>
          ))
        )}
      </div>
    </details>
  );
}
