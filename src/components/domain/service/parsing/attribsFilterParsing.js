import log from "../../../adapters/logging/logger.js";

export const QUERY_FIELD_PREFIX = "__query_field__:";

const TOKENS = {
  ATTRIBUTE: /^(?!\{|}|not|and|or|<|>|\(|\)|,).*$/i,
  OPEN_PAREN: /^\($/,
  CLOSE_PAREN: /^\)$/,
  NOT: /^not$/i,
  AND: /^and$/i,
  OR: /^or$/i,
  OPEN_CURLY: /^\{$/,
  CLOSE_CURLY: /^\}$/,
  COMMA: /^,$/,
  CMP: /^(<=|>=|!=|<|>|=)$/,
  NUMBER: /^\d+$/,
  NEIGHBORS: /^neighbors$/i,
};

const QUERY_FIELDS = new Set(["name", "attr", "attrs", "type", "neighbors", "source", "target"]);

export function parseAttribsFilter(input) {
  try {
    return parseAttribsFilterInternal(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.startsWith("Invalid query:")) throw error;
    throw new Error(`Invalid query: ${message}`);
  }
}

function parseAttribsFilterInternal(input) {
  if (!input) return true;

  log.info("Parsing attributes filter:\n", input);

  const cleanedInput = normalizeQuerySyntax(input);
  if (!cleanedInput) return true;

  const tokens = cleanedInput
    .match(/"[^"]*"|<=|>=|!=|=|<|>|,|\(|\)|{|}|[^\s()<>{},!="]+/g)
    ?.map((t) => (t.startsWith('"') ? t.slice(1, -1) : t));

  if (!tokens) return true;

  const states = {
    state0: newTermConjunction,
    state1: conjunction,
    state2: notTermConjunction,
    state3: newTermDisjunction,
    state4: disjunction,
    state5: notTermDisjunction,
    state6: start,
    state7: curlyCommaConjunction,
    state8: newTermCurlyConjunction,
    state9: curlyCommaDisjunction,
    state10: newTermCurlyDisjunction,
    state11: smallerGreaterTermConjunction,
    state12: smallerGreaterTermDisjunction,
    state13: metricComparatorConjunction,
    state14: metricNumberConjunction,
    state15: metricComparatorDisjunction,
    state16: metricNumberDisjunction,
  };
  const endStates = new Set(["state6", "state1"]);

  let currentState = "state6";
  const processedRequest = [];

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (!(currentState in states)) throw new Error(`Invalid state: ${currentState}`);
    currentState = states[currentState](processedRequest, token, tokens[index + 1]);
  }

  if (!(currentState in states)) throw new Error(`Invalid state: ${currentState}`);
  if (!endStates.has(currentState)) {
    throw new Error(`Expected ${getExpectedEndToken(currentState)} before the end of the query`);
  }

  return processedRequest;
}

export function normalizeQuerySyntax(input) {
  let query = String(input ?? "").trim().replace(/[“”„‟]/g, '"');
  validateCanonicalSyntax(query);
  validateQueryFields(query);
  validateQueryFieldValues(query);
  validateExplicitTerms(query);

  query = query.replace(/\bneighbors\s*:\s*(<=|>=|!=|=|<|>)\s*(\d+)\b/gi, "neighbors $1 $2");
  query = query.replace(/\battrs\s*:\s*(<=|>=|!=|=|<|>)\s*(\d+)\b/gi, "$1 $2");

  query = query.replace(
    /\b(name|attr|type|source|target)\s*:\s*("[^"]*"|[^\s(){} ,]+)/gi,
    (_, field, rawValue) => {
      const value = rawValue.startsWith('"') ? rawValue.slice(1, -1) : rawValue;
      return `"${QUERY_FIELD_PREFIX}${field.toLowerCase()}:${value}"`;
    },
  );

  return query.replace(/\s+/g, " ").trim();
}

