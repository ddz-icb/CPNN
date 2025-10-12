const id = "UniprotID";
const name = "Name";
const sites = "SiteA, SiteB, ...";
const sites2 = "SiteU, SiteV, ...";

export const nodeIdFormat = `${id}1_ ${name}1_${sites}; ${id}2_${name}2_${sites2}; ...`;

export const nodeIdExample1 = `P08590_MYL3`;
export const nodeIdExample2 = `P08590_MYL3_T165`;
export const nodeIdExample3 = `Q8WZ42_TTN_T719,S721`;
export const nodeIdExample4 = `Q8WZ42_TTN_T719,S721; Q8WZ42-12_TTN_T765,S767`;

export const mappingFormat = "Uniprot-ID, PathwayName1; PathwayName2; ...";
export const mappingExample = "O60306,mRNA Splicing";
export const mappingExample2 = "Q9UNE7-2,AKT signaling; ERBB2 signaling";
