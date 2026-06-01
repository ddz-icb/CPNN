import { Fragment, useId } from "react";
import chevronSvg from "../../../../assets/icons/chevron.svg?raw";
import { SvgIcon } from "./SvgIcon.jsx";
import { PortalTooltip } from "./tooltipComponents.js";

export function TableList({
  heading,
  data,
  displayKey,
  secondaryKey,
  onItemClick,
  ActionIcon,
  onActionIconClick,
  showActionIconOn,
  itemTooltipContent,
  actionIconTooltipContent,
  ActionIcon2,
  onActionIcon2Click,
  actionIcon2TooltipContent,
  dark,
}) {
  const instanceId = useId();
  const rows = getListRows(data, displayKey, secondaryKey, itemTooltipContent);

  return (
    <div>
      <div className="table-list-heading">{heading}</div>
      <table className={`item-table ${dark && "plain-item-table"}`}>
        <tbody>
          {rows.length > 0 ? (
            rows.map(({ item, index, primaryValue, secondaryValue, primaryTitle, secondaryTitle, rowTooltipContent }) => (
              <tr key={`row-${instanceId}-${index}`} className="item-table-entry-highlight">
                <td
                  className="item-table-text"
                  onClick={() => onItemClick && onItemClick(item)}
                  {...getTooltipAttributes(rowTooltipContent, `item-tooltip-${instanceId}-${index}`)}
                >
                  <ListItemText
                    primaryValue={primaryValue}
                    secondaryValue={secondaryValue}
                    primaryTitle={primaryTitle}
                    secondaryTitle={secondaryTitle}
                    showSecondary={Boolean(secondaryKey)}
                  />
                </td>

                {ActionIcon && (
                  <>
                    {!showActionIconOn || showActionIconOn(item) ? (
                      <td className="item-table-logo">
                        <ActionIcon
                          item={item}
                          key={`action-icon-${instanceId}-${index}`}
                          onClick={() => onActionIconClick && onActionIconClick(item)}
                          {...getTooltipAttributes(actionIconTooltipContent?.(item), `action-tooltip-${instanceId}-${index}`)}
                        />
                      </td>
                    ) : (
                      <td className="item-table-empty-logo">
                        <ActionIcon item={item} key={`action-icon-empty-${instanceId}-${index}`} />
                      </td>
                    )}
                  </>
                )}

                {ActionIcon2 && (
                  <td className="item-table-logo">
                    <ActionIcon2
                      item={item}
                      key={`action-icon-2-${instanceId}-${index}`}
                      onClick={() => onActionIcon2Click && onActionIcon2Click(item)}
                      {...getTooltipAttributes(actionIcon2TooltipContent?.(item), `action-tooltip-2-${instanceId}-${index}`)}
                    />
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td className="item-table-text">
                <span>None</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <ListTooltipPortals
        rows={rows}
        instanceId={instanceId}
        actionIconTooltipContent={actionIconTooltipContent}
        actionIcon2TooltipContent={actionIcon2TooltipContent}
      />
    </div>
  );
}

export function ToggleList({
  heading,
  data,
  displayKey,
  secondaryKey,
  expandedId,
  getItemId,
  onItemToggle,
  renderExpandedContent,
  ActionIcon,
  onActionIconClick,
  showActionIconOn,
  itemTooltipContent,
  actionIconTooltipContent,
  ActionIcon2,
  onActionIcon2Click,
  actionIcon2TooltipContent,
  dark,
  emptyMessage = "None",
}) {
  const instanceId = useId();
  const rows = getListRows(data, displayKey, secondaryKey, itemTooltipContent);
  const normalizedExpandedId = expandedId === null || expandedId === undefined ? null : expandedId.toString();
  const columnCount = 1 + (ActionIcon ? 1 : 0) + (ActionIcon2 ? 1 : 0);

  return (
    <div>
      <div className="table-list-heading">{heading}</div>
      <table className={`item-table ${dark && "plain-item-table"}`}>
        <tbody>
          {rows.length > 0 ? (
            rows.map(({ item, index, primaryValue, secondaryValue, primaryTitle, secondaryTitle, rowTooltipContent }) => {
              const rawItemId = getItemId ? getItemId(item) : item?.id;
              const itemId = rawItemId === null || rawItemId === undefined ? "" : rawItemId.toString();
              const isExpanded = normalizedExpandedId !== null && itemId !== "" && itemId === normalizedExpandedId;
              const rowKey = itemId || `row-${index}`;

              return (
                <Fragment key={`row-${instanceId}-${rowKey}`}>
                  <tr className="item-table-entry-highlight">
                    <td
                      className="item-table-text"
                      onClick={() => onItemToggle && onItemToggle(item)}
                      tabIndex={onItemToggle ? 0 : undefined}
                      role={onItemToggle ? "button" : undefined}
                      onKeyDown={
                        onItemToggle
                          ? (event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                onItemToggle(item);
                              }
                            }
                          : undefined
                      }
                      {...getTooltipAttributes(rowTooltipContent, `item-tooltip-${instanceId}-${index}`)}
                    >
                      <ListItemText
                        primaryValue={primaryValue}
                        secondaryValue={secondaryValue}
                        primaryTitle={primaryTitle}
                        secondaryTitle={secondaryTitle}
                        showSecondary={Boolean(secondaryKey)}
                      />
                      <SvgIcon svg={chevronSvg} className={`toggle-list-chevron${isExpanded ? " toggle-list-chevron--expanded" : ""}`} />
                    </td>

                    {ActionIcon && (
                      <>
                        {!showActionIconOn || showActionIconOn(item) ? (
                          <td className="item-table-logo">
                            <ActionIcon
                              item={item}
                              key={`action-icon-${instanceId}-${index}`}
                              onClick={() => onActionIconClick && onActionIconClick(item)}
                              {...getTooltipAttributes(actionIconTooltipContent?.(item), `action-tooltip-${instanceId}-${index}`)}
                            />
                          </td>
                        ) : (
                          <td className="item-table-empty-logo">
                            <ActionIcon item={item} key={`action-icon-empty-${instanceId}-${index}`} />
                          </td>
                        )}
                      </>
                    )}

                    {ActionIcon2 && (
                      <td className="item-table-logo">
                        <ActionIcon2
                          item={item}
                          key={`action-icon-2-${instanceId}-${index}`}
                          onClick={() => onActionIcon2Click && onActionIcon2Click(item)}
                          {...getTooltipAttributes(actionIcon2TooltipContent?.(item), `action-tooltip-2-${instanceId}-${index}`)}
                        />
                      </td>
                    )}
                  </tr>
                  {isExpanded && renderExpandedContent && (
                    <tr>
                      <td className="item-table-details-cell" colSpan={columnCount}>
                        {renderExpandedContent(item)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })
          ) : (
            <tr>
              <td className="item-table-text item-table-text--empty">
                <span className="text-secondary">{emptyMessage}</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <ListTooltipPortals
        rows={rows}
        instanceId={instanceId}
        actionIconTooltipContent={actionIconTooltipContent}
        actionIcon2TooltipContent={actionIcon2TooltipContent}
      />
    </div>
  );
}

export function DetailRow({ label, value }) {
  const isList = Array.isArray(value);
  const labelTitle = getTooltipText(label);
  const valueTitle = getTooltipText(value);

  return (
    <div className={`toggle-list-detail-item toggle-list-detail-row${isList ? " toggle-list-detail-row--multiline" : ""}`}>
      <span className="item-table-primary-text" title={labelTitle || undefined}>{label}</span>
      <div className="text-secondary toggle-list-detail-value" title={valueTitle || undefined}>
        {isList
          ? value.map((entry, index) => {
              const entryTitle = getTooltipText(entry);
              return <div key={`${label}-${index}`} title={entryTitle || undefined}>{entry}</div>;
            })
          : value}
      </div>
    </div>
  );
}

function getDisplayValue(item, displayKey) {
  return displayKey ? item?.[displayKey] : item;
}

export function getTooltipText(value) {
  if (value === null || value === undefined || value === false) return "";
  if (Array.isArray(value)) {
    return value.map(getTooltipText).filter(Boolean).join("\n");
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
    return value.toString();
  }
  return "";
}

function getListRows(data, displayKey, secondaryKey, itemTooltipContent) {
  return (data ?? []).map((item, index) => {
    const primaryValue = getDisplayValue(item, displayKey);
    const secondaryValue = secondaryKey ? getDisplayValue(item, secondaryKey) : null;
    const primaryTitle = getTooltipText(primaryValue);
    const secondaryTitle = getTooltipText(secondaryValue);

    return {
      item,
      index,
      primaryValue,
      secondaryValue,
      primaryTitle,
      secondaryTitle,
      rowTooltipContent: getItemTooltipContent(item, itemTooltipContent, primaryTitle, secondaryTitle),
    };
  });
}

function ListItemText({ primaryValue, secondaryValue, primaryTitle, secondaryTitle, showSecondary }) {
  return (
    <span className="item-table-text-content">
      <span className="item-table-primary-text item-table-text-truncate" title={primaryTitle || undefined}>
        {primaryValue}
      </span>
      {showSecondary && secondaryValue && (
        <span className="item-table-secondary-text item-table-text-truncate" title={secondaryTitle || undefined}>
          {secondaryValue}
        </span>
      )}
    </span>
  );
}

function ListTooltipPortals({ rows, instanceId, actionIconTooltipContent, actionIcon2TooltipContent }) {
  return rows.map(({ item, index, rowTooltipContent }) => (
    <Fragment key={`tooltip-set-${instanceId}-${index}`}>
      {rowTooltipContent && <PortalTooltip id={`item-tooltip-${instanceId}-${index}`} className="tooltip-gui" positionStrategy="fixed" />}
      {actionIconTooltipContent && actionIconTooltipContent(item) && (
        <PortalTooltip id={`action-tooltip-${instanceId}-${index}`} className="tooltip-gui" positionStrategy="fixed" />
      )}
      {actionIcon2TooltipContent && actionIcon2TooltipContent(item) && (
        <PortalTooltip id={`action-tooltip-2-${instanceId}-${index}`} className="tooltip-gui" positionStrategy="fixed" />
      )}
    </Fragment>
  ));
}

function getTooltipAttributes(content, id) {
  return content
    ? {
        "data-tooltip-id": id,
        "data-tooltip-content": content,
      }
    : {};
}

function getItemTooltipContent(item, itemTooltipContent, primaryTitle, secondaryTitle) {
  const customTooltip = itemTooltipContent ? getTooltipText(itemTooltipContent(item)) : "";
  return uniqueTooltipLines([primaryTitle, secondaryTitle, customTooltip]).join("\n");
}

function uniqueTooltipLines(lines) {
  const seen = new Set();
  return lines
    .flatMap((line) => (line ? line.split("\n") : []))
    .map((line) => line.trim())
    .filter((line) => {
      if (!line || seen.has(line)) return false;
      seen.add(line);
      return true;
    });
}
