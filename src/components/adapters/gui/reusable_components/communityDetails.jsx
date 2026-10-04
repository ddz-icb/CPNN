import { useId } from "react";

export function CommunityDetails({ community, heading = "Community", showHeading = true }) {
  const headingId = useId();

  if (!community) {
    return (
      <section className="community-details community-details--empty">
        {showHeading && <h4>{heading}</h4>}
        <p>No community assignment is available for this node.</p>
      </section>
    );
  }

  const metrics = [
    ["Nodes", community.size ?? 0],
    ["Internal links", community.linkCount ?? 0],
    ["External links", community.externalLinkCount ?? 0],
    ["Density", formatDensity(community.density)],
  ];

  return (
    <section className="community-details" aria-labelledby={showHeading ? headingId : undefined}>
      {showHeading && (
        <div className="community-details-title">
          <h4 id={headingId}>{heading}</h4>
          <span>{community.label}</span>
        </div>
      )}
      <section className="community-details-section">
        <h4 className="table-list-heading">Overview</h4>
        <dl className="community-details-summary">
          {metrics.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{formatValue(value)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <RankedAttributeList
        heading="Top node attributes"
        attributes={community.topNodeAttribs ?? community.topAttributes}
        total={community.size}
      />
      <RankedAttributeList
        heading="Top link attributes"
        attributes={community.topLinkAttribs ?? community.topLinkAttributes}
        total={community.linkCount}
      />
    </section>
  );
}

function RankedAttributeList({ heading, attributes, total }) {
  const rows = Array.isArray(attributes) ? attributes : [];

  return (
    <section className="community-attribute-section">
      <h4 className="table-list-heading">{heading}</h4>
      {rows.length ? (
        <ol className="community-attribute-list">
          {rows.map(({ name, count }, index) => (
            <li key={`${name}-${index}`}>
              <span className="community-attribute-rank" aria-hidden="true">{index + 1}</span>
              <span className="community-attribute-name" title={name}>{name}</span>
              <strong aria-label={`${formatValue(count)} occurrences, ${formatPercentage(count, total)} of the community`}>
                {formatValue(count)} <small>{formatPercentage(count, total)}</small>
              </strong>
            </li>
          ))}
        </ol>
      ) : (
        <p className="community-attribute-empty">No attributes</p>
      )}
    </section>
  );
}

function formatDensity(value) {
  if (!Number.isFinite(value)) return "0.00";
  return value.toFixed(2);
}

function formatValue(value) {
  return typeof value === "number" ? value.toLocaleString() : value;
}

function formatPercentage(count, total) {
  if (!Number.isFinite(Number(count)) || !Number.isFinite(Number(total)) || Number(total) <= 0) return "0%";
  return new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1 }).format(Number(count) / Number(total));
}
