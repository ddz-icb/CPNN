import { ReactComponent as DownloadIcon } from "../../../../assets/icons/download.svg";
import { useDownload } from "../../../adapters/state/downloadState.js";
import { TableList } from "../reusable_components/sidebarComponents.js";

export function ExportSidebar() {
  const { download, setDownload } = useDownload();

  const exportData = [
    { id: "json", text: "Graph data (JSON File)", type: "json" },
    { id: "jsonCoordsPhysics", text: "Graph data and current physics (JSON file)", type: "jsonCoordsPhysics" },
    { id: "png", text: "Graph as Picture (PNG File)", type: "png" },
    { id: "pdf", text: "Graph as Vector Graphic (PDF File)", type: "pdf" },
    { id: "svg", text: "Graph as Vector Graphic (SVG File)", type: "svg" },
    { id: "legendPdf", text: "Graph legend (PDF File)", type: "legendPdf" },
    { id: "nodeIds", text: "Node-IDs (CSV File)", type: "nodeIds" },
  ];

  return (
    <TableList
      heading={"Choose your preferred export"}
      data={exportData}
      displayKey={"text"}
      ActionIcon={DownloadIcon}
      onActionIconClick={(item) => setDownload(item.type, !download[item.type])}
      actionIconTooltipContent={() => "Download"}
      dark={true}
    />
  );
}
