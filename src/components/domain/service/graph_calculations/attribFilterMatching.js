export function matchesAttribsFilter(attribs, filterRequest) {
  if (filterRequest === true) return true;
  if (!Array.isArray(filterRequest)) return false;

  const attributes = normalizeAttribs(attribs);

  for (const andTerm of filterRequest) {
    if (!matchesAndTerm(attributes, andTerm)) return false;
  }

  return true;
}

export function normalizeAttribs(attribs) {
  return (Array.isArray(attribs) ? attribs : [])
    .map((attrib) => (attrib === undefined || attrib === null ? "" : attrib.toString()))
    .filter((attrib) => attrib.trim() !== "");
}

function matchesAndTerm(attributes, andTerm) {
  let meetsTerm = false;

  for (let i = 0; i < andTerm.length; i++) {
    const element = andTerm[i];

    if (isComparator(element)) {
      meetsTerm = matchesAttributeCount(attributes.length, element, andTerm[i + 1]) || meetsTerm;
      i++;
    } else if (element === "not") {
      meetsTerm = matchesNotTerm(attributes, andTerm[i + 1]) || meetsTerm;
      i++;
    } else if (element instanceof Set) {
      meetsTerm = matchesAttributeSet(attributes, element) || meetsTerm;
    } else {
      meetsTerm = hasMatchingAttrib(attributes, element) || meetsTerm;
    }
  }

  return meetsTerm;
}

function isComparator(value) {
  return value === "=" || value === "<" || value === "<=" || value === ">=" || value === ">";
}

function matchesAttributeCount(count, comparator, rawValue) {
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return false;
  if (comparator === "=") return count === value;
  if (comparator === "<") return count < value;
  if (comparator === "<=") return count <= value;
  if (comparator === ">=") return count >= value;
  if (comparator === ">") return count > value;
  return false;
}

function matchesNotTerm(attributes, term) {
  if (term instanceof Set) {
    for (const entry of term) {
      if (!hasMatchingAttrib(attributes, entry)) return true;
    }
    return false;
  }

  return !hasMatchingAttrib(attributes, term);
}

function matchesAttributeSet(attributes, term) {
  for (const entry of term) {
    if (!hasMatchingAttrib(attributes, entry)) return false;
  }
  return true;
}

function hasMatchingAttrib(attributes, query) {
  const normalizedQuery = normalizeSearchText(query);
  return attributes.some((attribute) => attribute.toLowerCase().includes(normalizedQuery));
}

function normalizeSearchText(value) {
  return (value ?? "").toString().trim().toLowerCase();
}
