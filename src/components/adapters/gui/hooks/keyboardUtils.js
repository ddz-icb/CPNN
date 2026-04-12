/** Returns true if the currently focused element is a text-entry target. */
export function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable ||
    el.closest?.(".CodeMirror") !== null
  );
}

/** Returns true if a modal popup is currently mounted. */
export function isPopupOpen() {
  return !!document.querySelector(".popup-overlay");
}
