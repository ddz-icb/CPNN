import { useEffect, useRef } from "react";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/mode/simple.js";
import "codemirror/theme/material.css";
import "../../config/editorSyntaxHighlighting.js";

const BASE_OPTIONS = {
  mode: "customMode",
  linewrapping: false,
  bracketMatching: true,
  scrollbarStyle: "null",
};

export function useSidebarCodeEditor({ textareaRef, value, onChange, themeName }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (!textareaRef.current || editorRef.current) return;

    editorRef.current = CodeMirror.fromTextArea(textareaRef.current, {
      ...BASE_OPTIONS,
      theme: "default",
    });
    editorRef.current.setSize("100%", "100%");
    editorRef.current.on("change", onChange);

    return () => {
      if (!editorRef.current) return;
      editorRef.current.off("change", onChange);
      editorRef.current.toTextArea();
      editorRef.current = null;
    };
  }, [textareaRef, onChange]);

  useEffect(() => {
    if (!editorRef.current) return;

    const currentValue = editorRef.current.getValue();
    if (currentValue !== value) {
      editorRef.current.setValue(value ?? "");
    }
  }, [value]);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.setOption("theme", themeName === "light" ? "default" : "material");
  }, [themeName]);

  return editorRef;
}
