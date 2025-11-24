import { useRef, useState } from "react";
import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import trashSvg from "../../../../assets/icons/trash.svg?raw";
import { SwitchBlock, Popup, TableList, SliderBlock, Button, PopupTextField } from "../reusable_components/sidebarComponents.js";
import { colorschemeCsv } from "../../../../assets/exampleColorschemeCSV.js";
import { downloadCsvFile } from "../../../domain/service/download/download.js";
import {
  linkWidthDescription,
  nodeLabelDescription,
  setColorschemeDescription,
  themeDescription,
  uploadColorschemeDescription,
} from "./descriptions/appearanceDescriptions.js";
import { useAppearance, linkWidthInit } from "../../../adapters/state/appearanceState.js";
import { defaultColorschemeNames, useColorschemeState } from "../../../adapters/state/colorschemeState.js";
import { colorschemeService } from "../../../application/services/colorschemeService.js";
import { darkTheme, useTheme } from "../../state/themeState.js";
import { themeService } from "../../../application/services/themeService.js";

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
  const { theme } = useTheme();

  return (
    <>
      <SwitchBlock
        value={theme.name == darkTheme.name}
        setValue={() => themeService.handleChangeTheme()}
        text={"Dark Appearance"}
        infoHeading={"Enabling Dark Appearance"}
        infoDescription={themeDescription}
      />
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
      <div className="block-section">
        <Button
          onClick={() => setColorschemePopupActive(!colorschemePopupActive)}
          text={"Upload Color Scheme"}
          tooltip={"Upload your Color Scheme as a CSV or TSV File"}
          tooltipId={"upload-graph-tooltip"}
        />
      </div>
      <Popup
        heading={"Uploading Your Color Scheme"}
        description={uploadColorschemeDescription}
        isOpen={colorschemePopupActive}
        setIsOpen={setColorschemePopupActive}
      >
        <PopupTextField inline={true} textInfront={"Color Scheme format:"} textInside={"Color1, Color2, Color3, ..."} />
        <PopupTextField inline={true} textInfront={"Color Scheme example:"} textInside={"#e69f00,#56b4e9,#009e73"} />
        <div className="block-section">
          <Button variant="popup" text={"Download Example Color Scheme"} onClick={() => downloadCsvFile(colorschemeCsv.data, colorschemeCsv.name)} />
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
  const { colorschemeState, setColorschemeState } = useColorschemeState();

  return (
    <TableList
      heading={"Active Node Color Scheme"}
      data={colorschemeState.nodeColorscheme ? [colorschemeState.nodeColorscheme] : []}
      displayKey={"name"}
      dark={true}
    />
  );
}

function ActiveLinkColorscheme() {
  const { colorschemeState, setColorschemeState } = useColorschemeState();

  return (
    <TableList
      heading={"Active Link Color Scheme"}
      data={colorschemeState.linkColorscheme ? [colorschemeState.linkColorscheme] : []}
      displayKey={"name"}
      dark={true}
    />
  );
}

function UploadedColorschemes() {
  const { colorschemeState } = useColorschemeState();

  const [selectColorschemePopup, setSelectSchemePopup] = useState(false);
  const [selectedColorschemeName, setSelectedScheme] = useState(null);

  let isDefaultColorscheme = (colorschemeName) => defaultColorschemeNames.includes(colorschemeName);

  return (
    <>
      <TableList
        heading={"Uploaded Color Schemes"}
        data={colorschemeState.uploadedColorschemeNames}
        onItemClick={(colorschemeName) => {
          setSelectedScheme(colorschemeName);
          setSelectSchemePopup(true);
        }}
        itemTooltipContent={() => "Replace Node/Link Color Scheme"}
        ActionIcon={(props) => <SvgIcon svg={trashSvg} {...props} />}
        showActionIconOn={(colorschemeName) => !isDefaultColorscheme(colorschemeName)}
        onActionIconClick={(colorschemeName) => colorschemeService.handleDeleteColorscheme(colorschemeName)}
        actionIconTooltipContent={() => "Delete Color Scheme"}
      />
      <Popup heading={"Set Color Scheme"} description={setColorschemeDescription} isOpen={selectColorschemePopup} setIsOpen={setSelectSchemePopup}>
        <div className="block-section">
          <Button variant="popup" onClick={() => colorschemeService.handleSelectNodeColorscheme(selectedColorschemeName)} text={"Set for Nodes"} />
          <Button variant="popup" onClick={() => colorschemeService.handleSelectLinkColorscheme(selectedColorschemeName)} text={"Set for Links"} />
        </div>
      </Popup>
    </>
  );
}

function ColorSelection() {
  const { colorschemeState, setColorschemeState } = useColorschemeState();

  return (
    <div>
      <ColorMappingSelect
        heading={"Node Color Mapping"}
        colorschemeData={colorschemeState.nodeColorscheme?.data ? colorschemeState.nodeColorscheme.data : []}
        attribsToColorIndices={colorschemeState.nodeAttribsToColorIndices}
        setMapping={(updatedColorMapping) => setColorschemeState("nodeAttribsToColorIndices", updatedColorMapping)}
      />
      <ColorMappingSelect
        heading={"Link Color Mapping"}
        colorschemeData={colorschemeState.linkColorscheme?.data ? colorschemeState.linkColorscheme.data : []}
        attribsToColorIndices={colorschemeState.linkAttribsToColorIndices}
        setMapping={(updatedColorMapping) => setColorschemeState("linkAttribsToColorIndices", updatedColorMapping)}
      />
    </div>
  );
}

export function ColorMappingSelect({ heading, colorschemeData, attribsToColorIndices, setMapping }) {
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
        const firstAvailableColor = Object.keys(colorschemeData)?.find((index) => !usedColors.includes(parseInt(index, 10)));

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
    <>
      <div className="table-list-heading">{heading}</div>
      <div className="colormapping-select-card">
        {colorschemeData.length ? (
          <div className="colormapping-select-list">
            {colorschemeData.map((color, colorIndex) => {
              const currentAttribute = Object.keys(attribsToColorIndices).find((key) => attribsToColorIndices[key] === parseInt(colorIndex, 10));

              return (
                <div className="colormapping-select-row" key={colorIndex}>
                  <div
                    className="color-square colormapping-select-swatch"
                    style={{
                      backgroundColor: color,
                    }}
                  ></div>
                  <select
                    className="colormapping-select-input"
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
                </div>
              );
            })}
          </div>
        ) : (
          <span className="colormapping-select-empty">No colors available. Upload or select a scheme to begin.</span>
        )}
      </div>
    </>
  );
}
