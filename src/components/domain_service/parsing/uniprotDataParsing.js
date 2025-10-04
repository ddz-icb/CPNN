export const getDescriptionUniprotData = (jsonData) => {
  console.log("JSONDAT", jsonData); // NEXT: SHORTEN DESCRIPTION + FIND MORE USEFUL THINGS IN API SUCH AS 'DISEASE'?
  const functionComment = jsonData.comments.find((comment) => comment.commentType === "FUNCTION");

  if (functionComment && functionComment.texts && functionComment.texts.length > 0) {
    return functionComment.texts[0].value;
  }

  return null;
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
