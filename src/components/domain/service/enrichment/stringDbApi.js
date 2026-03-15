import axios from "axios";

import log from "../../../adapters/logging/logger.js";
import {
  STRING_DB_BASE_URL,
  STRING_DB_CALLER_ID,
  NETWORK_CHUNK_SIZE,
  HUMAN_SPECIES_ID,
} from "./stringDbConfig.js";
import { clampConfidence, chunkArray, deduplicateInteractions, normalizeProteinId } from "./stringDbHelpers.js";

function logRequestIssue(source, identifier, error) {
  if (!axios.isAxiosError(error)) {
    log.warn(`${source} request failed for ${identifier}`);
    return;
  }

  if (error.code === "ERR_CANCELED") return;

  const status = error.response?.status;
  if (status === 404) {
    log.debug(`${source} entry not found for ${identifier}`);
    return;
  }

  log.warn(`${source} request failed for ${identifier}${status ? ` (HTTP ${status})` : ""}`);
}

function isHttpStatus(error, status) {
  return axios.isAxiosError(error) && error.response?.status === status;
}

async function fetchStringDbData(method, params, requestLabel) {
  try {
    log.debug(`Fetching STRING-DB ${method} for ${requestLabel}`);
    const body = new URLSearchParams(params);
    const response = await axios.post(`${STRING_DB_BASE_URL}/${method}`, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const rows = Array.isArray(response.data) ? response.data : [];
    log.debug(`STRING-DB ${method} returned ${rows.length} record(s) for ${requestLabel}`);
    return rows;
  } catch (error) {
    logRequestIssue("STRING-DB", `${method} (${requestLabel})`, error);
    throw error;
  }
}

async function fetchNetworkInteractionsChunk(proteinIds, minConfidence) {
  if (proteinIds.length < 2) return [];

  const requiredScore = clampConfidence(minConfidence);
  return fetchStringDbData(
    "network",
    {
      identifiers: proteinIds.join("\r"),
      species: HUMAN_SPECIES_ID,
      show_query_node_labels: "1",
      caller_identity: STRING_DB_CALLER_ID,
      required_score: String(requiredScore),
    },
    `${proteinIds.length} UniProt id(s), human, min confidence ${requiredScore}`,
  );
}

export async function fetchNetworkInteractions(proteinIds, minConfidence) {
  const uniqueProteinIds = Array.from(new Set(proteinIds.map((proteinId) => normalizeProteinId(proteinId)).filter(Boolean)));
  if (uniqueProteinIds.length < 2) return [];

  try {
    return await fetchNetworkInteractionsChunk(uniqueProteinIds, minConfidence);
  } catch (error) {
    if (!isHttpStatus(error, 400) || uniqueProteinIds.length <= NETWORK_CHUNK_SIZE) {
      throw error;
    }

    const idChunks = chunkArray(uniqueProteinIds, NETWORK_CHUNK_SIZE);
    log.info(`STRING-DB network request too large. Retrying in ${idChunks.length} chunk(s) for human.`);

    const combinedInteractions = [];
    for (let i = 0; i < idChunks.length; i++) {
      for (let j = i; j < idChunks.length; j++) {
        const requestIds = i === j ? idChunks[i] : [...idChunks[i], ...idChunks[j]];
        const interactions = await fetchNetworkInteractionsChunk(requestIds, minConfidence);
        combinedInteractions.push(...interactions);
      }
    }

    return deduplicateInteractions(combinedInteractions);
  }
}
