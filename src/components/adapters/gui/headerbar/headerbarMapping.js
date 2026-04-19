import { useColorschemeState } from "../../../adapters/state/colorschemeState.js";
import { fallbackColor, getColor } from "../../../domain/service/canvas_drawing/drawingUtils.js";
import { isAdditionalLinkAttrib } from "../../../domain/service/canvas_drawing/lines.js";
import { TableList } from "../reusable_components/sidebarComponents.js";

export function HeaderbarColorMapping() {
  const { colorschemeState } = useColorschemeState();

  const createTableData = (attribsToColorIndices = {}, colorscheme = [], isStripedAttrib = () => false) => {
    const keys = Object.keys(attribsToColorIndices).sort((a, b) => a.localeCompare(b));
    const entries = keys
      .map((key) => {
        const color = getColor(attribsToColorIndices[key], colorscheme);
        if (color === fallbackColor) return null;
        const swatchClassName = `color-square headerbar-colormapping-swatch${isStripedAttrib(key) ? " headerbar-colormapping-swatch--striped" : ""}`;
        return (
          <span className="headerbar-colormapping-row" key={key}>
            <span className={swatchClassName} style={{ "--headerbar-swatch-color": color, backgroundColor: color }}></span>
            <span className="headerbar-colormapping-label">{key}</span>
          </span>
        );
      })
      .filter(Boolean);

    entries.push(
      <span className="headerbar-colormapping-row" key="fallback-color">
        <span className="color-square headerbar-colormapping-swatch" style={{ "--headerbar-swatch-color": fallbackColor, backgroundColor: fallbackColor }}></span>
        <span className="headerbar-colormapping-label">No Value/Color Available</span>
      </span>,
    );
    return entries;
  };

  const nodeTableData = createTableData(colorschemeState.nodeAttribsToColorIndices, colorschemeState.nodeColorscheme?.data);
  const linkTableData = createTableData(
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
