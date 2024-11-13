import log from "../../logger.js";

export function parseGroupsFilter(input) {
  // return errormessage beginning with "Error:" if not valid.
  // retrun true if empty
  // otherwise return parsed value
  if (input === "") return true;
  log.info("Parsing groups filter", input);

  const tokens = input.match(/"[^"]*"|\(|\)|\S+/g).map((token) => token.replace(/"/g, ""));

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === "(" && tokens[i + 1]) {
      tokens[i + 1] = "(" + tokens[i + 1];
      tokens.splice(i, 1);
    }
    if (tokens[i] === ")" && tokens[i - 1]) {
      tokens[i - 1] = tokens[i - 1] + ")";
      tokens.splice(i, 1);
    }
  }

  if (tokens[tokens.length - 1] === "") {
    tokens.pop();
  }

  const stateFunctions = {
    state0: firstTerm,
    state1: conjunction,
    state2: finishedTerm,
    state3: inTerm,
    state4: newTerm,
  };
  const endStates = new Set(["state0", "state2"]);

  let currentState = "state0";

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
  return processedFilterRequest;
}

function firstTerm(processedFilterRequest, token) {
  log.info("firstTermState with token: ", token);

  if (/^\(.+$/.test(token)) {
    const string = token.slice(1);
    processedFilterRequest.push([string]);

    return "state1";
  } else if (/^.+$/.test(token)) {
    processedFilterRequest.push([token]);

    return "state2";
  } else {
    return `Error: Expected 'string' or '(string' but got: '${token}'`;
  }
}

function conjunction(processedFilterRequest, token) {
  log.info("conjunctionState with token: ", token);

  if (/^or$/.test(token)) {
    return "state3";
  } else {
    return `Error: Expected 'or' but got: '${token}'`;
  }
}

function finishedTerm(processedFilterRequest, token) {
  log.info("finishedTermState with token: ", token);

  if (/^and$/.test(token)) {
    return "state4";
  } else {
    return `Error: Expected 'and' but got: '${token}'`;
  }
}

function inTerm(processedFilterRequest, token) {
  log.info("inTermState with token: ", token);

  if (/^[^\)]+$/.test(token)) {
    let lastElement = processedFilterRequest[processedFilterRequest.length - 1];
    lastElement.push(token);

    return "state1";
  } else if (/^[^\)]+\)$/.test(token)) {
    let stringWithoutParenthesis = token.slice(0, -1);

    let lastElement = processedFilterRequest[processedFilterRequest.length - 1];
    lastElement.push(stringWithoutParenthesis);

    return "state2";
  } else {
    return `Error: Expected 'string' or 'string)' but got: '${token}'`;
  }
}

function newTerm(processedFilterRequest, token) {
  log.info("newTermState with token: ", token);

  if (/^\(.+$/.test(token)) {
    const string = token.slice(1);
    processedFilterRequest.push([string]);

    return "state1";
  } else if (/^.+$/.test(token)) {
    processedFilterRequest.push([token]);

    return "state2";
  } else {
    return `Error: Expected '(string' or 'string' but got: '${token}'`;
  }
}
