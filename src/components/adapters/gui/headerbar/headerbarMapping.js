import { useColorschemeState } from "../../../adapters/state/colorschemeState.js";
import { fallbackColor, getColor } from "../../../domain/service/canvas_drawing/draw.js";

export function HeaderbarColorMapping() {
  const { colorschemeState } = useColorschemeState();

  const renderItem = (key, color, label) => (
    <div key={key} className="headerbar-colormapping-item">
      <div className="color-square headerbar-colormapping-swatch" style={{ backgroundColor: color }}></div>
      <span className="headerbar-colormapping-label">{label}</span>
    </div>
  );

  const renderMapping = (attribsToColorIndices = {}, colorscheme = []) => {
    const keys = Object.keys(attribsToColorIndices).sort((a, b) => a.localeCompare(b));
    const entries = keys
      .map((key) => {
        const color = getColor(attribsToColorIndices[key], colorscheme);
        return color !== fallbackColor ? renderItem(key, color, key) : null;
      })
      .filter(Boolean);

    entries.push(renderItem("fallback", fallbackColor, "No Value Available"));
    return entries;
  };

  const nodeColorMapping = renderMapping(colorschemeState.nodeAttribsToColorIndices, colorschemeState.nodeColorscheme?.data);

  const linkColorMapping = renderMapping(colorschemeState.linkAttribsToColorIndices, colorschemeState.linkColorscheme?.data);

  return (
    <div className={"headerbar-colormapping"}>
      <div className="colormapping-container">
        <div className="headerbar-colormapping-section">
          <div className="table-list-heading">Nodes</div>
          <div className="headerbar-colormapping-list">{nodeColorMapping}</div>
        </div>
        <div className="headerbar-colormapping-section">
          <div className="table-list-heading">Links</div>
          <div className="headerbar-colormapping-list">{linkColorMapping}</div>
        </div>
      </div>
    </div>
  );
}
