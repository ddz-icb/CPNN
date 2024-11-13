import { ReactComponent as PictureIcon } from "../../icons/picture.svg";
import { ReactComponent as FileIcon } from "../../icons/file.svg";
import { ReactComponent as DownloadIcon } from "../../icons/download.svg";
import { ReactComponent as XIcon } from "../../icons/x.svg";
import React, { useState } from "react";

import { Button, Item } from "./headerBar.js";

export function HeaderBarExport({ download, setDownload, activeMenu, setActiveMenu, handleActiveMenuClick }) {
  let content = null;

  const handleDownloadJsonClick = () => {
    setDownload((prev) => ({ ...prev, downloadJson: !download.downloadJson }));
  };

  const handleDownloadPngClick = () => {
    setDownload((prev) => ({ ...prev, downloadPng: !download.downloadPng }));
  };

  const handleDownloadSvgClick = () => {
    setDownload((prev) => ({ ...prev, downloadSvg: !download.downloadSvg }));
  };

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
              handleDownloadJsonClick();
              handleActiveMenuClick("Export");
            }}
            icon={<FileIcon />}
          />
          <Item
            text={"Export as PNG"}
            onClick={() => {
              handleDownloadPngClick();
              handleActiveMenuClick("Export");
            }}
            icon={<PictureIcon />}
          />
          <Item
            text={"Export as SVG"}
            onClick={() => {
              handleDownloadSvgClick();
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
