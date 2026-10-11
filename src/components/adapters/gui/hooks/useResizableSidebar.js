import { useCallback, useEffect, useRef, useState } from "react";

const resizeBodyClass = "sidebar-resize-active";

function readStoredWidth(storageKey, minWidth, maxWidth) {
  if (!storageKey || typeof window === "undefined") return null;
  try {
    const storedValue = window.localStorage.getItem(storageKey);
    if (storedValue == null) return null;
    const storedWidth = Number.parseFloat(storedValue);
    return Number.isFinite(storedWidth)
      ? Math.min(maxWidth, Math.max(minWidth, storedWidth))
      : null;
  } catch {
    return null;
  }
}

function storeWidth(storageKey, width) {
  if (!storageKey) return;
  try {
    window.localStorage.setItem(storageKey, String(width));
  } catch {
    // The current width still works when storage is unavailable.
  }
}

function rootFontSize() {
  const size = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(size) && size > 0 ? size : 16;
}

export function useResizableSidebar({
  side,
  storageKey,
  cssVariable,
  defaultWidth,
  minWidth = 20,
  maxWidth = 48,
  collapseWidth = 14,
  allowGrowth = true,
  onCollapse,
}) {
  const panelRef = useRef(null);
  const cleanupRef = useRef(null);
  const onCollapseRef = useRef(onCollapse);
  const initialWidthRef = useRef(null);
  const [width, setWidth] = useState(() => readStoredWidth(storageKey, minWidth, maxWidth));
  const committedWidthRef = useRef(width);

  useEffect(() => {
    onCollapseRef.current = onCollapse;
  }, [onCollapse]);

  useEffect(() => () => cleanupRef.current?.(), []);

  const commitWidth = useCallback((nextWidth) => {
    const clampedWidth = Math.min(maxWidth, Math.max(minWidth, nextWidth));
    committedWidthRef.current = clampedWidth;
    setWidth(clampedWidth);
    storeWidth(storageKey, clampedWidth);
  }, [maxWidth, minWidth, storageKey]);

  const handlePointerDown = useCallback((event) => {
    if (event.button !== 0 || !panelRef.current) return;
    event.preventDefault();

    cleanupRef.current?.();
    const panel = panelRef.current;
    const startX = event.clientX;
    const startWidth = panel.getBoundingClientRect().width;
    const fontSize = rootFontSize();
    const startWidthRem = startWidth / fontSize;
    if (initialWidthRef.current == null) initialWidthRef.current = startWidthRem;
    const dragMaxWidth = allowGrowth ? maxWidth : initialWidthRef.current;
    let pendingWidth = startWidthRem;

    panel.classList.add("sidebar-is-resizing");
    document.body.classList.add(resizeBodyClass);

    const handlePointerMove = (moveEvent) => {
      const horizontalDelta = moveEvent.clientX - startX;
      const nextWidth = (startWidth + (side === "left" ? horizontalDelta : -horizontalDelta)) / fontSize;
      pendingWidth = Math.min(dragMaxWidth, nextWidth);
      const previewsCollapse = nextWidth <= collapseWidth;
      panel.classList.toggle("sidebar-collapse-preview", previewsCollapse);
      setWidth(previewsCollapse ? 0 : Math.max(collapseWidth, pendingWidth));
    };

    const removeListeners = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerCancel);
      panel.classList.remove("sidebar-is-resizing");
      panel.classList.remove("sidebar-collapse-preview");
      document.body.classList.remove(resizeBodyClass);
      cleanupRef.current = null;
    };

    const handlePointerUp = () => {
      removeListeners();
      if (pendingWidth <= collapseWidth) {
        setWidth(committedWidthRef.current);
        onCollapseRef.current?.();
        return;
      }
      commitWidth(pendingWidth);
    };

    const handlePointerCancel = () => {
      removeListeners();
      commitWidth(pendingWidth);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerCancel);
    cleanupRef.current = removeListeners;
  }, [allowGrowth, collapseWidth, commitWidth, maxWidth, side]);

  const handleKeyDown = useCallback((event) => {
    const grows = side === "left" ? event.key === "ArrowRight" : event.key === "ArrowLeft";
    const shrinks = side === "left" ? event.key === "ArrowLeft" : event.key === "ArrowRight";
    if (!grows && !shrinks) return;
    event.preventDefault();
    const step = event.shiftKey ? 4 : 1;
    const renderedWidth = panelRef.current
      ? panelRef.current.getBoundingClientRect().width / rootFontSize()
      : width ?? defaultWidth;
    if (initialWidthRef.current == null) initialWidthRef.current = renderedWidth;
    const growthLimit = allowGrowth ? maxWidth : initialWidthRef.current;
    commitWidth(Math.min(growthLimit, renderedWidth + (grows ? step : -step)));
  }, [allowGrowth, commitWidth, defaultWidth, maxWidth, side, width]);

  return {
    panelRef,
    panelStyle: width == null ? undefined : { [cssVariable]: `${width}rem` },
    handleProps: {
      role: "separator",
      tabIndex: 0,
      "aria-label": `Resize ${side} sidebar`,
      "aria-orientation": "vertical",
      "aria-valuemin": minWidth,
      "aria-valuemax": allowGrowth ? maxWidth : defaultWidth,
      "aria-valuenow": Math.round((width ?? defaultWidth) * 10) / 10,
      title: "Drag to resize; drag smaller to close",
      onPointerDown: handlePointerDown,
      onKeyDown: handleKeyDown,
    },
  };
}
