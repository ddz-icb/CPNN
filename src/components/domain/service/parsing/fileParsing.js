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

  const header = data[0].map(String).slice(1);
  const dataRows = data.slice(1);
  const firstColumn = dataRows.map((row) => row[0]);
  const updatedData = dataRows.map((row) => row.slice(1));

  return { header, firstColumn, data: updatedData };
}
