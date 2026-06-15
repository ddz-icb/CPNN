import { QUERY_FIELD_PREFIX } from "../parsing/attribsFilterParsing.js";

export function matchesAttribsFilter(attribs, filterRequest, metrics = {}) {
  if (filterRequest === true) return true;
  if (!Array.isArray(filterRequest)) return false;

  const attributes = normalizeAttribs(attribs);

  for (const andTerm of filterRequest) {
    if (!matchesAndTerm(attributes, andTerm, metrics)) return false;
  }

  return true;
}

export function normalizeAttribs(attribs) {
  return (Array.isArray(attribs) ? attribs : [])
    .map((attrib) => (attrib === undefined || attrib === null ? "" : attrib.toString()))
    .filter((attrib) => attrib.trim() !== "");
}

function matchesAndTerm(attributes, andTerm, metrics) {
  let meetsTerm = false;

  for (let i = 0; i < andTerm.length; i++) {
    const element = andTerm[i];

    if (isMetricTerm(element)) {
      meetsTerm = matchesNumericValue(metrics[element.metric], element.comparator, element.value) || meetsTerm;
    } else if (isComparator(element)) {
      meetsTerm = matchesAttributeCount(attributes.length, element, andTerm[i + 1]) || meetsTerm;
      i++;
    } else if (element === "not") {
      meetsTerm = matchesNotTerm(attributes, andTerm[i + 1], metrics) || meetsTerm;
      i++;
    } else if (element instanceof Set) {
      meetsTerm = matchesAttributeSet(attributes, element, metrics) || meetsTerm;
    } else {
      meetsTerm = matchesTextTerm(attributes, element, metrics) || meetsTerm;
    }
  }

  return meetsTerm;
}

function isComparator(value) {
  return value === "=" || value === "!=" || value === "<" || value === "<=" || value === ">=" || value === ">";
}

function matchesAttributeCount(count, comparator, rawValue) {
  return matchesNumericValue(count, comparator, rawValue);
}

function matchesNumericValue(count, comparator, rawValue) {
  if (!Number.isFinite(count)) return false;
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return false;
  if (comparator === "=") return count === value;
  if (comparator === "!=") return count !== value;
  if (comparator === "<") return count < value;
  if (comparator === "<=") return count <= value;
  if (comparator === ">=") return count >= value;
  if (comparator === ">") return count > value;
  return false;
}

function isMetricTerm(value) {
  return value && typeof value === "object" && !(value instanceof Set) && value.metric === "neighbors";
}

function matchesNotTerm(attributes, term, metrics) {
  if (term instanceof Set) {
    for (const entry of term) {
      if (!matchesTextTerm(attributes, entry, metrics)) return true;
    }
    return false;
  }

  return !matchesTextTerm(attributes, term, metrics);
}

function matchesAttributeSet(attributes, term, metrics) {
  for (const entry of term) {
    if (!matchesTextTerm(attributes, entry, metrics)) return false;
  }
  return true;
}

function matchesTextTerm(attributes, query, metrics) {
  const fieldTerm = parseFieldTerm(query);
  if (fieldTerm) {
    if (fieldTerm.field === "attr") return matchesFieldValue(attributes, fieldTerm.value);
    return matchesFieldValue(metrics[fieldTerm.field], fieldTerm.value);
  }

  return matchesFieldValue(metrics.text, query);
}

function parseFieldTerm(query) {
  if (typeof query !== "string" || !query.startsWith(QUERY_FIELD_PREFIX)) return null;
  const separatorIndex = query.indexOf(":", QUERY_FIELD_PREFIX.length);
  if (separatorIndex < 0) return null;
  return {
    field: query.slice(QUERY_FIELD_PREFIX.length, separatorIndex),
    value: query.slice(separatorIndex + 1),
  };
}

function matchesFieldValue(fieldValue, query) {
  if (Array.isArray(fieldValue)) return fieldValue.some((value) => matchesFieldValue(value, query));
  if (fieldValue === undefined || fieldValue === null) return false;
  return normalizeSearchText(fieldValue).includes(normalizeSearchText(query));
}

function normalizeSearchText(value) {
  return (value ?? "").toString().trim().toLowerCase();
}
