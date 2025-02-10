const exampleMapping = `
UniProt-ID,Pathway Name,Reactome-ID
A2RRP1,Membrane Trafficking,R-HSA-199991
A2RUS2,Membrane Trafficking,R-HSA-199991
A5D8V6,Membrane Trafficking,R-HSA-199991
A5LHX3,PIP3 activates AKT signaling,R-HSA-1257604
A5PLN9,Membrane Trafficking,R-HSA-199991
A6NDG6,Glucose metabolism,R-HSA-70326
A6NHL2,"Translocation of SLC2A4 (GLUT4) to the plasma membrane, Membrane Trafficking","R-HSA-1445148, R-HSA-199991"
A6NNW6,Glucose metabolism,R-HSA-70326
A6NNZ2,"Translocation of SLC2A4 (GLUT4) to the plasma membrane, Membrane Trafficking","R-HSA-1445148, R-HSA-199991"
A8CG34,"Transport of Mature Transcript to Cytoplasm, Glucose metabolism","R-HSA-72202, R-HSA-70326"
A8MYZ6,PIP3 activates AKT signaling,R-HSA-1257604
B7ZC32,Membrane Trafficking,R-HSA-199991
O00115,Membrane Trafficking,R-HSA-199991
O00139,Membrane Trafficking,R-HSA-199991
O00141,PIP3 activates AKT signaling,R-HSA-1257604
O00148,Transport of Mature Transcript to Cytoplasm,R-HSA-72202
O00159,"Translocation of SLC2A4 (GLUT4) to the plasma membrane, Membrane Trafficking","R-HSA-1445148, R-HSA-199991"
O00161,"Translocation of SLC2A4 (GLUT4) to the plasma membrane, Membrane Trafficking","R-HSA-1445148, R-HSA-199991"
O00168,Muscle contraction,R-HSA-397014
O00180,Muscle contraction,R-HSA-397014
O00186,"Translocation of SLC2A4 (GLUT4) to the plasma membrane, Membrane Trafficking","R-HSA-1445148, R-HSA-199991"
O00189,Membrane Trafficking,R-HSA-199991
O00194,Membrane Trafficking,R-HSA-199991
O00203,Membrane Trafficking,R-HSA-199991
O00231,PIP3 activates AKT signaling,R-HSA-1257604
O00232,PIP3 activates AKT signaling,R-HSA-1257604
O00233,PIP3 activates AKT signaling,R-HSA-1257604
O00257,PIP3 activates AKT signaling,R-HSA-1257604
O00291,Membrane Trafficking,R-HSA-199991
O00308,PIP3 activates AKT signaling,R-HSA-1257604
O00329,PIP3 activates AKT signaling,R-HSA-1257604
O00399,Membrane Trafficking,R-HSA-199991
O00401,Membrane Trafficking,R-HSA-199991
O00418,MTOR signalling,R-HSA-165159
O00422,mRNA Splicing,R-HSA-72172
O00443,Membrane Trafficking,R-HSA-199991
O00459,"PIP3 activates AKT signaling, Signaling by VEGF, Signaling by Insulin receptor","R-HSA-1257604, R-HSA-194138, R-HSA-74752"
`;

export const exampleMappingCsv = { name: "ExampleMapping.csv", content: exampleMapping.trim() };
