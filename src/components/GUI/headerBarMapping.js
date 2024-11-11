import { ReactComponent as EyeIcon } from "../../icons/eye.svg";
import { ReactComponent as XIcon } from "../../icons/x.svg";

import { fallbackColor, getColor } from "../Other/draw";

import { Button } from "./headerBar";

export function Mapping({
  nodeColorScheme,
  linkColorScheme,
  mapping,
  activeMenu,
  setActiveMenu,
  handleActiveMenuClick,
  groupToColorIndex,
  attribToColorIndex,
}) {
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
    for (const key in groupToColorIndex) {
      if (groupToColorIndex.hasOwnProperty(key) && getColor(groupToColorIndex[key], nodeColorScheme[1]) !== fallbackColor) {
        nodeContent.push(
          <div key={key} className="colorscheme-container">
            <div
              className="color-square colorscheme-item"
              style={{
                backgroundColor: getColor(groupToColorIndex[key], nodeColorScheme[1]),
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
    for (const key in attribToColorIndex) {
      if (attribToColorIndex.hasOwnProperty(key) && getColor(attribToColorIndex[key], linkColorScheme[1]) !== fallbackColor) {
        linkContent.push(
          <div key={key} className="colorscheme-container">
            <div
              className="color-square colorscheme-item"
              style={{
                backgroundColor: getColor(attribToColorIndex[key], linkColorScheme[1]),
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
