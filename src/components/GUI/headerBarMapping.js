import { ReactComponent as EyeIcon } from "../../icons/eye.svg";
import { ReactComponent as XIcon } from "../../icons/x.svg";
import { useSettings } from "../../states.js";

import { fallbackColor, getColor } from "../Other/draw.js";

import { Button } from "./headerBar.js";

export function Mapping({ mapping, activeMenu, handleActiveMenuClick, nodeAttribsToColorIndices, linkAttribsToColorIndices }) {
  const { settings, setSettings } = useSettings();
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
    for (const key in nodeAttribsToColorIndices) {
      if (
        nodeAttribsToColorIndices.hasOwnProperty(key) &&
        getColor(nodeAttribsToColorIndices[key], settings.appearance.nodeColorScheme.colorScheme) !== fallbackColor
      ) {
        nodeContent.push(
          <div key={key} className="colorscheme-container">
            <div
              className="color-square colorscheme-item"
              style={{
                backgroundColor: getColor(nodeAttribsToColorIndices[key], settings.appearance.nodeColorScheme.colorScheme),
              }}
            ></div>
            {mapping && mapping.groupMapping && mapping.groupMapping.hasOwnProperty(key) ? (
              <span className="colorscheme-item">{mapping.groupMapping[key].name}</span>
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
    for (const key in linkAttribsToColorIndices) {
      if (
        linkAttribsToColorIndices.hasOwnProperty(key) &&
        getColor(linkAttribsToColorIndices[key], settings.appearance.linkColorScheme.colorScheme) !== fallbackColor
      ) {
        linkContent.push(
          <div key={key} className="colorscheme-container">
            <div
              className="color-square colorscheme-item"
              style={{
                backgroundColor: getColor(linkAttribsToColorIndices[key], settings.appearance.linkColorScheme.colorScheme),
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
        <div className={"dropdown"}>
          <div className="dropdown-section-container pad-top-05">
            <div className="dropdown-section">
              <b className="heading-label">Nodes</b>
              {nodeContent}
            </div>
            <div className="dropdown-section">
              <b className="heading-label">Links</b>
              {linkContent}
            </div>
          </div>
        </div>
      </>
    );
  }

  return <>{content}</>;
}
