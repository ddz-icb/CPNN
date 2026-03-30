import { useEffect } from "react";
import { SIDEBAR_SHORTCUT_MAP } from "../../config/sidebarConfig.js";

/** Returns true if the currently focused element is a text-entry target. */
function isTypingTarget(el) {
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
function isPopupOpen() {
  return !!document.querySelector(".popup-overlay");
}

/**
 * Registers sidebar keyboard shortcuts for the lifetime of the component.
 *
 * Behaviour:
 *  - Escape         → navigate back to the section selection menu
 *  - Letter keys    → open the matching sidebar section (see sidebarConfig.js)
 *
 * Guards (shortcuts are suppressed when):
 *  - A text-entry element (input, textarea, select, contenteditable, CodeMirror) is focused
 *  - A modal popup overlay is open
 */
export function useSidebarKeyboard(setActiveNavItem) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const typing = isTypingTarget(document.activeElement);

      if (e.key === "Escape") {
        if (typing) {
          // Popups/tooltips consume Escape first (capture phase), so if we reach
          // here with a focused input it means no modal is open — just leave the field.
          document.activeElement.blur();
          return;
        }
        // Popups handle their own Escape via capture+stopImmediatePropagation,
        // so this only fires when no modal is open.
        setActiveNavItem("Selection");
        return;
      }

      // Letter shortcuts: suppress when typing or a popup is open.
      if (typing || isPopupOpen()) return;

      const target = SIDEBAR_SHORTCUT_MAP[e.key?.toLowerCase()];
      if (target) {
        e.preventDefault();
        setActiveNavItem(target);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []); // setActiveNavItem is a stable useState setter — no deps needed
}
