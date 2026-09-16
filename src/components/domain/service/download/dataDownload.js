import { getFileNameWithoutExtension } from "../parsing/fileParsing.js";
import { triggerDownload } from "./fileDownload.js";

function buildTextDownload(content, filename, type) {
  return {
    blob: new Blob([content], { type }),
    filename,
  };
}

export function buildObjectJsonDownload(object, name) {
  const formattedJson = typeof object === "string" ? JSON.stringify(JSON.parse(object), null, 4) : JSON.stringify(object, null, 4);
  return buildTextDownload(formattedJson, name, "application/json");
}

export function downloadObjectAsFile(object, name) {
  const { blob, filename } = buildObjectJsonDownload(object, name);
  triggerDownload(blob, filename);
}

export function buildCsvFileDownload(csvContent, fileName) {
  return buildTextDownload(csvContent, `${getFileNameWithoutExtension(fileName)}.csv`, "text/csv;charset=utf-8;");
}

export function downloadCsvFile(csvContent, fileName) {
  const { blob, filename } = buildCsvFileDownload(csvContent, fileName);
  triggerDownload(blob, filename);
}

export function buildTsvFileDownload(tsvContent, fileName) {
  return buildTextDownload(tsvContent, `${getFileNameWithoutExtension(fileName)}.tsv`, "text/tab-separated-values;charset=utf-8;");
}

export function downloadTsvFile(tsvContent, fileName) {
  const { blob, filename } = buildTsvFileDownload(tsvContent, fileName);
  triggerDownload(blob, filename);
}

export function serializeColorschemeTsv(colorscheme) {
  if (!colorscheme?.data) {
    throw new Error("No color scheme selected for export.");
  }
  if (!Array.isArray(colorscheme.data) || !colorscheme.data.length) {
    throw new Error("Color scheme export requires at least one color.");
  }

  return ["hex", ...colorscheme.data].join("\n") + "\n";
}

export function buildColorschemeTsvDownload(colorscheme, suffix = "colorscheme") {
  const baseName = getFileNameWithoutExtension(colorscheme?.name || "colorscheme");
  return buildTsvFileDownload(serializeColorschemeTsv(colorscheme), `${baseName}_${suffix}`);
}

export function downloadColorschemeTsv(colorscheme, suffix = "colorscheme") {
  const { blob, filename } = buildColorschemeTsvDownload(colorscheme, suffix);
  triggerDownload(blob, filename);
}

export function buildNodeIdsCsvDownload(nodes, fileName) {
  if (!nodes) return null;

  const rows = nodes.map((node) => node.id ?? "");
  const baseName = getFileNameWithoutExtension(fileName);
  return buildCsvFileDownload(rows.join("\n"), `${baseName}_node_ids`);
}

export function downloadNodeIdsCsv(nodes, fileName) {
  const download = buildNodeIdsCsvDownload(nodes, fileName);
  if (!download) return;

  triggerDownload(download.blob, download.filename);
}
