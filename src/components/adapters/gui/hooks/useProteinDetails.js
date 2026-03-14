import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import log from "../../logging/logger.js";
import { getDescriptionUniprotData, getFullNameUniprotData, getPdbIdUniprotData } from "../../../domain/service/parsing/uniprotDataParsing.js";
import { getNodeIdEntries } from "../../../domain/service/parsing/nodeIdParsing.js";
import { isLikelyUniprotAccession, parseNodeIdEntries } from "../../../domain/service/parsing/nodeIdBioParsing.js";

const proteinDetailsInit = {
  fullName: "",
  description: "",
  pdbId: "",
  protIdNoIsoform: "",
  gene: "",
  isoforms: [],
  hasPhosphosites: false,
  responsePdb: null,
};

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

async function fetchUniprotData(protIdNoIsoform) {
  try {
    log.debug(`Fetching UniProt data for ${protIdNoIsoform}`);
    const response = await axios.get(`https://rest.uniprot.org/uniprotkb/${protIdNoIsoform}.json`);
    return response?.data ?? null;
  } catch (error) {
    logRequestIssue("UniProt", protIdNoIsoform, error);
    return null;
  }
}

async function fetchPdbData(pdbId) {
  try {
    log.debug(`Fetching PDB file for ${pdbId}`);
    const response = await axios.get(`https://files.rcsb.org/download/${pdbId}.pdb`);
    return response ?? null;
  } catch (error) {
    logRequestIssue("RCSB PDB", pdbId, error);
    return null;
  }
}

export function useProteinDetails(nodeId) {
  const [details, setDetails] = useState(proteinDetailsInit);

  const reset = useCallback(() => {
    setDetails(proteinDetailsInit);
  }, []);

  useEffect(() => {
    if (!nodeId) {
      reset();
      return;
    }

    let isCancelled = false;

    const fetchProteinDetails = async () => {
      try {
        const entries = getNodeIdEntries(nodeId);
        const parsedEntries = parseNodeIdEntries(entries);

        if (isCancelled) return;
        setDetails((prev) => ({
          ...prev,
          protIdNoIsoform: parsedEntries.protIdNoIsoform,
          gene: parsedEntries.gene,
          hasPhosphosites: parsedEntries.hasPhosphosites,
          isoforms: parsedEntries.isoforms,
        }));

        if (!parsedEntries.protIdNoIsoform) return;
        if (!isLikelyUniprotAccession(parsedEntries.protIdNoIsoform)) return;

        const uniprotData = await fetchUniprotData(parsedEntries.protIdNoIsoform);
        if (isCancelled) return;
        if (!uniprotData) return;

        const nextDetails = {
          fullName: getFullNameUniprotData(uniprotData) || "",
          description: getDescriptionUniprotData(uniprotData) || "",
          pdbId: "",
          responsePdb: null,
        };

        const pdbId = getPdbIdUniprotData(uniprotData);
        if (pdbId) {
          nextDetails.pdbId = pdbId;
          const responsePdb = await fetchPdbData(pdbId);
          if (!isCancelled && responsePdb?.data) {
            nextDetails.responsePdb = responsePdb;
          }
        }

        if (!isCancelled) {
          setDetails((prev) => ({
            ...prev,
            ...nextDetails,
          }));
        }
      } catch (error) {
        if (!isCancelled) log.error(error);
      }
    };

    reset();
    fetchProteinDetails();

    return () => {
      isCancelled = true;
    };
  }, [nodeId, reset]);

  return details;
}
