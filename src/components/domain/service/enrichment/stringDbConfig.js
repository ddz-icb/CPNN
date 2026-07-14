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

export const STRING_DB_CATEGORY_ALL = "all";
export const STRING_DB_ENRICHMENT_CATEGORIES = [
  { id: "Process", label: "GO Biological Process", attributeLabel: "GO Process" },
  { id: "Function", label: "GO Molecular Function", attributeLabel: "GO Function" },
  { id: "Component", label: "GO Cellular Component", attributeLabel: "GO Component" },
  { id: "Keyword", label: "UniProt Keywords", attributeLabel: "UniProt Keyword" },
  { id: "KEGG", label: "KEGG Pathways", attributeLabel: "KEGG" },
  { id: "RCTM", label: "Reactome Pathways", attributeLabel: "Reactome" },
  { id: "HPO", label: "Human Phenotype", attributeLabel: "HPO" },
  { id: "MPO", label: "Mammalian Phenotype", attributeLabel: "MPO" },
  { id: "DPO", label: "Drosophila Phenotype", attributeLabel: "DPO" },
  { id: "WPO", label: "C. elegans Phenotype", attributeLabel: "WPO" },
  { id: "ZPO", label: "Zebrafish Phenotype", attributeLabel: "ZPO" },
  { id: "FYPO", label: "Fission Yeast Phenotype", attributeLabel: "FYPO" },
  { id: "Pfam", label: "Pfam Protein Domains", attributeLabel: "Pfam" },
  { id: "SMART", label: "SMART Protein Domains", attributeLabel: "SMART" },
  { id: "InterPro", label: "InterPro Domains and Features", attributeLabel: "InterPro" },
  { id: "PMID", label: "PubMed Publications", attributeLabel: "PubMed" },
  { id: "NetworkNeighborAL", label: "STRING Local Network Cluster", attributeLabel: "STRING Cluster" },
  { id: "COMPARTMENTS", label: "COMPARTMENTS Localization", attributeLabel: "COMPARTMENTS" },
  { id: "TISSUES", label: "TISSUES Expression", attributeLabel: "TISSUES" },
  { id: "DISEASES", label: "DISEASES Associations", attributeLabel: "DISEASES" },
  { id: "WikiPathways", label: "WikiPathways" },
];
export const STRING_DB_NODE_ATTRIBUTE_CATEGORY_OPTIONS = [
  { value: STRING_DB_CATEGORY_ALL, label: "All STRING sources" },
  ...STRING_DB_ENRICHMENT_CATEGORIES.map((category) => ({
    value: category.id,
    label: category.label,
  })),
];

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
