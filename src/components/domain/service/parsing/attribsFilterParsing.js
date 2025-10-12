import log from "../../../adapters/logging/logger.js";

const TOKENS = {
  ATTRIBUTE: /^(?!\{|}|not|and|or|<|>|\(|\)|,).*$/,
  OPEN_PAREN: /^\($/,
  CLOSE_PAREN: /^\)$/,
  NOT: /^not$/,
  AND: /^and$/,
  OR: /^or$/,
  OPEN_CURLY: /^\{$/,
  CLOSE_CURLY: /^\}$/,
  COMMA: /^,$/,
  CMP: /^(<=|>=|<|>|=)$/,
  NUMBER: /^\d+$/,
};

export function parseAttribsFilter(input) {
  if (!input) return true;

  log.info("Parsing attributes filter:\n", input);

  const cleanedInput = input.replace(/[“”„‟]/g, '"');
  if (!cleanedInput) return true;

  const tokens = cleanedInput.match(/"[^"]*"|<=|>=|=|<|>|,|\(|\)|{|}|[^\s()<>{},="]+/g)?.map((t) => (t.startsWith('"') ? t.slice(1, -1) : t));

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
  };
  const endStates = new Set(["state6", "state1"]);

  let currentState = "state6";
  const processedRequest = [];

  for (const token of tokens) {
    if (!(currentState in states)) throw new Error(`Invalid state: ${currentState}`);
    currentState = states[currentState](processedRequest, token);
  }

  if (!(currentState in states)) throw new Error(`Invalid state: ${currentState}`);
  if (!endStates.has(currentState)) throw new Error("The received statement is not complete");

  return processedRequest;
}

// ======== State functions ==========
function start(processedRequest, token) {
  log.info("startState with token:", token);
  return newTermConjunction(processedRequest, token);
}

function newTermConjunction(processedRequest, token) {
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
  if (TOKENS.ATTRIBUTE.test(token)) {
    processedRequest.push([token]);
    return "state1";
  }
  throw new Error(`Expected attribute or 'not' or '(' or comparator but got '${token}'`);
}

function conjunction(processedRequest, token) {
  log.info("conjunctionState with token:", token);
  if (TOKENS.AND.test(token)) return "state0";
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

function newTermDisjunction(processedRequest, token) {
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

// ========= helper functions =========
function getCurrentSet(processedRequest, token) {
  const last = processedRequest[processedRequest.length - 1];
  if (!Array.isArray(last) || !(last[last.length - 1] instanceof Set)) {
    throw new Error(`Expected a Set object but got '${token}'`);
  }
  return last[last.length - 1];
}
