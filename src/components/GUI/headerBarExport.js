import { ReactComponent as FileLines } from "../../icons/fileLines.svg";
import { ReactComponent as PdfIcon } from "../../icons/pdf.svg";
import { ReactComponent as FileWaveform } from "../../icons/fileWaveform.svg";
import { ReactComponent as FileImage } from "../../icons/fileImage.svg";
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

  const handleDownloadPdfClick = () => {
    setSettings("download.pdf", !settings.download.pdf);
  };

  const handleDownloadLegendPdfClick = () => {
    setSettings("download.legendPdf", !settings.download.legendPdf);
  };

  const handleDownloadGraphWithLegendPdfClick = () => {
    setSettings("download.graphWithLegendPdf", !settings.download.graphWithLegendPdf);
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
        <div className="dropdown min-width-250">
          <Item
            text={"Export Graph as JSON"}
            onClick={() => {
              handleDownloadJsonClick();
              handleActiveMenuClick("Export");
            }}
            icon={<FileLines />}
          />
          <Item
            text={"Export Graph as PNG"}
            onClick={() => {
              handleDownloadPngClick();
              handleActiveMenuClick("Export");
            }}
            icon={<FileImage />}
          />
          <Item
            text={"Export Graph as SVG"}
            onClick={() => {
              handleDownloadSvgClick();
              handleActiveMenuClick("Export");
            }}
            icon={<FileWaveform />}
          />
          <Item
            text={"Export Graph as PDF"}
            onClick={() => {
              handleDownloadPdfClick();
              handleActiveMenuClick("Export");
            }}
            icon={<PdfIcon />}
          />
          <Item
            text={"Export Legend as PDF"}
            onClick={() => {
              handleDownloadLegendPdfClick();
              handleActiveMenuClick("Export");
            }}
            icon={<PdfIcon />}
          />
          <Item
            text={"Export Graph with Legend as PDF"}
            onClick={() => {
              handleDownloadGraphWithLegendPdfClick();
              handleActiveMenuClick("Export");
            }}
            icon={<PdfIcon />}
          />
        </div>
      </>
    );
  }

  return <>{content}</>;
}
