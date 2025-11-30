import { useEffect, useRef } from "react";
import { useRenderState } from "../state/canvasState";
import { useFilter } from "../state/filterState";
import { usePixiState } from "../state/pixiState";
import { useTheme } from "../state/themeState";
import { enableLasso } from "../../domain/service/canvas_interaction/lasso";

export function Lasso() {
  const { theme } = useTheme();
  const { pixiState } = usePixiState();
  const { renderState } = useRenderState();
  const { filter, setFilter } = useFilter();

  const lassoRef = useRef(null);

  // lasso function
  useEffect(() => {
    if (!filter.lasso || !renderState.app || !pixiState.nodeMap) {
      return;
    }

    setFilter("lassoSelection", []);

    const disableLasso = enableLasso({
      app: renderState.app,
      nodeMap: pixiState.nodeMap,
      lineColor: theme.circleBorderColor,
      onSelect: ({ nodes }) => {
        setFilter("lassoSelection", Array.isArray(nodes) ? nodes : []);
      },
    });
    lassoRef.current = disableLasso;

    return () => {
      if (lassoRef.current === disableLasso) {
        lassoRef.current = null;
      }
      if (typeof disableLasso === "function") {
        disableLasso();
      }
    };
  }, [filter.lasso, renderState.app, pixiState.nodeMap, theme, setFilter]);

  useEffect(() => {
    if (!filter.lasso) {
      lassoRef.current?.clearSelection?.();
      lassoRef.current = null;
      if (Array.isArray(filter.lassoSelection) && filter.lassoSelection.length === 0) {
        return;
      }
      setFilter("lassoSelection", []);
      return;
    }

    if (!Array.isArray(filter.lassoSelection) || filter.lassoSelection.length > 0) {
      return;
    }

    lassoRef.current?.clearSelection?.();
  }, [filter.lasso, filter.lassoSelection, setFilter]);
}
