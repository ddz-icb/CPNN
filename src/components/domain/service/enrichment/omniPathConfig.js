// Requests are proxied through the Vite dev server (and should be proxied by the
// production server as well) to avoid CORS restrictions on omnipathdb.org.
export const OMNI_PATH_BASE_URL = "/omnipathdb-api";
export const OMNI_PATH_KINASE_ATTRIB = "Kinase";
export const OMNI_PATH_PHOSPHO_ATTRIB = "phosphorylation";
export const SUBSTRATE_CHUNK_SIZE = 200;
