const id = "ID";
const name = "Name";
const sites = "SiteA, SiteB, ...";
const sites2 = "SiteU, SiteV, ...";

export const nodeIdFormat = `${id}1_${name}1_${sites}; ${id}2_${name}2_${sites2}; ...`;

export const nodeIdExample0 = `ID1_MYL3; ID2_TTN`;
export const nodeIdExample1 = `P08590_MYL3`;
export const nodeIdExample2 = `P08590_MYL3_T165`;
export const nodeIdExample3 = `Q8WZ42_TTN_T719,S721`;
export const nodeIdExample4 = `Q8WZ42_TTN_T719,S721; Q8WZ42-12_TTN_T765,S767`;

export const nodeMappingFormat = "id<TAB>attribs";
export const nodeMappingExample = "P07900_HSP90AA1_S231<TAB>VEGF Signaling; ERBB2 Signaling";
export const nodeMappingExample2 = "Q9UQ35_SRRM2_S1083<TAB>mRNA Splicing";
