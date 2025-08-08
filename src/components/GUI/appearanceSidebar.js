import { useRef, useState, Fragment } from "react";
import { ReactComponent as TrashIcon } from "../../icons/trash.svg";
import {
  SidebarSliderBlock,
  PopUp,
  PopupButtonRect,
  PopUpTextField,
  SidebarButtonRect,
  SidebarSwitchBlock,
} from "./reusableComponents/sidebarComponents.js";
import { ReactComponent as XIcon } from "../../icons/x.svg";
import { colorSchemeCsv } from "../../demodata/exampleColorSchemeCSV.js";
import { downloadCsvFile } from "../GraphStuff/download.js";
import { Tooltip } from "react-tooltip";
import { useAppearance } from "../../states.js";
import log from "../../logger.js";
import { linkWidthDescription } from "./descriptions/appearanceDescriptions.js";
import { linkWidthInit } from "../initValues/appearanceInitValues.js";

export function AppearanceSidebar({ handleNewColorScheme, handleDeleteColorScheme, colorSchemes }) {
  return (
    <>
      <AppearanceSettings />
      <TopAppearanceButtons
        handleNewColorScheme={handleNewColorScheme}
        colorSchemes={colorSchemes}
        handleDeleteColorScheme={handleDeleteColorScheme}
      />
      <ActiveNodeColorScheme />
      <ActiveLinkColorScheme />
      <UploadedColorSchemes colorSchemes={colorSchemes} handleDeleteColorScheme={handleDeleteColorScheme} />
      <div className="pad-left-1 pad-right-1 color-mapping-select-table">
        <NodeColorMapping />
        <LinkColorMapping />
      </div>
    </>
  );
}

export function AppearanceSettings({}) {
  const { appearance, setAppearance } = useAppearance();

  const handleShowNodeLabels = () => {
    setAppearance("showNodeLabels", !appearance.showNodeLabels);
  };

  return (
    <>
      <SidebarSwitchBlock
        text={"Node Labels"}
        value={appearance.showNodeLabels}
        onChange={handleShowNodeLabels}
        infoHeading={"Enabling Node Labels"}
        infoDescription={"Shows the name of each node above itself in the graph."}
      />
      <SidebarSliderBlock
        value={appearance.linkWidth}
        valueText={appearance.linkWidthText}
        setValue={(value) => setAppearance("linkWidth", value)}
        setValueText={(value) => setAppearance("linkWidthText", value)}
        fallbackValue={linkWidthInit}
        min={0.1}
        max={5}
        step={0.1}
        text={"Link width"}
        infoHeading={"Link Width"}
        infoDescription={linkWidthDescription}
      />
    </>
  );
}

