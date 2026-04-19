const NON_TEXT_INPUT_TYPES = new Set(["button", "checkbox", "color", "file", "hidden", "image", "radio", "range", "reset", "submit"]);

/** Returns true if the currently focused element is a text-entry target. */
export function isTypingTarget(el) {
  if (!el) return false;

  const tag = el.tagName;
  if (tag === "INPUT") {
    const inputType = (el.getAttribute("type") || "text").toLowerCase();
    return !NON_TEXT_INPUT_TYPES.has(inputType);
  }

  return tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable || el.closest?.(".CodeMirror") !== null;
}

/** Returns true if a modal popup is currently mounted. */
export function isPopupOpen() {
  return !!document.querySelector(".popup-overlay");
}
