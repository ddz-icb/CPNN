import CodeMirror from "codemirror";

CodeMirror.defineSimpleMode("customMode", {
  start: [
    { regex: /[0-9]+/, token: "def" },
    { regex: /(or|and)/, token: "number" },
    { regex: /[()]+/, token: "meta" },
    { regex: /[^()\s]+/, token: "def" },
  ],
});
