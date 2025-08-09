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
  ColorMappingSelect,
} from "../reusableComponents/sidebarComponents.js";
import { colorSchemeCsv } from "../../../demodata/exampleColorSchemeCSV.js";
import { downloadCsvFile } from "../../GraphStuff/download.js";
import { useAppearance } from "../../../states.js";
import log from "../../../logger.js";
import {
  linkWidthDescription,
  nodeLabelDescription,
  setColorSchemeDescription,
  uploadColorSchemeDescription,
} from "../descriptions/appearanceDescriptions.js";
import { linkWidthInit } from "../../initValues/appearanceInitValues.js";

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
        itemTooltipContent={() => "Replace Node/Link Color Scheme"}
        ActionIcon={TrashIcon}
        onActionIconClick={(colorScheme) => handleDeleteColorScheme(colorScheme)}
        actionIconTooltipContent={() => "Delete Color Scheme"}
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

function NodeColorMapping() {
  const { appearance, setAppearance } = useAppearance();

  return (
    <ColorMappingSelect
      heading={"Node Color Mapping"}
      colorScheme={appearance.nodeColorScheme}
      attribsToColorIndices={appearance.nodeAttribsToColorIndices}
      setMapping={(updatedMapping) => setAppearance("nodeAttribsToColorIndices", updatedMapping)}
    />
  );
}

function LinkColorMapping() {
  const { appearance, setAppearance } = useAppearance();

  return (
    <ColorMappingSelect
      heading={"Link Color Mapping"}
      colorScheme={appearance.linkColorScheme}
      attribsToColorIndices={appearance.linkAttribsToColorIndices}
      setMapping={(updatedMapping) => setAppearance("linkAttribsToColorIndices", updatedMapping)}
    />
  );
}
