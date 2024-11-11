import { ReactComponent as PictureIcon } from "../../icons/picture.svg";
import { ReactComponent as FileIcon } from "../../icons/file.svg";
import { ReactComponent as DownloadIcon } from "../../icons/download.svg";
import { ReactComponent as XIcon } from "../../icons/x.svg";
import React, { useState } from "react";

import { Button, Item } from "./headerBar";

export function DropDownExport({
  handleDownloadJSONClick,
  handleDownloadPNGClick,
  handleDownloadSVGClick,
  activeMenu,
  setActiveMenu,
  handleActiveMenuClick,
}) {
  let content = null;

  if (activeMenu !== "Export") {
    content = (
      <Button
        className="button"
        innerClass={"icon-button"}
        onClick={() => handleActiveMenuClick("Export")}
        icon={<DownloadIcon />}
        tooltip={"Export Graph"}
        tooltipId={"export-graph-tooltip"}
      />
    );
  } else if (activeMenu === "Export") {
    content = (
      <>
        <Button
          className="button"
          innerClass={"icon-button"}
          onClick={() => handleActiveMenuClick("Export")}
          icon={<XIcon />}
          tooltip={"Close"}
          tooltipId={"close-export-graph-tooltip"}
        />
        <div className="dropdown">
          <Item
            text={"Export as JSON"}
            onClick={() => {
              handleDownloadJSONClick();
              handleActiveMenuClick("Export");
            }}
            icon={<FileIcon />}
          />
          <Item
            text={"Export as PNG"}
            onClick={() => {
              handleDownloadPNGClick();
              handleActiveMenuClick("Export");
            }}
            icon={<PictureIcon />}
          />
          <Item
            text={"Export as SVG"}
            onClick={() => {
              handleDownloadSVGClick();
              handleActiveMenuClick("Export");
            }}
            icon={<PictureIcon />}
          />
        </div>
      </>
    );
  }

  return <>{content}</>;
}
