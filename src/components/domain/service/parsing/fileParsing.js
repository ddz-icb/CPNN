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

export function formatDelimitedParseError(error) {
  const rowText = Number.isInteger(error?.row) ? ` at row ${error.row + 1}` : "";
  return `Could not parse CSV/TSV${rowText}: ${error?.message || "unknown parser error"}. Check quotes, delimiters, and line breaks.`;
}

export function getFatalDelimitedParseError(errors = []) {
  return errors.find((error) => error?.code !== "UndetectableDelimiter");
}

export function parseSVFile(content) {
  const { data, errors } = Papa.parse(content, {
    header: false,
    dynamicTyping: true,
    skipEmptyLines: true,
    delimiter: "", // Auto-detect delimiter
  });

  const fatalParseError = getFatalDelimitedParseError(errors);
  if (fatalParseError) {
    throw new Error(formatDelimitedParseError(fatalParseError));
  }

  if (!data?.length || !Array.isArray(data[0])) return null;

  const toLabel = (value) => (value === null || value === undefined ? "" : String(value).trim());
  const firstRow = data[0];
  const firstHeader = toLabel(firstRow?.[0]);
  const header = firstRow.slice(1).map(toLabel);
  const dataRows = data.slice(1);
  const firstColumn = dataRows.map((row) => toLabel(row?.[0]));
  const updatedData = dataRows.map((row) => row.slice(1));
  const rowNumbers = dataRows.map((_, index) => index + 2);

  return { firstHeader, header, firstColumn, data: updatedData, rowNumbers };
}
