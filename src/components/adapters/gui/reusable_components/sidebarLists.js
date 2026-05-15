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

  return (
    <div>
      <div className="table-list-heading">{heading}</div>
      <table className={`item-table ${dark && "plain-item-table"}`}>
        <tbody>
          {data && data.length > 0 ? (
            data.map((item, index) => (
              <tr key={`row-${instanceId}-${index}`} className="item-table-entry-highlight">
                <td
                  className="item-table-text"
                  onClick={() => onItemClick && onItemClick(item)}
                  {...(itemTooltipContent && {
                    "data-tooltip-id": `item-tooltip-${instanceId}-${index}`,
                    "data-tooltip-content": itemTooltipContent(item),
                  })}
                >
                  <span className="item-table-primary-text">{displayKey ? item[displayKey] : item}</span>
                  {secondaryKey && item[secondaryKey] && <span className="item-table-secondary-text">{item[secondaryKey]}</span>}
                </td>

                {ActionIcon && (
                  <>
                    {!showActionIconOn || showActionIconOn(item) ? (
                      <td className="item-table-logo">
                        <ActionIcon
                          item={item}
                          key={`action-icon-${instanceId}-${index}`}
                          onClick={() => onActionIconClick && onActionIconClick(item)}
                          {...(actionIconTooltipContent && {
                            "data-tooltip-id": `action-tooltip-${instanceId}-${index}`,
                            "data-tooltip-content": actionIconTooltipContent(item),
                          })}
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
                      {...(actionIcon2TooltipContent && {
                        "data-tooltip-id": `action-tooltip-2-${instanceId}-${index}`,
                        "data-tooltip-content": actionIcon2TooltipContent(item),
                      })}
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

      {data &&
        data.length > 0 &&
        data.map((item, index) => (
          <Fragment key={`tooltip-set-${instanceId}-${index}`}>
            {itemTooltipContent && <PortalTooltip id={`item-tooltip-${instanceId}-${index}`} className="tooltip-gui" positionStrategy="fixed" />}
            {actionIconTooltipContent && (
              <PortalTooltip id={`action-tooltip-${instanceId}-${index}`} className="tooltip-gui" positionStrategy="fixed" />
            )}
            {actionIcon2TooltipContent && (
              <PortalTooltip id={`action-tooltip-2-${instanceId}-${index}`} className="tooltip-gui" positionStrategy="fixed" />
            )}
          </Fragment>
        ))}
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
  const normalizedExpandedId = expandedId === null || expandedId === undefined ? null : expandedId.toString();
  const columnCount = 1 + (ActionIcon ? 1 : 0) + (ActionIcon2 ? 1 : 0);

  return (
    <div>
      <div className="table-list-heading">{heading}</div>
      <table className={`item-table ${dark && "plain-item-table"}`}>
        <tbody>
          {data && data.length > 0 ? (
            data.map((item, index) => {
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
                      {...(itemTooltipContent && {
                        "data-tooltip-id": `item-tooltip-${instanceId}-${index}`,
                        "data-tooltip-content": itemTooltipContent(item),
                      })}
                    >
                      <span className="item-table-text-content">
                        <span className="item-table-primary-text">{displayKey ? item[displayKey] : item}</span>
                        {secondaryKey && item[secondaryKey] && <span className="item-table-secondary-text">{item[secondaryKey]}</span>}
                      </span>
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
                              {...(actionIconTooltipContent && {
                                "data-tooltip-id": `action-tooltip-${instanceId}-${index}`,
                                "data-tooltip-content": actionIconTooltipContent(item),
                              })}
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
                          {...(actionIcon2TooltipContent && {
                            "data-tooltip-id": `action-tooltip-2-${instanceId}-${index}`,
                            "data-tooltip-content": actionIcon2TooltipContent(item),
                          })}
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

      {data &&
        data.length > 0 &&
        data.map((item, index) => (
          <Fragment key={`tooltip-set-${instanceId}-${index}`}>
            {itemTooltipContent && <PortalTooltip id={`item-tooltip-${instanceId}-${index}`} className="tooltip-gui" positionStrategy="fixed" />}
            {actionIconTooltipContent && (
              <PortalTooltip id={`action-tooltip-${instanceId}-${index}`} className="tooltip-gui" positionStrategy="fixed" />
            )}
            {actionIcon2TooltipContent && (
              <PortalTooltip id={`action-tooltip-2-${instanceId}-${index}`} className="tooltip-gui" positionStrategy="fixed" />
            )}
          </Fragment>
        ))}
    </div>
  );
}

export function DetailRow({ label, value }) {
  const isList = Array.isArray(value);

  return (
    <div className={`toggle-list-detail-item toggle-list-detail-row${isList ? " toggle-list-detail-row--multiline" : ""}`}>
      <span className="item-table-primary-text">{label}</span>
      <div className="text-secondary toggle-list-detail-value">
        {isList ? value.map((entry, index) => <div key={`${label}-${index}`}>{entry}</div>) : value}
      </div>
    </div>
  );
}
