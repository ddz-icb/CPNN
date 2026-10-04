export function NodeStatistics({ statistics, community }) {
  if (!statistics) return <p className="tooltip-adjacent-empty">This node is not in the current graph.</p>;
  const s = statistics;
  return (
    <div className="node-statistics">
      <h3 className="table-list-heading">Overview</h3>
      <dl className="node-statistics-summary">
        {[
          ["Links", s.links],
          ["Adjacent nodes", s.adjacentNodes],
          ["Component nodes", s.componentNodes],
          ["Component links", s.componentLinks],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value.toLocaleString()}</dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="node-link-statistics">
        <h4 className="table-list-heading" id="node-link-statistics">Links by type</h4>
        <table>
          <thead>
            <tr>
              <th scope="col">Type</th>
              <th scope="col">Out</th>
              <th scope="col">In</th>
              <th scope="col">Undirected</th>
            </tr>
          </thead>
          <tbody>
            {s.linksByType.map((row) => (
              <tr key={row.type}>
                <th scope="row">{row.type}</th>
                <td>{row.outgoing}</td>
                <td>{row.incoming}</td>
                <td>{row.undirected}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td>{s.outgoing}</td>
              <td>{s.incoming}</td>
              <td>{s.undirected}</td>
            </tr>
          </tfoot>
        </table>
      </section>
      <section aria-labelledby="node-neighbor-statistics">
        <h4 className="table-list-heading" id="node-neighbor-statistics">Adjacent nodes by type</h4>
        {s.nodesByType.length ? (
          <table>
            <thead>
              <tr>
                <th scope="col">Node type</th>
                <th scope="col">Nodes</th>
              </tr>
            </thead>
            <tbody>
              {s.nodesByType.map((row) => (
                <tr key={row.type}>
                  <th scope="row">{row.type}</th>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No adjacent nodes.</p>
        )}
      </section>
      <section className="node-statistics-community" aria-labelledby="node-community-statistics">
        <h4 className="table-list-heading" id="node-community-statistics">Community</h4>
        {community ? (
          <div className="node-statistics-community-row">
            <strong>{community.label}</strong>
            <span>{(community.size ?? 0).toLocaleString()} nodes</span>
          </div>
        ) : (
          <p className="community-attribute-empty">No community assignment</p>
        )}
      </section>
    </div>
  );
}
