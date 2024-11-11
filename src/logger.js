import log from "loglevel";

if (process.env.NODE_ENV === "development") {
  log.setLevel("debug");
  // log.setLevel('warn');
} else {
  log.setLevel("warn");
}

export default log;
