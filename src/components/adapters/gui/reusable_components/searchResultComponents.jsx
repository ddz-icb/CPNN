import { DetailRow, TableList, ToggleList } from "./sidebarComponents.jsx";
import {
  formatSearchDetailValue,
  formatSearchWeight,
} from "../../../domain/service/search/search.js";

export function SearchResultSection({ total, maxResults, heading, data, expandedId, getItemId, onItemToggle, renderExpandedContent, showSecondary = true }) {
  return (
    <>
      {renderExpandedContent ? (
        <ToggleList
          heading={heading}
          data={data}
          displayKey={"primaryText"}
          secondaryKey={showSecondary ? "secondaryText" : undefined}
          expandedId={expandedId}
          getItemId={getItemId}
          onItemToggle={onItemToggle}
          renderExpandedContent={renderExpandedContent}
        />
      ) : (
        <TableList
          heading={heading}
          data={data}
          displayKey={"primaryText"}
          secondaryKey={showSecondary ? "secondaryText" : undefined}
          onItemClick={onItemToggle}
        />
      )}
      {total > maxResults && <SearchOverflowHint total={total} maxResults={maxResults} />}
    </>
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
