import log from "../../../adapters/logging/logger.js";
import { OMNI_PATH_ARCHIVE_BASE_URL, OMNI_PATH_ENZ_SUB_ARCHIVE_PATH } from "./omniPathConfig.js";
import { normalizeProteinId } from "./stringDbHelpers.js";

const PHOSPHORYLATION_MODIFICATION = "phosphorylation";

let archivedEnzSubRowsPromise = null;

function parseTsvRows(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const headers = lines[0].split("\t");
  return lines.slice(1).map((line) => {
    const values = line.split("\t");
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

async function readGzipResponseText(response) {
  if (!response.body || typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot decompress the OmniPath archive response.");
  }

  const decompressedStream = response.body.pipeThrough(new DecompressionStream("gzip"));
  return new Response(decompressedStream).text();
}

async function fetchArchivedEnzSubRows() {
  const url = `${OMNI_PATH_ARCHIVE_BASE_URL}${OMNI_PATH_ENZ_SUB_ARCHIVE_PATH}`;
  log.debug(`Fetching OmniPath enz_sub archive from ${url}`);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`OmniPath archive request failed (HTTP ${response.status})`);

  const text = await readGzipResponseText(response);
  return parseTsvRows(text);
}

function getArchivedEnzSubRows() {
  if (!archivedEnzSubRowsPromise) {
    archivedEnzSubRowsPromise = fetchArchivedEnzSubRows();
  }
  return archivedEnzSubRowsPromise;
}

function isPhosphorylationRecord(record) {
  const modification = String(record?.modification ?? "").trim().toLowerCase();
  return !modification || modification === PHOSPHORYLATION_MODIFICATION;
}

export async function fetchKinaseSubstrateInteractions(substrateIds) {
  const substrateSet = new Set(substrateIds.map((id) => normalizeProteinId(id)).filter(Boolean));
  if (substrateSet.size === 0) return [];

  const rows = await getArchivedEnzSubRows();
  return rows.filter((record) => {
    if (!isPhosphorylationRecord(record)) return false;
    const substrateId = normalizeProteinId(record?.substrate);
    return substrateSet.has(substrateId);
  });
}
