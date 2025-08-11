import { useRef, useState, Fragment } from "react";
import { ReactComponent as TrashIcon } from "../../../icons/trash.svg";
import { SwitchBlock, Popup, TableList, SliderBlock, Button, PopupTextField } from "../reusable_components/sidebarComponents.js";
import { colorSchemeCsv } from "../../assets/exampleColorSchemeCSV.js";
import { downloadCsvFile } from "../../application_service/download.js";
import { useAppearance } from "../../../states.js";
import log from "../../../logger.js";
import {
  linkWidthDescription,
  nodeLabelDescription,
  setColorSchemeDescription,
  uploadColorSchemeDescription,
} from "./descriptions/appearanceDescriptions.js";
import { linkWidthInit } from "../../config/appearanceInitValues.js";

export function AppearanceSidebar({ handleNewColorScheme, handleDeleteColorScheme, handleSelectLinkColorScheme, handleSelectNodeColorScheme }) {
  return (
    <>
      <AppearanceSettings />
      <UploadColorScheme handleNewColorScheme={handleNewColorScheme} handleDeleteColorScheme={handleDeleteColorScheme} />
      <ActiveNodeColorScheme />
      <ActiveLinkColorScheme />
      <UploadedColorSchemes
        handleDeleteColorScheme={handleDeleteColorScheme}
        handleSelectLinkColorScheme={handleSelectLinkColorScheme}
        handleSelectNodeColorScheme={handleSelectNodeColorScheme}
      />
      <ColorSelection />
    </>
  );
}

