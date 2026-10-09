/**
 * Single source of truth for sidebar sections and their keyboard shortcuts.
 *
 * To add a new section:
 *   1. Add an entry here with a unique `key` and `shortcut`
 *   2. Add its component to `sidebarComponents` in sidebar.jsx
 *   3. Add its icon to selectionSidebar.jsx
 */

export const SIDEBAR_SECTIONS = [
  { key: "Data", shortcut: "d" },
  { key: "Additional Data", shortcut: "l" },
  { key: "Search", shortcut: "s" },
  { key: "Filter", shortcut: "f" },
  { key: "Communities", shortcut: "c" },
  { key: "Physics", shortcut: "p" },
  { key: "Appearance", shortcut: "a" },
  { key: "Videography", shortcut: "v" },
  { key: "Export", shortcut: "e" },
  { key: "Cite & Imprint", shortcut: "b" },
];

// Reverse lookup: shortcut letter -> section key, e.g. { d: "Data", s: "Search", … }
export const SIDEBAR_SHORTCUT_MAP = Object.fromEntries(SIDEBAR_SECTIONS.map(({ key, shortcut }) => [shortcut, key]));

// Forward lookup: section key -> display shortcut, e.g. { Data: "D", Search: "S", … }
export const SIDEBAR_SHORTCUT_BY_KEY = Object.fromEntries(SIDEBAR_SECTIONS.map(({ key, shortcut }) => [key, shortcut.toUpperCase()]));
