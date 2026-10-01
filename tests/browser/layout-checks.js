import { expect } from "@playwright/test";

// Shared rules for any panel or popup. Vertical scrolling and explicit ellipses
// are intentional; off-screen windows and accidentally clipped text are not.
export async function expectLayoutFits(container) {
  await expect(container).toBeVisible();
  await container.evaluate(async (root) => {
    await document.fonts.ready;
    await Promise.all(root.getAnimations({ subtree: true })
      .filter((animation) => animation.effect.getTiming().iterations !== Infinity)
      .map((animation) => animation.finished));
  });
  const problems = await container.evaluate((root) => {
    const problems = [];
    const bounds = root.getBoundingClientRect();
    if (bounds.left < -1 || bounds.top < -1 || bounds.right > innerWidth + 1 || bounds.bottom > innerHeight + 1) {
      problems.push("Window extends outside the viewport");
    }
    if (root.scrollWidth > root.clientWidth + 1) problems.push("Window overflows horizontally");

    const textNodes = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (textNodes.nextNode()) {
      const text = textNodes.currentNode;
      const element = text.parentElement;
      if (!text.textContent.trim() || element.closest("script, style, textarea, select, .CodeMirror, .cm-editor, [hidden]")) continue;
      const range = document.createRange();
      range.selectNodeContents(text);
      const rect = range.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.bottom <= bounds.top || rect.top >= bounds.bottom) continue;
      // Allow the deliberate truncation used for long names in lists.
      let clipped = false, ellipsis = false;
      for (let parent = element; parent && root.contains(parent); parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (style.visibility === "hidden" || style.display === "none") { ellipsis = true; break; }
        if (style.textOverflow === "ellipsis") ellipsis = true;
        if (["hidden", "clip", "auto", "scroll"].includes(style.overflowX)) {
          const box = parent.getBoundingClientRect();
          if (rect.left < box.left - 1 || rect.right > box.right + 1) clipped = true;
        }
      }
      if (!ellipsis && (clipped || rect.left < bounds.left - 1 || rect.right > bounds.right + 1)) {
        problems.push(`Text does not fit: ${text.textContent.trim().slice(0, 80)}`);
      }
    }
    return [...new Set(problems)];
  });
  expect(problems, "UI layout problems").toEqual([]);
}
