import { useEffect } from "react";
import { SIDEBAR_SHORTCUT_MAP } from "../../config/sidebarConfig.js";
import { isTypingTarget, isPopupOpen } from "./keyboardUtils.js";

/**
 * Registers global keyboard shortcuts for the lifetime of the component.
 *
 * Behaviour:
 *  - Escape         → navigate back to the section selection menu
 *  - Letter keys    → open the matching sidebar section (see sidebarConfig.js)
 *  - Action keys    → run the matching action regardless of the active sidebar
 *
 * Guards (shortcuts are suppressed when):
 *  - A text-entry element (input, textarea, select, contenteditable, CodeMirror) is focused
 *  - A modal popup overlay is open
 */
export function useSidebarKeyboard(setActiveNavItem, shortcutActions = {}) {
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

      const key = e.key?.toLowerCase();
      const action = shortcutActions[key];
      if (action) {
        if (!e.repeat && action() !== false) e.preventDefault();
        return;
      }

      const target = SIDEBAR_SHORTCUT_MAP[key];
      if (target) {
        e.preventDefault();
        setActiveNavItem(target);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setActiveNavItem, shortcutActions]);
}
