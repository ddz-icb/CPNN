import log from "../../logger.js";

const MATCH_ATTRIBUTE = /^(?!\{|}|not|and|or|<|>|\(|\)|,).*$/; // Matches non-empty string excluding specified tokens
const MATCH_OPEN_PAREN = /^\($/; // Matches '('
const MATCH_CLOSE_PAREN = /^\)$/; // Matches ')'
const MATCH_NOT = /^not$/; // Matches the word "not"
const MATCH_AND = /^and$/; // Matches the word "and"
const MATCH_OR = /^or$/; // Matches the word "or"
const MATCH_OPEN_CURLY = /^\{$/; // Matches '{'
const MATCH_CLOSE_CURLY = /^\}$/; // Matches '}'
const MATCH_COMMA = /^,$/; // Matches ','
const MATCH_SMALLERGREATER = /^(<=|>=|<|>|=)$/; // Matches '<', '>', '=', '<=', '>='
const MATCH_NUMBER = /^\d+$/; // Matches positive integers

export function parseAttributesFilter(input) {
  // return errormessage beginning with "Error:" if not valid.
  // retrun true if empty
  // otherwise return parsed value
  if (input === "") return true;
  log.info("Parsing attributes filter:\n", input);

  const cleanedInput = input.replace(/[“”„‟]/g, '"');
  const tokens = cleanedInput
    .match(/"[^"]*"|<=|>=|=|<|>|,|\(|\)|{|}|[^\s()<>{},="]+/g)
    .map((token) => (token.startsWith('"') ? token.slice(1, -1) : token));

  const stateFunctions = {
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

  let processedFilterRequest = [];

  for (const token of tokens) {
    if (!(currentState in stateFunctions)) {
      return currentState;
    }
    currentState = stateFunctions[currentState](processedFilterRequest, token);
  }

  if (!(currentState in stateFunctions)) {
    return currentState;
  }
  if (!endStates.has(currentState)) {
    return "Error: the received statement is not complete";
  }

  return processedFilterRequest;
}

function start(processedFilterRequest, token) {
  log.info("startState with token: ", token);

  if (MATCH_OPEN_PAREN.test(token)) {
    processedFilterRequest.push([]);
    return "state3";
  } else if (MATCH_SMALLERGREATER.test(token)) {
    processedFilterRequest.push([token]);
    return "state11";
  } else if (MATCH_NOT.test(token)) {
    return "state2";
  } else if (MATCH_OPEN_CURLY.test(token)) {
    processedFilterRequest.push([new Set()]);
    return "state8";
  } else if (MATCH_ATTRIBUTE.test(token)) {
    processedFilterRequest.push([token]);
    return "state1";
  } else {
    return `Error: Expected attribute or 'not' or '(' or '<' or '>' but got: '${token}'`;
  }
}

function newTermConjunction(processedFilterRequest, token) {
  log.info("newTermConjunctionState with token: ", token);

  if (MATCH_OPEN_PAREN.test(token)) {
    processedFilterRequest.push([]);
    return "state3";
  } else if (MATCH_SMALLERGREATER.test(token)) {
    processedFilterRequest.push([token]);
    return "state11";
  } else if (MATCH_NOT.test(token)) {
    return "state2";
  } else if (MATCH_OPEN_CURLY.test(token)) {
    processedFilterRequest.push([new Set()]);
    return "state8";
  } else if (MATCH_ATTRIBUTE.test(token)) {
    processedFilterRequest.push([token]);
    return "state1";
  } else {
    return `Error: Expected attribute or 'not' or '(' or '<' or '>' but got: '${token}'`;
  }
}

function conjunction(processedFilterRequest, token) {
  log.info("conjunctionState with token: ", token);

  if (MATCH_AND.test(token)) {
    return "state0";
  } else {
    return `Error: Expected 'and' but got: '${token}'`;
  }
}

function notTermConjunction(processedFilterRequest, token) {
  log.info("notTermConjunctionState with token: ", token);

  if (MATCH_OPEN_CURLY.test(token)) {
    processedFilterRequest.push(["not", new Set()]);
    return "state8";
  } else if (MATCH_ATTRIBUTE.test(token)) {
    processedFilterRequest.push(["not", token]);
    return "state1";
  } else {
    return `Error: Expected attribute or '{' but got: '${token}'`;
  }
}

