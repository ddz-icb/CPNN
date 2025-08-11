import { useDownload } from "../../../states.js";
import { TableList } from "../reusable_components/sidebarComponents.js";

export function ExportSidebar() {
  const { download, setDownload } = useDownload();

  const exportData = [
    { id: "json", text: "Export Graph as JSON", type: "json" },
    { id: "jsonCoordsPhysics", text: "Export Graph with settings as JSON", type: "jsonCoordsPhysics" },
    { id: "png", text: "Export Graph as PNG", type: "png" },
    { id: "svg", text: "Export Graph as SVG", type: "svg" },
    { id: "pdf", text: "Export Graph as PDF", type: "pdf" },
    { id: "legendPdf", text: "Export Legend as PDF", type: "legendPdf" },
  ];

  return (
    <TableList heading="Export Options" data={exportData} displayKey="text" onItemClick={(item) => setDownload(item.type, !download[item.type])} />
  );
}
