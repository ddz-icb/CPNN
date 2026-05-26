import { Fragment } from "react";
import { useColorschemeState } from "../../../adapters/state/colorschemeState.js";
import { fallbackColor, getColor } from "../../../domain/service/canvas_drawing/drawingUtils.js";
import { isAdditionalLinkAttrib } from "../../../domain/service/enrichment/additionalLinkEnrichment.js";
import { TableList } from "../reusable_components/sidebarComponents.js";
import { PortalTooltip } from "../reusable_components/tooltipComponents.js";

export function HeaderbarColorMapping() {
  const { colorschemeState } = useColorschemeState();

  const createTableData = (sectionKey, attribsToColorIndices = {}, colorscheme = [], isStripedAttrib = () => false) => {
    const keys = Object.keys(attribsToColorIndices).sort((a, b) => a.localeCompare(b));
    const entries = keys
      .map((key, index) => {
        const color = getColor(attribsToColorIndices[key], colorscheme);
        if (color === fallbackColor) return null;
        const swatchClassName = `color-square headerbar-colormapping-swatch${isStripedAttrib(key) ? " headerbar-colormapping-swatch--striped" : ""}`;
        const tooltipId = `headerbar-colormapping-${sectionKey}-${index}`;
        return (
          <Fragment key={key}>
            <span
              className="headerbar-colormapping-row"
              title={key}
              data-tooltip-id={tooltipId}
              data-tooltip-content={key}
            >
              <span className={swatchClassName} style={{ "--headerbar-swatch-color": color, backgroundColor: color }}></span>
              <span className="headerbar-colormapping-label">{key}</span>
            </span>
            <PortalTooltip id={tooltipId} className="tooltip-gui" positionStrategy="fixed" />
          </Fragment>
        );
      })
      .filter(Boolean);

    const fallbackTooltipId = `headerbar-colormapping-${sectionKey}-fallback`;
    const fallbackLabel = "No Value/Color Available";
    entries.push(
      <Fragment key="fallback-color">
        <span
          className="headerbar-colormapping-row"
          title={fallbackLabel}
          data-tooltip-id={fallbackTooltipId}
          data-tooltip-content={fallbackLabel}
        >
          <span className="color-square headerbar-colormapping-swatch" style={{ "--headerbar-swatch-color": fallbackColor, backgroundColor: fallbackColor }}></span>
          <span className="headerbar-colormapping-label">{fallbackLabel}</span>
        </span>
        <PortalTooltip id={fallbackTooltipId} className="tooltip-gui" positionStrategy="fixed" />
      </Fragment>,
    );
    return entries;
  };

  const nodeTableData = createTableData("nodes", colorschemeState.nodeAttribsToColorIndices, colorschemeState.nodeColorscheme?.data);
  const linkTableData = createTableData(
    "links",
    colorschemeState.linkAttribsToColorIndices,
    colorschemeState.linkColorscheme?.data,
    (attrib) => isAdditionalLinkAttrib(attrib),
  );

  return (
    <div className={"headerbar-colormapping"}>
      <div className="colormapping-container">
        <div className="headerbar-colormapping-section">
          <TableList heading={"Nodes"} data={nodeTableData} displayKey={null} dark={true} />
        </div>
        <div className="headerbar-colormapping-section">
          <TableList heading={"Links"} data={linkTableData} displayKey={null} dark={true} />
        </div>
      </div>
    </div>
  );
}
