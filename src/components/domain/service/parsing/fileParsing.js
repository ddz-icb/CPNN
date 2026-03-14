import Papa from "papaparse";

export const getFileNameWithoutExtension = (filename) => filename.replace(/\.[^/.]+$/, "");

export function getFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.readAsText(file);
  });
}

export function parseSVFile(content) {
  const { data } = Papa.parse(content, {
    header: false,
    dynamicTyping: true,
    skipEmptyLines: true,
    delimiter: "", // Auto-detect delimiter
  });

  if (!data?.length) return null;

  const toLabel = (value) => (value === null || value === undefined ? "" : String(value).trim());
  const firstRow = data[0];
  const firstHeader = toLabel(firstRow?.[0]);
  const header = firstRow.slice(1).map(toLabel);
  const dataRows = data.slice(1);
  const firstColumn = dataRows.map((row) => toLabel(row?.[0]));
  const updatedData = dataRows.map((row) => row.slice(1));

  return { firstHeader, header, firstColumn, data: updatedData };
}
