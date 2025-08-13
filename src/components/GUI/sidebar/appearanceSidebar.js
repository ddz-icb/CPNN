import { useRef, useState, Fragment } from "react";
import { ReactComponent as TrashIcon } from "../../../icons/trash.svg";
import { SwitchBlock, Popup, TableList, SliderBlock, Button, PopupTextField } from "../reusable_components/sidebarComponents.js";
import { colorschemeCsv } from "../../assets/exampleColorschemeCSV.js";
import { downloadCsvFile } from "../../application_service/download.js";
import log from "../../../logger.js";
import {
  linkWidthDescription,
  nodeLabelDescription,
  setColorschemeDescription,
  uploadColorschemeDescription,
} from "./descriptions/appearanceDescriptions.js";
import { useAppearance, linkWidthInit } from "../../adapters/state/appearanceState.js";
import { useColorscheme } from "../../adapters/state/colorschemeState.js";
import { colorschemeService } from "../../application_service/colorschemeService.js";

export function AppearanceSidebar() {
  return (
    <>
      <AppearanceSettings />
      <UploadColorscheme />
      <ActiveNodeColorscheme />
      <ActiveLinkColorscheme />
      <UploadedColorschemes />
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

export function UploadColorscheme() {
  const [colorschemePopupActive, setColorschemePopupActive] = useState(false);
  const colorschemeRef = useRef(null);

  return (
    <>
      <Button
        onClick={() => setColorschemePopupActive(!colorschemePopupActive)}
        text={"Upload Color Scheme"}
        tooltip={"Upload your Color Scheme as a CSV or TSV File"}
        tooltipId={"upload-graph-tooltip"}
      />
      <Popup
        heading={"Uploading Your Color Scheme"}
        description={uploadColorschemeDescription}
        isOpen={colorschemePopupActive}
        setIsOpen={setColorschemePopupActive}
      >
        <PopupTextField inline={true} textInfront={"Color Scheme format:"} textInside={"Color1, Color2, Color3, ..."} />
        <PopupTextField inline={true} textInfront={"Color Scheme example:"} textInside={"#e69f00,#56b4e9,#009e73"} />
        <div className="popup-block">
          <Button variant="popup" text={"Download Example Color Scheme"} onClick={() => downloadCsvFile(colorschemeCsv, colorschemeCsv.name)} />
          <Button
            variant="popup"
            text={"Upload Own Color Scheme"}
            onClick={() => colorschemeRef.current.click()}
            linkRef={colorschemeRef}
            onChange={(event) => {
              colorschemeService.handleCreateColorscheme(event);
              event.target.value = null; // resetting the value so uploading the same item tice in a row also gets registered
              setColorschemePopupActive(false);
            }}
          />
        </div>
      </Popup>
    </>
  );
}

function ActiveNodeColorscheme() {
  const { colorscheme } = useColorscheme();

  return (
    <TableList
      heading={"Active Node Color Scheme"}
      data={colorscheme.nodeColorscheme ? [colorscheme.nodeColorscheme] : []}
      displayKey={"name"}
      dark={true}
    />
  );
}

function ActiveLinkColorscheme() {
  const { colorscheme } = useColorscheme();

  return (
    <TableList
      heading={"Active Link Color Scheme"}
      data={colorscheme.linkColorscheme ? [colorscheme.linkColorscheme] : []}
      displayKey={"name"}
      dark={true}
    />
  );
}

function UploadedColorschemes() {
  const { colorscheme, setColorscheme } = useColorscheme();

  const [selectColorschemePopup, setSelectSchemePopup] = useState(false);
  const [selectedColorschemeName, setSelectedScheme] = useState(null);

  return (
    <>
      <TableList
        heading={"Uploaded Color Schemes"}
        data={colorscheme.uploadedColorschemeNames}
        onItemClick={(colorschemeName) => {
          setSelectedScheme(colorschemeName);
          setSelectSchemePopup(true);
        }}
        itemTooltipContent={() => "Replace Node/Link Color Scheme"}
        ActionIcon={TrashIcon}
        onActionIconClick={(colorschemeName) => colorschemeService.handleDeleteColorscheme(colorschemeName)}
        actionIconTooltipContent={() => "Delete Color Scheme"}
      />
      <Popup heading={"Set Color Scheme"} description={setColorschemeDescription} isOpen={selectColorschemePopup} setIsOpen={setSelectSchemePopup}>
        <div className="popup-block">
          <Button variant="popup" onClick={() => colorschemeService.handleSelectNodeColorscheme(selectedColorschemeName)} text={"Set for Nodes"} />
          <Button variant="popup" onClick={() => colorschemeService.handleSelectLinkColorscheme(selectedColorschemeName)} text={"Set for Links"} />
        </div>
      </Popup>
    </>
  );
}

function ColorSelection() {
  const { colorscheme, setColorscheme } = useColorscheme();

  return (
    <div className="pad-left-1 pad-right-1 color-mapping-select-table">
      <ColorMappingSelect
        heading={"Node Color Mapping"}
        colorscheme={colorscheme.nodeColorscheme.data}
        attribsToColorIndices={colorscheme.nodeAttribsToColorIndices}
        setMapping={(updatedColorMapping) => setColorscheme("nodeAttribsToColorIndices", updatedColorMapping)}
      />
      <ColorMappingSelect
        heading={"Link Color Mapping"}
        colorscheme={colorscheme.linkColorscheme.data}
        attribsToColorIndices={colorscheme.linkAttribsToColorIndices}
        setMapping={(updatedColorMapping) => setColorscheme("linkAttribsToColorIndices", updatedColorMapping)}
      />
    </div>
  );
}

export function ColorMappingSelect({ heading, colorscheme, attribsToColorIndices, setMapping }) {
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
        const firstAvailableColor = Object.keys(colorscheme)?.find((index) => !usedColors.includes(parseInt(index, 10)));

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
          {Object.entries(colorscheme).map(([colorIndex, color]) => {
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