function newTermDisjunction(processedFilterRequest, token) {
  log.info("newTermDisjunctionState with token: ", token);

  if (MATCH_OPEN_CURLY.test(token)) {
    let previousElement = processedFilterRequest[processedFilterRequest.length - 1];
    previousElement.push(new Set());
    return "state10";
  } else if (MATCH_SMALLERGREATER.test(token)) {
    let previousElement = processedFilterRequest[processedFilterRequest.length - 1];
    previousElement.push(token);
    return "state12";
  } else if (MATCH_NOT.test(token)) {
    return "state5";
  } else if (MATCH_ATTRIBUTE.test(token)) {
    let previousElement = processedFilterRequest[processedFilterRequest.length - 1];
    previousElement.push(token);
    return "state4";
  } else {
    return `Error: Expected attribute or 'not' or '<' or '>' but got: '${token}'`;
  }
}

function disjunction(processedFilterRequest, token) {
  log.info("disjunctionState with token: ", token);

  if (MATCH_OR.test(token)) {
    return "state3";
  } else if (MATCH_CLOSE_PAREN) {
    return "state1";
  } else {
    return `Error: Expected 'or' or ')' but got: '${token}'`;
  }
}

function notTermDisjunction(processedFilterRequest, token) {
  log.info("notTermDisjunctionState with token: ", token);

  if (MATCH_OPEN_CURLY.test(token)) {
    let previousElement = processedFilterRequest[processedFilterRequest.length - 1];
    previousElement.push("not");
    previousElement.push(new Set());
    return "state10";
  } else if (MATCH_ATTRIBUTE.test(token)) {
    let previousElement = processedFilterRequest[processedFilterRequest.length - 1];
    previousElement.push("not");
    previousElement.push(token);
    return "state4";
  } else {
    return `Error: Expected attribute but got: '${token}'`;
  }
}

function curlyCommaConjunction(processedFilterRequest, token) {
  log.info("curlyCommaConjunctionState with token: ", token);

  if (MATCH_CLOSE_CURLY.test(token)) {
    return "state1";
  } else if (MATCH_COMMA.test(token)) {
    return "state8";
  } else {
    return `Error: Expected ',' or '}' but got: '${token}'`;
  }
}

function newTermCurlyConjunction(processedFilterRequest, token) {
  log.info("newTermCurlyConjunctionState with token: ", token);

  let lastEntry = processedFilterRequest[processedFilterRequest.length - 1];
  let currentSet;

  if (Array.isArray(lastEntry) && lastEntry.length > 0) {
    currentSet = lastEntry[lastEntry.length - 1];
    if (!(currentSet instanceof Set)) {
      return `Error: Expected a Set object for curly term but got: '${token}'`;
    }
  } else {
    return `Error: Invalid state for curly term. Expected an array containing a Set. Got: '${token}'`;
  }

  if (MATCH_ATTRIBUTE.test(token)) {
    currentSet.add(token);
    return "state7";
  } else {
    return `Error: Expected attribute but got: '${token}'`;
  }
}

function curlyCommaDisjunction(processedFilterRequest, token) {
  log.info("curlyCommaDisjunctionState with token: ", token);

  if (MATCH_CLOSE_CURLY.test(token)) {
    return "state4";
  } else if (MATCH_COMMA.test(token)) {
    return "state10";
  } else {
    return `Error: Expected ',' or '}' but got: '${token}'`;
  }
}

function newTermCurlyDisjunction(processedFilterRequest, token) {
  log.info("newTermCurlyDisjunctionState with token: ", token);

  let lastEntry = processedFilterRequest[processedFilterRequest.length - 1];
  let currentSet;

  if (Array.isArray(lastEntry) && lastEntry.length > 0) {
    currentSet = lastEntry[lastEntry.length - 1];
    if (!(currentSet instanceof Set)) {
      return `Error: Expected a Set object for curly term but got: '${token}'`;
    }
  } else {
    return `Error: Invalid state for curly term. Expected an array containing a Set. Got: '${token}'`;
  }

  if (MATCH_ATTRIBUTE.test(token)) {
    currentSet.add(token);
    return "state9";
  } else {
    return `Error: Expected attribute but got: '${token}'`;
  }
}

function smallerGreaterTermConjunction(processedFilterRequest, token) {
  log.info("smallerGreaterTermConjunctionState with token: ", token);

  if (MATCH_NUMBER.test(token)) {
    let previousElement = processedFilterRequest[processedFilterRequest.length - 1];
    previousElement.push(token);
    return "state1";
  } else {
    return `Error: Expected number but got: '${token}'`;
  }
}

function smallerGreaterTermDisjunction(processedFilterRequest, token) {
  log.info("smallerGreaterTermDisjunctionState with token: ", token);

  if (MATCH_NUMBER.test(token)) {
    let previousElement = processedFilterRequest[processedFilterRequest.length - 1];
    previousElement.push(token);
    return "state4";
  } else {
    return `Error: Expected number but got: '${token}'`;
  }
}
