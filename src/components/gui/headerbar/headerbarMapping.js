import { useColorschemeState } from "../../adapters/state/colorschemeState.js";
import { fallbackColor, getColor } from "../../domain_service/canvas_drawing/draw.js";

export function HeaderbarColorMapping() {
  const { colorschemeState } = useColorschemeState();

  const renderMapping = (attribsToColorIndices, colorscheme) => {
    const content = [];
    for (const key in attribsToColorIndices) {
      const color = getColor(attribsToColorIndices[key], colorscheme);
      if (color !== fallbackColor) {
        content.push(
          <div key={key} className="colorscheme-container">
            <div className="color-square colorscheme-item" style={{ backgroundColor: color }}></div>
            <span className="colorscheme-item">{key}</span>
          </div>
        );
      }
    }
    content.push(
      <div key="fallback" className="colorscheme-container">
        <div className="color-square colorscheme-item" style={{ backgroundColor: fallbackColor }}></div>
        <span className="colorscheme-item">No Value Available</span>
      </div>
    );
    return content;
  };

  const nodeColorMapping = renderMapping(colorschemeState.nodeAttribsToColorIndices, colorschemeState.nodeColorscheme.data);

  const linkColorMapping = renderMapping(colorschemeState.linkAttribsToColorIndices, colorschemeState.linkColorscheme.data);

  return (
    <div className={"dropdown min-width-400 margin-left-20"}>
      <div className="dropdown-section-container pad-top-05">
        <div className="dropdown-section">
          <p className="heading-label-no-pad pad-left-1 margin-0">Nodes</p>
          {nodeColorMapping}
        </div>
        <div className="dropdown-section">
          <p className="heading-label-no-pad pad-left-1 margin-0">Links</p>
          {linkColorMapping}
        </div>
      </div>
    </div>
  );
}
