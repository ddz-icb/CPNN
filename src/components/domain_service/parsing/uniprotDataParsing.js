export const getDescriptionUniprotData = (jsonData) => {
  const functionComment = jsonData.comments.find((comment) => comment.commentType === "FUNCTION");

  if (functionComment && functionComment.texts && functionComment.texts.length > 0) {
    const fullText = functionComment.texts[0].value;

    const MAX_CHARS = 1000;

    if (fullText.length <= MAX_CHARS) {
      return fullText;
    }

    const truncatedText = fullText.substring(0, MAX_CHARS);

    const lastPeriodIndex = Math.max(truncatedText.lastIndexOf("."), truncatedText.lastIndexOf("!"), truncatedText.lastIndexOf("?"));

    const ellipsis = "... [Read more on UniProt]";

    if (lastPeriodIndex > 0) {
      const safeShortText = truncatedText.substring(0, lastPeriodIndex + 1);

      return safeShortText.trim() + ellipsis;
    }

    return truncatedText.trim() + ellipsis;
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
