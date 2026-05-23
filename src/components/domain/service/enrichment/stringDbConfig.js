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
export const FUNCTIONAL_ANNOTATION_CHUNK_SIZE = 100;
export const STRING_DB_NODE_ATTRIBUTE_TYPE_PATHWAYS = "pathways";
export const STRING_DB_NODE_ATTRIBUTE_TYPE_DOMAINS = "domains";
export const STRING_DB_NODE_ATTRIBUTE_TYPE_GO_PROCESS = "go_process";
export const STRING_DB_NODE_ATTRIBUTE_TYPE_GO_FUNCTION = "go_function";
export const STRING_DB_NODE_ATTRIBUTE_TYPE_GO_COMPONENT = "go_component";
export const STRING_DB_NODE_ATTRIBUTE_TYPE_LOCALIZATION = "localization";
export const STRING_DB_NODE_ATTRIBUTE_TYPE_DISEASE = "disease";
export const STRING_DB_NODE_ATTRIBUTE_TYPE_TISSUE = "tissue";
export const STRING_DB_NODE_ATTRIBUTE_TYPE_PHENOTYPE = "phenotype";
export const STRING_DB_NODE_ATTRIBUTE_TYPE_ALL_CURATED = "all_curated";
export const STRING_DB_NODE_ATTRIBUTE_TYPE_DEFAULT = STRING_DB_NODE_ATTRIBUTE_TYPE_PATHWAYS;
export const STRING_DB_NODE_ATTRIBUTE_TYPE_OPTIONS = [
  { value: STRING_DB_NODE_ATTRIBUTE_TYPE_PATHWAYS, label: "Pathways" },
  { value: STRING_DB_NODE_ATTRIBUTE_TYPE_DOMAINS, label: "Domains + keywords" },
  { value: STRING_DB_NODE_ATTRIBUTE_TYPE_GO_PROCESS, label: "GO Process" },
  { value: STRING_DB_NODE_ATTRIBUTE_TYPE_GO_FUNCTION, label: "GO Function" },
  { value: STRING_DB_NODE_ATTRIBUTE_TYPE_GO_COMPONENT, label: "GO Component" },
  { value: STRING_DB_NODE_ATTRIBUTE_TYPE_LOCALIZATION, label: "Localization" },
  { value: STRING_DB_NODE_ATTRIBUTE_TYPE_DISEASE, label: "Disease" },
  { value: STRING_DB_NODE_ATTRIBUTE_TYPE_TISSUE, label: "Tissue" },
  { value: STRING_DB_NODE_ATTRIBUTE_TYPE_PHENOTYPE, label: "Phenotype" },
  { value: STRING_DB_NODE_ATTRIBUTE_TYPE_ALL_CURATED, label: "All curated" },
];
export const STRING_DB_NODE_ATTRIBUTE_TYPE_CATEGORIES = {
  [STRING_DB_NODE_ATTRIBUTE_TYPE_PATHWAYS]: ["RCTM", "KEGG", "WikiPathways"],
  [STRING_DB_NODE_ATTRIBUTE_TYPE_DOMAINS]: ["Pfam", "InterPro", "SMART", "Keyword"],
  [STRING_DB_NODE_ATTRIBUTE_TYPE_GO_PROCESS]: ["Process"],
  [STRING_DB_NODE_ATTRIBUTE_TYPE_GO_FUNCTION]: ["Function"],
  [STRING_DB_NODE_ATTRIBUTE_TYPE_GO_COMPONENT]: ["Component"],
  [STRING_DB_NODE_ATTRIBUTE_TYPE_LOCALIZATION]: ["COMPARTMENTS"],
  [STRING_DB_NODE_ATTRIBUTE_TYPE_DISEASE]: ["DISEASES"],
  [STRING_DB_NODE_ATTRIBUTE_TYPE_TISSUE]: ["TISSUES"],
  [STRING_DB_NODE_ATTRIBUTE_TYPE_PHENOTYPE]: ["HPO"],
  [STRING_DB_NODE_ATTRIBUTE_TYPE_ALL_CURATED]: [
    "RCTM",
    "KEGG",
    "WikiPathways",
    "Pfam",
    "InterPro",
    "SMART",
    "Keyword",
    "Function",
    "Process",
    "Component",
    "COMPARTMENTS",
    "DISEASES",
    "TISSUES",
    "HPO",
  ],
};
export const DEFAULT_GROUP_ENRICHMENT_MAX_FDR = 0.05;
export const MIN_GROUP_ENRICHMENT_MAX_FDR = 0;
export const MAX_GROUP_ENRICHMENT_MAX_FDR = 1;
export const GROUP_ENRICHMENT_MIN_PROTEINS = 2;
export const GROUP_ENRICHMENT_MAX_GROUPS = 25;

export const STRING_DB_SPECIES = [
  { id: "9606",   label: "Human (H. sapiens)" },
  { id: "10090",  label: "Mouse (M. musculus)" },
  { id: "10116",  label: "Rat (R. norvegicus)" },
  { id: "7955",   label: "Zebrafish (D. rerio)" },
  { id: "7227",   label: "Fruit fly (D. melanogaster)" },
  { id: "6239",   label: "Worm (C. elegans)" },
  { id: "4932",   label: "Yeast (S. cerevisiae)" },
  { id: "511145", label: "E. coli (K-12)" },
];

export const DEFAULT_SPECIES_ID = "9606";
