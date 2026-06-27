import { DetailRow, ToggleList } from "../reusable_components/sidebarComponents.js";
import {
  formatSearchDetailValue,
  formatSearchValues,
  formatSearchWeight,
  stringifySearchValue,
} from "../../../domain/service/search/search.js";

export function SearchResultSection({ total, maxResults, heading, data, expandedId, getItemId, onItemToggle, renderExpandedContent }) {
  return (
    <>
      <ToggleList
        heading={heading}
        data={data}
        displayKey={"primaryText"}
        secondaryKey={"secondaryText"}
        expandedId={expandedId}
        getItemId={getItemId}
        onItemToggle={onItemToggle}
        renderExpandedContent={renderExpandedContent}
      />
      {total > maxResults && <SearchOverflowHint total={total} maxResults={maxResults} />}
    </>
  );
}

export function NodeEntriesBlock({ entries }) {
  const hasEntries = Array.isArray(entries) && entries.length > 0;

  return (
    <div className="toggle-list-detail-item toggle-list-detail-block">
      {hasEntries ? (
        <table className="toggle-list-detail-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phosphosites</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(({ id, name, phosphosites }, index) => {
              const phosphositeText = formatSearchValues(phosphosites);
              return (
                <tr key={`${id}-${name}-${index}`}>
                  <td title={stringifySearchValue(id) || undefined}>{formatSearchDetailValue(id)}</td>
                  <td title={stringifySearchValue(name) || undefined}>{formatSearchDetailValue(name)}</td>
                  <td title={phosphositeText === "None" ? undefined : phosphositeText}>{phosphositeText}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <span className="text-secondary toggle-list-detail-value">None</span>
      )}
    </div>
  );
}

export function SearchNodeDetails({ item, displayName, entries }) {
  return (
    <div className="toggle-list-details">
      <DetailRow label={"Name"} value={formatSearchDetailValue(displayName || item?.nodeId)} />
      <NodeEntriesBlock entries={entries} />
      <DetailRow label={"Annotations"} value={formatSearchValues(item?.node?.attribs)} />
    </div>
  );
}

export function SearchLinkDetails({ item }) {
  return (
    <div className="toggle-list-details">
      <DetailRow label={"Source"} value={formatSearchDetailValue(item.sourceId)} />
      <DetailRow label={"Target"} value={formatSearchDetailValue(item.targetId)} />
      <DetailRow label={"Attribute"} value={formatSearchDetailValue(item.link?.attrib)} />
      <DetailRow label={"Weight"} value={formatSearchDetailValue(formatSearchWeight(item.link?.weight))} />
    </div>
  );
}

export function SearchOverflowHint({ total, maxResults }) {
  return (
    <div className="overflow-hint">
      Showing the first {maxResults} of {total} matches.
    </div>
  );
}
