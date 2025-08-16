export const getDescriptionUniprotData = (data) => {
  const descriptionMatch = data.match(/-!- FUNCTION:\s*([^.\{(]+)[.\{(]/);
  const description = descriptionMatch ? descriptionMatch[1] : null;

  return description;
};

export const getFullNameUniprotData = (data) => {
  const fullNameMatch = data.match(/RecName:\s*Full=([^;\{(]+)[;\{(]/);
  const fullName = fullNameMatch ? fullNameMatch[1] : null;

  return fullName;
};

export const getPdbIdUniprotData = (data) => {
  const pdbIdMatch = data.match(/DR   PDB; (\w+);/);
  const pdbId = pdbIdMatch ? pdbIdMatch[1] : null;

  return pdbId;
};
