import { useColorschemeState } from "../../../adapters/state/colorschemeState.js";
import { fallbackColor, getColor } from "../../../domain/service/canvas_drawing/draw.js";

export function HeaderbarColorMapping() {
  const { colorschemeState } = useColorschemeState();

  const renderMapping = (attribsToColorIndices, colorscheme) => {
    const content = [];
    for (const key in attribsToColorIndices) {
      const color = getColor(attribsToColorIndices[key], colorscheme);
      if (color !== fallbackColor) {
        content.push(
          <div key={key} className="colormapping-item">
            <div className="color-square" style={{ backgroundColor: color }}></div>
            <span>{key}</span>
          </div>
        );
      }
    }
    content.push(
      <div key="fallback" className="colormapping-item">
        <div className="color-square" style={{ backgroundColor: fallbackColor }}></div>
        <span>No Value Available</span>
      </div>
    );
    return content;
  };

  const nodeColorMapping = renderMapping(colorschemeState.nodeAttribsToColorIndices, colorschemeState.nodeColorscheme.data);

  const linkColorMapping = renderMapping(colorschemeState.linkAttribsToColorIndices, colorschemeState.linkColorscheme.data);

  return (
    <div className={"headerbar-colormapping"}>
      <div className="colormapping-container">
        <div>
          <span className="heading">Nodes</span>
          {nodeColorMapping}
        </div>
        <div>
          <span className="heading">Links</span>
          {linkColorMapping}
        </div>
      </div>
    </div>
  );
}