export function AppearanceSettings() {
  const { appearance, setAppearance } = useAppearance();

  return (
    <>
      <SwitchBlock
        value={appearance.showNodeLabels}
        setValue={() => setAppearance("showNodeLabels", !appearance.showNodeLabels)}
        text={"Node Labels"}
        infoHeading={"Enabling Node Labels"}
        infoDescription={nodeLabelDescription}
      />
      <SliderBlock
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

export function UploadColorScheme({ handleNewColorScheme }) {
  const [colorSchemePopupActive, setColorSchemePopupActive] = useState(false);
  const colorSchemeRef = useRef(null);

  return (
    <>
      <Button
        onClick={() => setColorSchemePopupActive(!colorSchemePopupActive)}
        text={"Upload Color Scheme"}
        tooltip={"Upload your Color Scheme as a CSV or TSV File"}
        tooltipId={"upload-graph-tooltip"}
      />
      <Popup
        heading={"Uploading Your Color Scheme"}
        description={uploadColorSchemeDescription}
        isOpen={colorSchemePopupActive}
        setIsOpen={setColorSchemePopupActive}
      >
        <PopupTextField inline={true} textInfront={"Color Scheme format:"} textInside={"Color1, Color2, Color3, ..."} />
        <PopupTextField inline={true} textInfront={"Color Scheme example:"} textInside={"#e69f00,#56b4e9,#009e73"} />
        <div className="popup-block">
          <Button
            variant="popup"
            text={"Download Example Color Scheme"}
            onClick={() => downloadCsvFile(colorSchemeCsv.content, colorSchemeCsv.name)}
          />
          <Button
            variant="popup"
            text={"Upload Own Color Scheme"}
            onClick={() => colorSchemeRef.current.click()}
            linkRef={colorSchemeRef}
            onChange={(event) => {
              handleNewColorScheme(event);
              event.target.value = null; // resetting the value so uploading the same item tice in a row also gets registered
              setColorSchemePopupActive(false);
            }}
          />
        </div>
      </Popup>
    </>
  );
}

function ActiveNodeColorScheme() {
  const { appearance } = useAppearance();

  return (
    <TableList
      heading={"Active Node Color Scheme"}
      data={appearance.nodeColorScheme ? [appearance.nodeColorScheme] : []}
      displayKey={"name"}
      dark={true}
    />
  );
}

function ActiveLinkColorScheme() {
  const { appearance } = useAppearance();

  return (
    <TableList
      heading={"Active Link Color Scheme"}
      data={appearance.linkColorScheme ? [appearance.linkColorScheme] : []}
      displayKey={"name"}
      dark={true}
    />
  );
}

function UploadedColorSchemes({ handleDeleteColorScheme, handleSelectLinkColorScheme, handleSelectNodeColorScheme }) {
  const { appearance, setAppearance } = useAppearance();

  const [selectColorSchemePopup, setSelectSchemePopup] = useState(false);
  const [selectedColorSchemeName, setSelectedScheme] = useState(null);

  return (
    <>
      <TableList
        heading={"Uploaded Color Schemes"}
        data={appearance.uploadedColorSchemeNames}
        onItemClick={(colorSchemeName) => {
          setSelectedScheme(colorSchemeName);
          setSelectSchemePopup(true);
        }}
        itemTooltipContent={() => "Replace Node/Link Color Scheme"}
        ActionIcon={TrashIcon}
        onActionIconClick={(colorSchemeName) => handleDeleteColorScheme(colorSchemeName)}
        actionIconTooltipContent={() => "Delete Color Scheme"}
      />
      <Popup heading={"Set Color Scheme"} description={setColorSchemeDescription} isOpen={selectColorSchemePopup} setIsOpen={setSelectSchemePopup}>
        <div className="popup-block">
          <Button variant="popup" onClick={() => handleSelectNodeColorScheme(selectedColorSchemeName)} text={"Set for Nodes"} />
          <Button variant="popup" onClick={() => handleSelectLinkColorScheme(selectedColorSchemeName)} text={"Set for Links"} />
        </div>
      </Popup>
    </>
  );
}

function ColorSelection() {
  const { appearance, setAppearance } = useAppearance();

  return (
    <div className="pad-left-1 pad-right-1 color-mapping-select-table">
      <ColorMappingSelect
        heading={"Node Color Mapping"}
        colorScheme={appearance.nodeColorScheme}
        attribsToColorIndices={appearance.nodeAttribsToColorIndices}
        setMapping={(updatedMapping) => setAppearance("nodeAttribsToColorIndices", updatedMapping)}
      />
      <ColorMappingSelect
        heading={"Link Color Mapping"}
        colorScheme={appearance.linkColorScheme}
        attribsToColorIndices={appearance.linkAttribsToColorIndices}
        setMapping={(updatedMapping) => setAppearance("linkAttribsToColorIndices", updatedMapping)}
      />
    </div>
  );
}

export function ColorMappingSelect({ heading, colorScheme, attribsToColorIndices, setMapping }) {
  const handleColorChange = (colorIndex, newAttribute) => {
    const updatedMapping = { ...attribsToColorIndices };

    const oldAttribute = Object.keys(updatedMapping).find((key) => updatedMapping[key] === colorIndex);

    const previousColorIndex = updatedMapping[newAttribute];

    updatedMapping[newAttribute] = colorIndex;

    if (oldAttribute) {
      if (previousColorIndex !== undefined) {
        updatedMapping[oldAttribute] = previousColorIndex;
      } else {
        const usedColors = Object.values(updatedMapping);
        const firstAvailableColor = Object.keys(colorScheme.content).find((index) => !usedColors.includes(parseInt(index, 10)));

        if (firstAvailableColor !== undefined) {
          updatedMapping[oldAttribute] = parseInt(firstAvailableColor, 10);
        } else {
          delete updatedMapping[oldAttribute];
        }
      }
    }

    setMapping(updatedMapping);
  };

  return (
    <div>
      <span className="heading-label-no-pad pad-bottom-05">{heading}</span>
      <div className="sidebar-block-no-pad">
        <div className="colormapping-selector">
          {Object.entries(colorScheme.content).map(([colorIndex, color]) => {
            const currentAttribute = Object.keys(attribsToColorIndices).find((key) => attribsToColorIndices[key] === parseInt(colorIndex, 10));

            return (
              <Fragment key={colorIndex}>
                <div
                  className="color-square colorscheme-item"
                  style={{
                    backgroundColor: color,
                  }}
                ></div>
                <select
                  className="popup-button-rect-small"
                  value={currentAttribute || ""}
                  onChange={(event) => handleColorChange(parseInt(colorIndex, 10), event.target.value)}
                >
                  {!currentAttribute && <option value="">None</option>}

                  {Object.keys(attribsToColorIndices || {}).map((attribute) => (
                    <option key={attribute} value={attribute}>
                      {attribute}
                    </option>
                  ))}
                </select>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
