export const OMNI_PATH_API_BASE_URL = "/omnipathdb-api";
export const OMNI_PATH_ENZ_SUB_PATH = "/enz_sub";
export const OMNI_PATH_INTERACTIONS_PATH = "/interactions";
export const OMNI_PATH_ANNOTATIONS_PATH = "/annotations";
export const OMNI_PATH_INTERCELL_PATH = "/intercell";
export const OMNI_PATH_KINASE_ATTRIB = "Kinase";
export const OMNI_PATH_PHOSPHATASE_ATTRIB = "Phosphatase";
export const OMNI_PATH_PHOSPHO_ATTRIB = "Phosphorylation";
export const OMNI_PATH_DEPHOSPHO_ATTRIB = "Dephosphorylation";
export const OMNI_PATH_DEFAULT_ORGANISM_ID = "9606";
export const OMNI_PATH_SUBSTRATE_CHUNK_SIZE = 200;
export const OMNI_PATH_PARTNER_CHUNK_SIZE = 100;
export const OMNI_PATH_NODE_ANNOTATION_CHUNK_SIZE = 100;
export const OMNI_PATH_MIN_CURATION_EFFORT_MIN = 0;
export const OMNI_PATH_MIN_CURATION_EFFORT_MAX = 999;
export const OMNI_PATH_MIN_CURATION_EFFORT_DEFAULT = 0;
export const OMNI_PATH_NODE_ANNOTATION_MODE_PATHWAYS = "pathways";
export const OMNI_PATH_NODE_ANNOTATION_MODE_INTERCELL = "intercell";
export const OMNI_PATH_NODE_ANNOTATION_MODE_BOTH = "pathways_intercell";
export const OMNI_PATH_NODE_ANNOTATION_MODE_DEFAULT = OMNI_PATH_NODE_ANNOTATION_MODE_PATHWAYS;
export const OMNI_PATH_NODE_ANNOTATION_MODE_OPTIONS = [
  { value: OMNI_PATH_NODE_ANNOTATION_MODE_PATHWAYS, label: "Pathways" },
  { value: OMNI_PATH_NODE_ANNOTATION_MODE_INTERCELL, label: "Intercell roles" },
  { value: OMNI_PATH_NODE_ANNOTATION_MODE_BOTH, label: "Pathways + roles" },
];