export function TopAppearanceButtons({ handleNewColorScheme }) {
  const [colorSchemePopUpActive, setColorSchemePopUpActive] = useState(false);
  const colorSchemeRef = useRef(null);

  let content = null;

  const handleUploadSchemeClick = () => {
    colorSchemeRef.current.click();
  };

  const handleColorSchemePopUp = () => {
    setColorSchemePopUpActive(!colorSchemePopUpActive);
  };

  return (
    <>
      <div className="sidebar-button">
        <SidebarButtonRect
          onClick={handleColorSchemePopUp}
          text={"Upload Color Schemes"}
          tooltip={"Upload your Color Scheme as a CSV or TSV File"}
          tooltipId={"upload-graph-tooltip"}
        />
      </div>
      {colorSchemePopUpActive && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header pad-bottom-1">
              <p className="popup-header-text">Uploading Your Color Scheme</p>
              <span
                className="tooltip-button popup-header-button"
                onClick={() => {
                  setColorSchemePopUpActive(false);
                }}
              >
                <XIcon />
              </span>
            </div>
            <div className="popup-block color-text-primary">
              A color scheme can determine the colors given to both links and nodes. It furthermore determines the order in which the colors are
              distributed.
              <br></br>
              <br></br>
              Color schemes can be uploaded as either CSV or TSV files. The colors should be listed using the HEX-format.
            </div>
            <PopUpTextField textInfront={"Color Scheme format:"} textInside={"Color1, Color2, Color3, ..."} />
            <div className="popup-block" />
            <PopUpTextField textInfront={"Color Scheme example:"} textInside={"#e69f00,#56b4e9,#009e73"} />
            <div className="popup-block">
              <PopupButtonRect
                text={"Download Example Color Scheme"}
                onClick={() => {
                  downloadCsvFile(colorSchemeCsv.content, colorSchemeCsv.name);
                }}
              />
              <PopupButtonRect
                text={"Upload Own Color Scheme"}
                onClick={handleUploadSchemeClick}
                linkRef={colorSchemeRef}
                onChange={(event) => {
                  handleNewColorScheme(event);
                  event.target.value = null; // resetting the value so uploading the same item tice in a row also gets registered
                  setColorSchemePopUpActive(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
      {content}
    </>
  );
}

function UploadedColorSchemes({ colorSchemes, handleDeleteColorScheme }) {
  const { setAppearance } = useAppearance();

  const [selectSchemePopUp, setSelectSchemePopUp] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);

  return (
    <>
      <span className="heading-label">Uploaded Color Schemes</span>
      <table className="recent-item-table">
        <tbody>
          {colorSchemes && (
            <>
              {colorSchemes?.map((colorScheme, index) => (
                <tr key={index} className="recent-item-entry recent-item-entry-highlight">
                  <td
                    onClick={() => {
                      setSelectedScheme(colorScheme);
                      setSelectSchemePopUp(true);
                    }}
                  >
                    <div data-tooltip-id={`change-color-scheme${index}`} data-tooltip-content="Replace Node/Link Color Scheme">
                      <span className="pad-left-025">{colorScheme.name}</span>
                    </div>
                    <Tooltip id={`change-color-scheme${index}`} place="top" effect="solid" className="sidebar-tooltip" />
                  </td>
                  <td className="recent-item-logo sidebar-tooltip-wrapper">
                    <TrashIcon
                      data-tooltip-id={`delete-mapping-tooltip-${index}`}
                      data-tooltip-content="Delete Color Scheme"
                      onClick={() => handleDeleteColorScheme(colorScheme.name)}
                    />
                    <Tooltip id={`delete-mapping-tooltip-${index}`} place="top" effect="solid" className="sidebar-tooltip" />
                  </td>
                </tr>
              ))}
            </>
          )}
          {(!colorSchemes || colorSchemes.length === 0) && (
            <tr className="recent-item-entry">
              <td>
                <span className="pad-left-025">None</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <PopUp
        heading={"Set Color Scheme"}
        description={"Select what the color scheme should be applied to"}
        isOpen={selectSchemePopUp}
        setIsOpen={setSelectSchemePopUp}
      >
        <div className="popup-block">
          <PopupButtonRect onClick={() => setAppearance("nodeColorScheme", selectedScheme)} text={"Set for Nodes"} />
          <PopupButtonRect onClick={() => setAppearance("linkColorScheme", selectedScheme)} text={"Set for Links"} />
        </div>
      </PopUp>
    </>
  );
}

function ActiveNodeColorScheme({}) {
  const { appearance } = useAppearance();

  return (
    <>
      <>
        <span className="heading-label">Active Node Color Scheme</span>
        <table className="active-item-table">
          <tbody>
            {appearance.nodeColorScheme && (
              <tr className="recent-item-entry">
                <td>
                  <span className="pad-left-025">{appearance.nodeColorScheme.name}</span>
                </td>
              </tr>
            )}
            {!appearance.nodeColorScheme && (
              <tr className="recent-item-entry">
                <td>
                  <span className="pad-left-025">None</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </>
    </>
  );
}

function ActiveLinkColorScheme({}) {
  const { appearance } = useAppearance();

  return (
    <>
      <>
        <span className="heading-label">Active Link Color Scheme</span>
        <table className="active-item-table">
          <tbody>
            {appearance.linkColorScheme && (
              <tr className="recent-item-entry">
                <td>
                  <span className="pad-left-025">{appearance.linkColorScheme.name}</span>
                </td>
              </tr>
            )}
            {!appearance.linkColorScheme && (
              <tr className="recent-item-entry">
                <td>
                  <span className="pad-left-025">None</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </>
    </>
  );
}

function NodeColorMapping({}) {
  const { appearance, setAppearance } = useAppearance();

  const handleAttributeChange = (colorIndex, newAttribute) => {
    const updatedMapping = { ...appearance.nodeAttribsToColorIndices };

    // old attribute mapped to selected color
    const oldAttribute = Object.keys(updatedMapping).find((key) => updatedMapping[key] === colorIndex);

    // color previously assigned to new attribute
    const previousColorIndex = updatedMapping[newAttribute];

    updatedMapping[newAttribute] = colorIndex;

    if (oldAttribute) {
      if (previousColorIndex !== undefined) {
        // assign old attribute to previous color
        updatedMapping[oldAttribute] = previousColorIndex;
      } else {
        // first available color without an attribute
        const usedColors = Object.values(updatedMapping);
        const firstAvailableColor = Object.keys(appearance.nodeColorScheme.colorScheme).find((index) => !usedColors.includes(parseInt(index, 10)));

        if (firstAvailableColor !== undefined) {
          updatedMapping[oldAttribute] = parseInt(firstAvailableColor, 10);
        } else {
          delete updatedMapping[oldAttribute];
        }
      }
    }

    setAppearance("nodeAttribsToColorIndices", updatedMapping);
  };

  return (
    <div>
      <span className="heading-label-no-pad pad-bottom-05">Node Color Mapping</span>
      <div className="sidebar-block-no-pad">
        <div className="colormapping-selector">
          {Object.entries(appearance.nodeColorScheme.colorScheme).map(([colorIndex, color]) => (
            <Fragment key={colorIndex}>
              <div
                className="color-square colorscheme-item"
                style={{
                  backgroundColor: color,
                }}
              ></div>
              <select
                className="popup-button-rect-small"
                value={
                  Object.keys(appearance.nodeAttribsToColorIndices).find(
                    (key) => appearance.nodeAttribsToColorIndices[key] === parseInt(colorIndex, 10)
                  ) || ""
                }
                onChange={(event) => handleAttributeChange(parseInt(colorIndex, 10), event.target.value)}
              >
                <option value="">None</option>
                {Object.keys(appearance.nodeAttribsToColorIndices || {}).map((attribute) => (
                  <option key={attribute} value={attribute}>
                    {attribute}
                  </option>
                ))}
              </select>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function LinkColorMapping({}) {
  const { appearance, setAppearance } = useAppearance();

  const handleAttributeChange = (colorIndex, newAttribute) => {
    const updatedMapping = { ...appearance.linkAttribsToColorIndices };

    const oldAttribute = Object.keys(updatedMapping).find((key) => updatedMapping[key] === colorIndex);

    const previousColorIndex = updatedMapping[newAttribute];

    updatedMapping[newAttribute] = colorIndex;

    if (oldAttribute) {
      if (previousColorIndex !== undefined) {
        updatedMapping[oldAttribute] = previousColorIndex;
      } else {
        const usedColors = Object.values(updatedMapping);
        const firstAvailableColor = Object.keys(appearance.linkColorScheme.colorScheme).find((index) => !usedColors.includes(parseInt(index, 10)));

        if (firstAvailableColor !== undefined) {
          updatedMapping[oldAttribute] = parseInt(firstAvailableColor, 10);
        } else {
          delete updatedMapping[oldAttribute];
        }
      }
    }

    setAppearance("linkAttribsToColorIndices", updatedMapping);
  };

  return (
    <div>
      <span className="heading-label-no-pad pad-bottom-05">Link Color Mapping</span>
      <div className="sidebar-block-no-pad">
        <div className="colormapping-selector">
          {Object.entries(appearance.linkColorScheme.colorScheme).map(([colorIndex, color]) => (
            <Fragment key={colorIndex}>
              <div
                className="color-square colorscheme-item"
                style={{
                  backgroundColor: color,
                }}
              ></div>
              <select
                className="popup-button-rect-small"
                value={
                  Object.keys(appearance.linkAttribsToColorIndices).find(
                    (key) => appearance.linkAttribsToColorIndices[key] === parseInt(colorIndex, 10)
                  ) || ""
                }
                onChange={(event) => handleAttributeChange(parseInt(colorIndex, 10), event.target.value)}
              >
                <option value="">None</option>
                {Object.keys(appearance.linkAttribsToColorIndices || {}).map((attribute) => (
                  <option key={attribute} value={attribute}>
                    {attribute}
                  </option>
                ))}
              </select>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
