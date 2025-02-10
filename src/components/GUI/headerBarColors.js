import { ReactComponent as PaletteIcon } from "../../icons/colorPalette.svg";
import { ReactComponent as XIcon } from "../../icons/x.svg";
import { ReactComponent as PaintRollerIcon } from "../../icons/paintRoller.svg";
import { ReactComponent as SwatchBookIcon } from "../../icons/swatchbook.svg";
import { ReactComponent as TrashIcon } from "../../icons/trash.svg";
import React, { useEffect, useRef, useState } from "react";
import isEqual from "lodash/isEqual.js";

import { Button, Item, UploadItem } from "./headerBar.js";
import { useSettings } from "../../states.js";
import { log } from "loglevel";
import { PopupButtonRect, PopUpTextField } from "./sidebar.js";
import { downloadCsvFile } from "../GraphStuff/download.js";
import { colorSchemeCsv } from "../../demodata/exampleColorSchemeCSV.js";

export function Colors({ handleNewScheme, colorSchemes, handleDeleteColorScheme, activeMenu, handleActiveMenuClick }) {
  const { settings, setSettings } = useSettings();

  const [colorSchemePopoUpActive, setColorSchemePopUpActive] = useState(false);

  const colorSchemeRef = useRef(null);

  let content = null;

  const handleUploadSchemeClick = () => {
    colorSchemeRef.current.click();
  };

  if (activeMenu !== "ManageColorScheme" && activeMenu !== "ChooseColorScheme") {
    content = (
      <Button
        className="button"
        innerClass={"icon-button"}
        onClick={() => handleActiveMenuClick("ManageColorScheme")}
        icon={<PaletteIcon />}
        tooltip={"Manage Color Scheme"}
        tooltipId={"manage-color-scheme-tooltip"}
      />
    );
  } else if (activeMenu === "ManageColorScheme") {
    content = (
      <>
        <Button
          className="button"
          innerClass={"icon-button"}
          onClick={() => handleActiveMenuClick("ManageColorScheme")}
          icon={<XIcon />}
          tooltip={"Close"}
          tooltipId={"close-manage-color-scheme-tooltip"}
        />
        <div className="dropdown">
          <UploadItem
            text={"Upload color scheme"}
            onClick={() => {
              setColorSchemePopUpActive(!colorSchemePopoUpActive);
              handleActiveMenuClick("None");
            }}
            icon={<PaintRollerIcon />}
          />
          <Item
            text={"Choose color scheme"}
            onClick={() => {
              handleActiveMenuClick("ChooseColorScheme");
            }}
            icon={<SwatchBookIcon />}
          />
        </div>
      </>
    );
  } else if (activeMenu === "ChooseColorScheme") {
    {
      content = (
        <>
          <Button
            className="button"
            innerClass={"icon-button"}
            onClick={() => handleActiveMenuClick("Main")}
            icon={<XIcon />}
            tooltip={"Close"}
            tooltipId={"close-select-color-scheme-tooltip"}
          />
          <table className="dropdown no-wrap pad-top-025 pad-bottom-025 spaced-table-05">
            <thead>
              <tr>
                <th className="left-align heading">Color scheme</th>
                <th className="left-align heading">Node</th>
                <th className="left-align heading">Link</th>
              </tr>
            </thead>
            <tbody>
              {colorSchemes.map((colorScheme, index) => (
                <tr key={index} className="colorscheme-entry">
                  <ColorSchemeTableItem
                    name={colorScheme.name}
                    isSelected={isEqual(colorScheme.colorScheme, settings.appearance.nodeColorScheme.colorScheme)}
                    isSelected2={isEqual(colorScheme.colorScheme, settings.appearance.linkColorScheme.colorScheme)}
                    onClick={() => setSettings("appearance.nodeColorScheme", colorScheme)}
                    onClick2={() => setSettings("appearance.linkColorScheme", colorScheme)}
                    handleDeleteColorScheme={handleDeleteColorScheme}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </>
      );
    }
  }

  return (
    <>
      {colorSchemePopoUpActive && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header pad-bottom-1">
              <b>Uploading Your Color Scheme</b>
              <span
                className="tooltip-button"
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
                  handleNewScheme(event);
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

export function ColorSchemeTableItem({ name, isSelected, isSelected2, onClick, onClick2, handleDeleteColorScheme }) {
  return (
    <>
      <td className="text-primary">{name}</td>
      <td>
        <input type="radio" checked={isSelected} onChange={onClick} className="radio-button" />
      </td>
      <td>
        <input type="radio" checked={isSelected2} onChange={onClick2} className="radio-button" />
      </td>
      <td>
        <div className="colorscheme-logo-container" onClick={() => handleDeleteColorScheme(name)}>
          <TrashIcon className={"colorscheme-logo"} />
        </div>
      </td>
    </>
  );
}
