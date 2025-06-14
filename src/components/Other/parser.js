import log from "../../logger.js";

const MATCH_ATTRIBUTE = /^.+$/; // Matches any non-empty string
const MATCH_OPEN_PAREN = /^\($/; // Matches '('
const MATCH_CLOSE_PAREN = /^\)$/; // Matches ')'
const MATCH_NOT = /^not$/; // Matches the word "not"
const MATCH_AND = /^and$/; // Matches the word "and"
const MATCH_OR = /^or$/; // Matches the word "or"

export function parseAttributesFilter(input) {
  // return errormessage beginning with "Error:" if not valid.
  // retrun true if empty
  // otherwise return parsed value
  if (input === "") return true;
  log.info("Parsing attributes filter:\n", input);

  const tokens = input.match(/"[^"]*"|\(|\)|[^\s()"]+/g).map((token) => (token.startsWith('"') ? token : token.replace(/"/g, "")));

  if (tokens[tokens.length - 1] === "") {
    tokens.pop();
  }

  const stateFunctions = {
    state0: newTermConjunction,
    state1: conjunction,
    state2: notTermConjunction,
    state3: newTermDisjunction,
    state4: disjunction,
    state5: notTermDisjunction,
    state6: start,
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

  if (!endStates.has(currentState)) {
    return "Error: the received statement is not complete";
  }

  console.log("PROCESSED REQUESTF", processedFilterRequest);

  return processedFilterRequest;
}

function start(processedFilterRequest, token) {
  log.info("startState with token: ", token);

  if (MATCH_OPEN_PAREN.test(token)) {
    processedFilterRequest.push([]);
    return "state3";
  } else if (MATCH_NOT.test(token)) {
    return "state2";
  } else if (MATCH_ATTRIBUTE.test(token)) {
    processedFilterRequest.push([token]);
    return "state1";
  } else {
    return `Error: Expected string or 'not' or '(' but got: '${token}'`;
  }
}

function newTermConjunction(processedFilterRequest, token) {
  log.info("newTermConjunctionState with token: ", token);

  if (MATCH_OPEN_PAREN.test(token)) {
    processedFilterRequest.push([]);
    return "state3";
  } else if (MATCH_NOT.test(token)) {
    return "state2";
  } else if (MATCH_ATTRIBUTE.test(token)) {
    processedFilterRequest.push([token]);
    return "state1";
  } else {
    return `Error: Expected string or 'not' or '(' but got: '${token}'`;
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

  if (MATCH_ATTRIBUTE.test(token)) {
    processedFilterRequest.push(["not", token]);
    return "state1";
  } else {
    return `Error: Expected string but got: '${token}'`;
  }
}

function newTermDisjunction(processedFilterRequest, token) {
  log.info("newTermDisjunctionState with token: ", token);

  if (MATCH_NOT.test(token)) {
    return "state5";
  } else if (MATCH_ATTRIBUTE.test(token)) {
    let previousElement = processedFilterRequest[processedFilterRequest.length - 1];
    if (previousElement) {
      previousElement.push(token);
    } else {
      return `Error: Expected string or 'not' but got: '${token}'`;
    }
    return "state4";
  } else {
    return `Error: Expected string or 'not' but got: '${token}'`;
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

  if (MATCH_ATTRIBUTE.test(token)) {
    let previousElement = processedFilterRequest[processedFilterRequest.length - 1];
    if (previousElement) {
      previousElement.push("not");
      previousElement.push(token);
    } else {
      return `Error: Expected string but got: '${token}'`;
    }
    return "state4";
  } else {
    return `Error: Expected string but got: '${token}'`;
  }
}