function validateCanonicalSyntax(query) {
  if ((query.match(/"/g)?.length ?? 0) % 2 !== 0) {
    throw new Error("Expected a closing quote");
  }
  const unquotedQuery = query.replace(/"[^"]*"/g, "");
  if (/[≥≤≠]|&&|\|\||!(?!=)/.test(unquotedQuery)) {
    throw new Error("Use and, or, not, and the comparators =, !=, >, >=, <, or <=.");
  }
  if (/\bneighbors\b(?!\s*:)/i.test(unquotedQuery)) {
    throw new Error("Use neighbors:<comparison>, for example neighbors:>3.");
  }
  if (/(^|\(|\b(?:and|or)\b)\s*(?:<=|>=|!=|=|<|>)\s*\d+/i.test(unquotedQuery)) {
    throw new Error("Use attrs:<comparison>, for example attrs:>=2.");
  }
}

function validateQueryFields(query) {
  const unquotedQuery = maskQuotedValues(query);
  for (const match of unquotedQuery.matchAll(/\b([a-z][a-z0-9_-]*)\s*:/gi)) {
    const field = match[1].toLowerCase();
    if (!QUERY_FIELDS.has(field)) {
      throw new Error(`Unknown field '${field}'. Use name, attr, attrs, type, neighbors, source, or target.`);
    }
  }
}

function validateQueryFieldValues(query) {
  const maskedQuery = maskQuotedValues(query);

  for (const match of maskedQuery.matchAll(/\b(name|attr|attrs|type|neighbors|source|target)\s*:/gi)) {
    const field = match[1].toLowerCase();
    const suffix = query.slice((match.index ?? 0) + match[0].length);

    if (field === "neighbors" || field === "attrs") {
      if (!/^\s*(?:<=|>=|!=|=|<|>)\s*\d+(?=$|[\s)])/i.test(suffix)) {
        const example = field === "neighbors" ? "neighbors:>3" : "attrs:>=2";
        throw new Error(`Expected a comparator and number after '${field}:', for example ${example}`);
      }
      continue;
    }

    if (!/^\s*(?:"[^"]+"|[^\s(){} ,]+)/.test(suffix)) {
      throw new Error(`Expected a value after '${field}:'`);
    }
  }
}

function validateExplicitTerms(query) {
  const remaining = query
    .replace(/\b(?:name|attr|type|source|target)\s*:\s*(?:"[^"]+"|[^\s(){} ,]+)/gi, " ")
    .replace(/\b(?:neighbors|attrs)\s*:\s*(?:<=|>=|!=|=|<|>)\s*\d+/gi, " ")
    .replace(/\b(?:and|or|not)\b/gi, " ")
    .replace(/[()\s]/g, "");

  if (remaining) {
    throw new Error("Expected a field before each value. Use name:AKT1 for a node or link ID/name, or attr:phosphorylation for an attribute.");
  }
}

function maskQuotedValues(query) {
  return query.replace(/"[^"]*"/g, (value) => " ".repeat(value.length));
}

// ======== State functions ==========
function start(processedRequest, token, nextToken) {
  log.info("startState with token:", token);
  return newTermConjunction(processedRequest, token, nextToken);
}

function newTermConjunction(processedRequest, token, nextToken) {
  log.info("newTermConjunctionState with token:", token);

  if (TOKENS.OPEN_PAREN.test(token)) {
    processedRequest.push([]);
    return "state3";
  }
  if (TOKENS.CMP.test(token)) {
    processedRequest.push([token]);
    return "state11";
  }
  if (TOKENS.NOT.test(token)) return "state2";
  if (TOKENS.OPEN_CURLY.test(token)) {
    processedRequest.push([new Set()]);
    return "state8";
  }
  if (TOKENS.NEIGHBORS.test(token) && TOKENS.CMP.test(nextToken ?? "")) {
    processedRequest.push([{ metric: "neighbors" }]);
    return "state13";
  }
  if (TOKENS.ATTRIBUTE.test(token)) {
    processedRequest.push([token]);
    return "state1";
  }
  throw new Error(`Expected attribute or 'not' or '(' or comparator but got '${token}'`);
}

function conjunction(processedRequest, token, nextToken) {
  log.info("conjunctionState with token:", token);
  if (TOKENS.AND.test(token)) return "state0";
  if (TOKENS.OR.test(token)) {
    throw new Error(`Expected 'and' but got 'or'. Put alternatives in parentheses, for example (abc or cde)`);
  }
  throw new Error(`Expected 'and' but got '${token}'`);
}

function notTermConjunction(processedRequest, token) {
  log.info("notTermConjunctionState with token:", token);

  if (TOKENS.OPEN_CURLY.test(token)) {
    processedRequest.push(["not", new Set()]);
    return "state8";
  }
  if (TOKENS.ATTRIBUTE.test(token)) {
    processedRequest.push(["not", token]);
    return "state1";
  }
  throw new Error(`Expected attribute or '{' but got '${token}'`);
}

function newTermDisjunction(processedRequest, token, nextToken) {
  log.info("newTermDisjunctionState with token:", token);
  const last = processedRequest[processedRequest.length - 1];

  if (TOKENS.OPEN_CURLY.test(token)) {
    last.push(new Set());
    return "state10";
  }
  if (TOKENS.CMP.test(token)) {
    last.push(token);
    return "state12";
  }
  if (TOKENS.NOT.test(token)) return "state5";
  if (TOKENS.NEIGHBORS.test(token) && TOKENS.CMP.test(nextToken ?? "")) {
    last.push({ metric: "neighbors" });
    return "state15";
  }
  if (TOKENS.ATTRIBUTE.test(token)) {
    last.push(token);
    return "state4";
  }
  throw new Error(`Expected attribute, 'not', comparator or '{' but got '${token}'`);
}

function disjunction(processedRequest, token) {
  log.info("disjunctionState with token:", token);

  if (TOKENS.OR.test(token)) return "state3";
  if (TOKENS.CLOSE_PAREN.test(token)) return "state1";
  throw new Error(`Expected 'or' or ')' but got '${token}'`);
}

function notTermDisjunction(processedRequest, token) {
  log.info("notTermDisjunctionState with token:", token);
  const last = processedRequest[processedRequest.length - 1];

  if (TOKENS.OPEN_CURLY.test(token)) {
    last.push("not", new Set());
    return "state10";
  }
  if (TOKENS.ATTRIBUTE.test(token)) {
    last.push("not", token);
    return "state4";
  }
  throw new Error(`Expected attribute or '{' but got '${token}'`);
}

function curlyCommaConjunction(_, token) {
  log.info("curlyCommaConjunctionState with token:", token);
  if (TOKENS.CLOSE_CURLY.test(token)) return "state1";
  if (TOKENS.COMMA.test(token)) return "state8";
  throw new Error(`Expected ',' or '}' but got '${token}'`);
}

function newTermCurlyConjunction(processedRequest, token) {
  log.info("newTermCurlyConjunctionState with token:", token);
  const set = getCurrentSet(processedRequest, token);

  if (TOKENS.ATTRIBUTE.test(token)) {
    set.add(token);
    return "state7";
  }
  throw new Error(`Expected attribute but got '${token}'`);
}

function curlyCommaDisjunction(_, token) {
  log.info("curlyCommaDisjunctionState with token:", token);
  if (TOKENS.CLOSE_CURLY.test(token)) return "state4";
  if (TOKENS.COMMA.test(token)) return "state10";
  throw new Error(`Expected ',' or '}' but got '${token}'`);
}

function newTermCurlyDisjunction(processedRequest, token) {
  log.info("newTermCurlyDisjunctionState with token:", token);
  const set = getCurrentSet(processedRequest, token);

  if (TOKENS.ATTRIBUTE.test(token)) {
    set.add(token);
    return "state9";
  }
  throw new Error(`Expected attribute but got '${token}'`);
}

function smallerGreaterTermConjunction(processedRequest, token) {
  log.info("smallerGreaterTermConjunctionState with token:", token);
  if (TOKENS.NUMBER.test(token)) {
    processedRequest[processedRequest.length - 1].push(token);
    return "state1";
  }
  throw new Error(`Expected number but got '${token}'`);
}

function smallerGreaterTermDisjunction(processedRequest, token) {
  log.info("smallerGreaterTermDisjunctionState with token:", token);
  if (TOKENS.NUMBER.test(token)) {
    processedRequest[processedRequest.length - 1].push(token);
    return "state4";
  }
  throw new Error(`Expected number but got '${token}'`);
}

function metricComparatorConjunction(processedRequest, token) {
  if (!TOKENS.CMP.test(token)) throw new Error(`Expected comparator after 'neighbors' but got '${token}'`);
  getCurrentMetric(processedRequest, token).comparator = token;
  return "state14";
}

function metricNumberConjunction(processedRequest, token) {
  if (!TOKENS.NUMBER.test(token)) throw new Error(`Expected number after neighbor comparator but got '${token}'`);
  getCurrentMetric(processedRequest, token).value = Number(token);
  return "state1";
}

function metricComparatorDisjunction(processedRequest, token) {
  if (!TOKENS.CMP.test(token)) throw new Error(`Expected comparator after 'neighbors' but got '${token}'`);
  getCurrentMetric(processedRequest, token).comparator = token;
  return "state16";
}

function metricNumberDisjunction(processedRequest, token) {
  if (!TOKENS.NUMBER.test(token)) throw new Error(`Expected number after neighbor comparator but got '${token}'`);
  getCurrentMetric(processedRequest, token).value = Number(token);
  return "state4";
}

// ========= helper functions =========
function getCurrentSet(processedRequest, token) {
  const last = processedRequest[processedRequest.length - 1];
  if (!Array.isArray(last) || !(last[last.length - 1] instanceof Set)) {
    throw new Error(`Expected a Set object but got '${token}'`);
  }
  return last[last.length - 1];
}

function getCurrentMetric(processedRequest, token) {
  const last = processedRequest[processedRequest.length - 1];
  const metric = Array.isArray(last) ? last[last.length - 1] : null;
  if (!metric || typeof metric !== "object" || metric.metric !== "neighbors") {
    throw new Error(`Expected neighbor metric but got '${token}'`);
  }
  return metric;
}

function getExpectedEndToken(state) {
  const expectedByState = {
    state0: "a condition after 'and'",
    state2: "a condition after 'not'",
    state3: "a condition inside the parentheses",
    state4: "'or' or ')'",
    state5: "a condition after 'not'",
    state7: "',' or '}'",
    state8: "an attribute",
    state9: "',' or '}'",
    state10: "an attribute",
    state11: "a number after the comparator",
    state12: "a number after the comparator",
    state13: "a comparator after 'neighbors'",
    state14: "a number after the neighbor comparator",
    state15: "a comparator after 'neighbors'",
    state16: "a number after the neighbor comparator",
  };
  return expectedByState[state] ?? "a complete condition";
}
