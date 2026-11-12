export const getDescriptionUniprotData = (jsonData) => {
  const functionComment = jsonData?.comments?.find((comment) => comment.commentType === "FUNCTION");
  return functionComment?.texts?.[0]?.value ?? null;
};

export const getFullNameUniprotData = (jsonData) => {
  const recommendedName = jsonData.proteinDescription?.recommendedName;

  if (recommendedName && recommendedName.fullName) {
    return recommendedName.fullName.value;
  }

  return null;
};

export const getPdbIdUniprotData = (jsonData) => {
  const pdbReferences = jsonData.uniProtKBCrossReferences.filter((ref) => ref.database === "PDB");

  if (pdbReferences.length > 0) {
    return pdbReferences[0].id;
  }

  return null;
};
