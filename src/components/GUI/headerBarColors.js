import { ReactComponent as PaletteIcon } from "../../icons/colorPalette.svg";
import { ReactComponent as XIcon } from "../../icons/x.svg";
import { ReactComponent as PaintRollerIcon } from "../../icons/paintRoller.svg";
import { ReactComponent as SwatchBookIcon } from "../../icons/swatchbook.svg";
import { ReactComponent as TrashIcon } from "../../icons/trash.svg";
import React, { useState } from "react";
import { Button, Item, UploadItem } from "./headerBar";
import isEqual from "lodash/isEqual";

export function Colors({
  handleUploadSchemeClick,
  colorSchemeInputRef,
  handleNewScheme,
  nodeColorScheme,
  setNodeColorScheme,
  colorSchemes,
  linkColorScheme,
  setLinkColorScheme,
  handleDeleteColorScheme,
  activeMenu,
  setActiveMenu,
  handleActiveMenuClick,
}) {
  let content = null;

  if (
    activeMenu !== "ManageColorScheme" &&
    activeMenu !== "ChooseColorScheme"
  ) {
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
            onClick={handleUploadSchemeClick}
            onChange={handleNewScheme}
            icon={<PaintRollerIcon />}
            linkRef={colorSchemeInputRef}
          ></UploadItem>
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
          <table className="dropdown no-wrap pad-05 spaced-table-05">
            <thead>
              <tr>
                <th className="left-align heading pad-bottom-05">
                  Color scheme
                </th>
                <th className="left-align heading pad-bottom-05">Node</th>
                <th className="left-align heading pad-bottom-05">Link</th>
                <th className="left-align heading pad-bottom-05">Delete</th>
              </tr>
            </thead>
            <tbody>
              {colorSchemes.map((colorScheme, index) => (
                <tr key={index} className="recent-item-entry">
                  <ColorSchemeTableItem
                    name={colorScheme[0]}
                    isSelected={isEqual(colorScheme[1], nodeColorScheme[1])}
                    isSelected2={isEqual(colorScheme[1], linkColorScheme[1])}
                    onClick={() => setNodeColorScheme(colorScheme)}
                    onClick2={() => setLinkColorScheme(colorScheme)}
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

  return <>{content}</>;
}

export function ColorSchemeTableItem({
  name,
  isSelected,
  isSelected2,
  onClick,
  onClick2,
  handleDeleteColorScheme,
}) {
  return (
    <>
      <td className="text-primary">{name}</td>
      <td>
        <input
          type="radio"
          checked={isSelected}
          onChange={onClick}
          className="radio-button"
        />
      </td>
      <td>
        <input
          type="radio"
          checked={isSelected2}
          onChange={onClick2}
          className="radio-button"
        />
      </td>
      <td>
        <div
          className={"recent-item-logo"}
          onClick={() => handleDeleteColorScheme(name)}
        >
          <TrashIcon />
        </div>
      </td>
    </>
  );
}
