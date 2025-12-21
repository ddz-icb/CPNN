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

    const disableLasso = enableLasso({
      app: renderState.app,
      nodeMap: pixiState.nodeMap,
      lineColor: theme.circleBorderColor,
      onSelect: ({ nodes }) => {
        const selectedNodes = Array.isArray(nodes) ? nodes : [];
        if (selectedNodes.length > 0) {
          setFilter("lassoSelection", selectedNodes);
        }
        setFilter("lasso", false);
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
}
