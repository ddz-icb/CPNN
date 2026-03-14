export function getPhosphositesNodeIdEntry(entry) {
  const phosphositePart = entry.split("_")[2];
  if (!phosphositePart) return [];

  return phosphositePart
    .split(",")
    .map((site) => site.trim())
    .filter(Boolean);
}

export function parseNodeIdEntries(entries) {
  if (!entries?.length) return {};

  const protIdNoIsoform = entries[0].split("_")[0]?.split("-")[0] || "";
  const gene = entries[0].split("_")[1] || "";
  const hasPhosphosites = !!entries[0].split("_")[2];

  const isoforms = entries
    .map((entry) => {
      const [pepId, , phosphosites] = entry.split("_");
      return pepId
        ? {
            pepId,
            phosphosites: phosphosites
              ? phosphosites
                  .split(",")
                  .map((site) => site.trim())
                  .filter(Boolean)
              : [],
          }
        : null;
    })
    .filter(Boolean);

  return { protIdNoIsoform, gene, hasPhosphosites, isoforms };
}

const UNIPROT_ACCESSION_PATTERN = /^(?:[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9][A-Z0-9]{3}[0-9])(?:-\d+)?$/;

export function isLikelyUniprotAccession(value) {
  return UNIPROT_ACCESSION_PATTERN.test(String(value ?? "").trim());
}
