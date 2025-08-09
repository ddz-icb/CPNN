import { ReactComponent as EyeIcon } from "../../../icons/eye.svg";
import { ReactComponent as XIcon } from "../../../icons/x.svg";
import { useAppearance, useGraphData } from "../../../states.js";

import { fallbackColor, getColor } from "../../other/draw.js";
import { Button } from "../reusable_components/headerBarComponents.js";

export function Mapping({ activeMenu, handleActiveMenuClick }) {
  const { appearance } = useAppearance();
  const { graphData } = useGraphData();

  let content = null;

  if (activeMenu !== "Mapping") {
    content = (
      <Button
        className="button"
        innerClass={"icon-button"}
        onClick={() => handleActiveMenuClick("Mapping")}
        icon={<EyeIcon />}
        tooltip={"View Mapping"}
        tooltipId={"view-mapping-tooltip"}
      />
    );
  } else if (activeMenu === "Mapping") {
    let nodeContent = [];
    for (const key in appearance.nodeAttribsToColorIndices) {
      if (
        appearance.nodeAttribsToColorIndices.hasOwnProperty(key) &&
        getColor(appearance.nodeAttribsToColorIndices[key], appearance.nodeColorScheme.colorScheme) !== fallbackColor
      ) {
        nodeContent.push(
          <div key={key} className="colorscheme-container">
            <div
              className="color-square colorscheme-item"
              style={{
                backgroundColor: getColor(appearance.nodeAttribsToColorIndices[key], appearance.nodeColorScheme.colorScheme),
              }}
            ></div>
            {graphData.activeAnnotationMapping &&
            graphData.activeAnnotationMapping.groupMapping &&
            graphData.activeAnnotationMapping.groupMapping.hasOwnProperty(key) ? (
              <span className="colorscheme-item">{graphData.activeAnnotationMapping.groupMapping[key].name}</span>
            ) : (
              <span className="colorscheme-item">{key}</span>
            )}
          </div>
        );
      }
    }
    nodeContent.push(
      <div key="invalid-group" className="colorscheme-container">
        <div
          className="color-square colorscheme-item"
          style={{
            backgroundColor: fallbackColor,
          }}
        ></div>
        <span className="colorscheme-item">No Value Available</span>
      </div>
    );

    let linkContent = [];
    for (const key in appearance.linkAttribsToColorIndices) {
      if (
        appearance.linkAttribsToColorIndices.hasOwnProperty(key) &&
        getColor(appearance.linkAttribsToColorIndices[key], appearance.linkColorScheme.colorScheme) !== fallbackColor
      ) {
        linkContent.push(
          <div key={key} className="colorscheme-container">
            <div
              className="color-square colorscheme-item"
              style={{
                backgroundColor: getColor(appearance.linkAttribsToColorIndices[key], appearance.linkColorScheme.colorScheme),
              }}
            ></div>
            <span className="colorscheme-item">{key}</span>
          </div>
        );
      }
    }
    linkContent.push(
      <div key="invalid-attrib" className="colorscheme-container">
        <div
          className="color-square colorscheme-item"
          style={{
            backgroundColor: fallbackColor,
          }}
        ></div>
        <span className="colorscheme-item">No Value Available</span>
      </div>
    );

    content = (
      <>
        <Button
          className="button"
          innerClass={"icon-button"}
          onClick={() => handleActiveMenuClick("Mapping")}
          icon={<XIcon />}
          tooltip={"Close"}
          tooltipId={"close-view-mapping-tooltip"}
        />
        <div className={"dropdown min-width-400 margin-left-20"}>
          <div className="dropdown-section-container pad-top-05">
            <div className="dropdown-section">
              <p className="heading-label-no-pad pad-left-1 margin-0">Nodes</p>
              {nodeContent}
            </div>
            <div className="dropdown-section">
              <p className="heading-label-no-pad pad-left-1 margin-0">Links</p>
              {linkContent}
            </div>
          </div>
        </div>
      </>
    );
  }

  return <>{content}</>;
}
