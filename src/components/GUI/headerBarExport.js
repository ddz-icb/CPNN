import { ReactComponent as FileLines } from "../../icons/fileLines.svg";
import { ReactComponent as PdfIcon } from "../../icons/pdf.svg";
import { ReactComponent as FileWaveform } from "../../icons/fileWaveform.svg";
import { ReactComponent as FileImage } from "../../icons/fileImage.svg";
import { ReactComponent as DownloadIcon } from "../../icons/download.svg";
import { ReactComponent as XIcon } from "../../icons/x.svg";

import { useDownload } from "../../states.js";
import { Button, Item } from "./reusableComponents/headerBarComponents.js";

export function HeaderBarExport({ activeMenu, handleActiveMenuClick }) {
  const { download, setDownload } = useDownload();
  let content = null;

  const handleDownloadJsonClick = () => {
    setDownload("json", !download.json);
  };

  const handleDownloadJsonCoordsPhysics = () => {
    setDownload("jsonCoordsPhysics", !download.jsonCoordsPhysics);
  };

  const handleDownloadPngClick = () => {
    setDownload("png", !download.png);
  };

  const handleDownloadSvgClick = () => {
    setDownload("svg", !download.svg);
  };

  const handleDownloadPdfClick = () => {
    setDownload("pdf", !download.pdf);
  };

  const handleDownloadLegendPdfClick = () => {
    setDownload("legendPdf", !download.legendPdf);
  };

  const handleDownloadGraphWithLegendPdfClick = () => {
    setDownload("graphWithLegendPdf", !download.graphWithLegendPdf);
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
            text={"Export Graph with settings as JSON"}
            onClick={() => {
              handleDownloadJsonCoordsPhysics();
              handleActiveMenuClick("Export");
            }}
            icon={<PdfIcon />}
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
        </div>
      </>
    );
  }

  return <>{content}</>;
}
