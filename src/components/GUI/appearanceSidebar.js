import { useRef, useState, Fragment } from "react";
import { ReactComponent as TrashIcon } from "../../icons/trash.svg";
import {
  SidebarSliderBlock,
  PopUpTextFieldInline,
  SidebarSwitchBlock,
  SidebarButtonRect,
  PopupButtonRect,
  PopUp,
  TableList,
} from "./reusableComponents/sidebarComponents.js";
import { colorSchemeCsv } from "../../demodata/exampleColorSchemeCSV.js";
import { downloadCsvFile } from "../GraphStuff/download.js";
import { Tooltip } from "react-tooltip";
import { useAppearance } from "../../states.js";
import log from "../../logger.js";
import {
  linkWidthDescription,
  nodeLabelDescription,
  setColorSchemeDescription,
  uploadColorSchemeDescription,
} from "./descriptions/appearanceDescriptions.js";
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

export function AppearanceSettings() {
  const { appearance, setAppearance } = useAppearance();

  return (
    <>
      <SidebarSwitchBlock
        value={appearance.showNodeLabels}
        setValue={() => setAppearance("showNodeLabels", !appearance.showNodeLabels)}
        text={"Node Labels"}
        infoHeading={"Enabling Node Labels"}
        infoDescription={nodeLabelDescription}
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

  return (
    <>
      <SidebarButtonRect
        onClick={() => setColorSchemePopUpActive(!colorSchemePopUpActive)}
        text={"Upload Color Schemes"}
        tooltip={"Upload your Color Scheme as a CSV or TSV File"}
        tooltipId={"upload-graph-tooltip"}
      />
      <PopUp
        heading={"Uploading Your Color Scheme"}
        description={uploadColorSchemeDescription}
        isOpen={colorSchemePopUpActive}
        setIsOpen={setColorSchemePopUpActive}
      >
        <PopUpTextFieldInline textInfront={"Color Scheme format:"} textInside={"Color1, Color2, Color3, ..."} />
        <PopUpTextFieldInline textInfront={"Color Scheme example:"} textInside={"#e69f00,#56b4e9,#009e73"} />
        <div className="popup-block">
          <PopupButtonRect text={"Download Example Color Scheme"} onClick={() => downloadCsvFile(colorSchemeCsv.content, colorSchemeCsv.name)} />
          <PopupButtonRect
            text={"Upload Own Color Scheme"}
            onClick={() => colorSchemeRef.current.click()}
            linkRef={colorSchemeRef}
            onChange={(event) => {
              handleNewColorScheme(event);
              event.target.value = null; // resetting the value so uploading the same item tice in a row also gets registered
              setColorSchemePopUpActive(false);
            }}
          />
        </div>
      </PopUp>
    </>
  );
}

function UploadedColorSchemes({ colorSchemes, handleDeleteColorScheme }) {
  const { setAppearance } = useAppearance();

  const [selectSchemePopUp, setSelectSchemePopUp] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);

  return (
    <>
      <TableList
        heading={"Upload Color Schemes"}
        data={colorSchemes}
        displayKey={"name"}
        onItemClick={(colorScheme) => {
          setSelectedScheme(colorScheme);
          setSelectSchemePopUp(true);
        }}
        ActionIcon={TrashIcon}
        onActionIconClick={(colorScheme) => handleDeleteColorScheme(colorScheme)}
        itemTooltipContent={(item) => "Replace Node/Link Color Scheme"}
        actionIconTooltipContent={(item) => "Delete Color Scheme"}
      />
      <PopUp heading={"Set Color Scheme"} description={setColorSchemeDescription} isOpen={selectSchemePopUp} setIsOpen={setSelectSchemePopUp}>
        <div className="popup-block">
          <PopupButtonRect onClick={() => setAppearance("nodeColorScheme", selectedScheme)} text={"Set for Nodes"} />
          <PopupButtonRect onClick={() => setAppearance("linkColorScheme", selectedScheme)} text={"Set for Links"} />
        </div>
      </PopUp>
    </>
  );
}

function ActiveNodeColorScheme() {
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

function ActiveLinkColorScheme() {
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

function NodeColorMapping() {
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

function LinkColorMapping() {
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
