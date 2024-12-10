import { ReactComponent as PictureIcon } from "../../icons/picture.svg";
import { ReactComponent as FileIcon } from "../../icons/file.svg";
import { ReactComponent as DownloadIcon } from "../../icons/download.svg";
import { ReactComponent as XIcon } from "../../icons/x.svg";
import React from "react";

import { Button, Item } from "./headerBar.js";
import { useSettings } from "../../states.js";

export function HeaderBarExport({ activeMenu, handleActiveMenuClick }) {
  const { settings, setSettings } = useSettings();
  let content = null;

  const handleDownloadJsonClick = () => {
    setSettings("download.json", !settings.download.json);
  };

  const handleDownloadPngClick = () => {
    setSettings("download.png", !settings.download.png);
  };

  const handleDownloadSvgClick = () => {
    setSettings("download.svg", !settings.download.svg);
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
