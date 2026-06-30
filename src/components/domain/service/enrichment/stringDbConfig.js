export const STRING_DB_BASE_URL = "/stringdb-api/json";
export const STRING_DB_CALLER_ID = "cpnn";
export const STRING_DB_LINK_ATTRIB = "STRING-DB";
export const STRING_DB_EVIDENCE_ATTRIBS = {
  nscore: "STRING Neighborhood",
  fscore: "STRING Fusion",
  pscore: "STRING Phylogenetic Profile",
  ascore: "STRING Coexpression",
  escore: "STRING Experimental",
  dscore: "STRING Database",
  tscore: "STRING Text Mining",
};
export const STRING_DB_LINK_ATTRIBS = [STRING_DB_LINK_ATTRIB, ...Object.values(STRING_DB_EVIDENCE_ATTRIBS)];

export const DEFAULT_MIN_CONFIDENCE = 0.9;
export const MIN_CONFIDENCE = 0;
export const MAX_CONFIDENCE = 1;
export const DEFAULT_MIN_EVIDENCE_SCORE = 0.2;
export const MIN_EVIDENCE_SCORE = 0;
export const MAX_EVIDENCE_SCORE = 1;

export const NETWORK_CHUNK_SIZE = 200;
export const IDENTIFIER_MAPPING_CHUNK_SIZE = 100;
export const DEFAULT_NODE_ATTRIBUTE_MAX_TERMS = 5;
export const MIN_NODE_ATTRIBUTE_MAX_TERMS = 1;
export const MAX_NODE_ATTRIBUTE_MAX_TERMS = 50;
export const DEFAULT_GROUP_ENRICHMENT_MAX_FDR = 0.05;
export const MIN_GROUP_ENRICHMENT_MAX_FDR = 0;
export const MAX_GROUP_ENRICHMENT_MAX_FDR = 1;
export const GROUP_ENRICHMENT_MIN_PROTEINS = 2;
export const GROUP_ENRICHMENT_MAX_GROUPS = 25;

export const STRING_DB_SPECIES = [
  { id: "9606", label: "Human (H. sapiens)" },
  { id: "10090", label: "Mouse (M. musculus)" },
  { id: "10116", label: "Rat (R. norvegicus)" },
  { id: "7955", label: "Zebrafish (D. rerio)" },
  { id: "7227", label: "Fruit fly (D. melanogaster)" },
  { id: "6239", label: "Worm (C. elegans)" },
  { id: "4932", label: "Yeast (S. cerevisiae)" },
  { id: "511145", label: "E. coli (K-12)" },
];

export const DEFAULT_SPECIES_ID = "9606";
