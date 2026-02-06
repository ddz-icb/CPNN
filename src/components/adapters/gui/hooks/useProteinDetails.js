import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import log from "../../logging/logger.js";
import { getDescriptionUniprotData, getFullNameUniprotData, getPdbIdUniprotData } from "../../../domain/service/parsing/uniprotDataParsing.js";
import { getNodeIdEntries, parseNodeIdEntries } from "../../../domain/service/parsing/nodeIdParsing.js";

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

        // const responseUniprot = await axios.get(`http://localhost:3001/uniprot/${parsedEntries.protIdNoIsoform}`);
        const responseUniprot = await axios.get(`https://cpnn.ddz.de/api/uniprot/${parsedEntries.protIdNoIsoform}`);
        if (isCancelled) return;

        const uniprotData = responseUniprot?.data;
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
          const responsePdb = await axios.get(`https://files.rcsb.org/download/${pdbId}.pdb`);
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
