import { useEffect } from "react";
import { exampleGraphJson } from "../../../../assets/exampleGraphJSON.js";
import { graphService } from "../../../application/services/graphService.js";
import { useGraphState } from "../../state/graphState.js";
import { isTypingTarget, isPopupOpen } from "./keyboardUtils.js";

/**
 * Registers digit shortcuts 1–9 to select uploaded graph files.
 * Pressing "1" selects the first uploaded graph, "2" the second, etc.
 * The example graph is excluded from the list.
 */
export function useDataFileShortcuts() {
  const { graphState } = useGraphState();

  useEffect(() => {
    const uploadedGraphNames = (graphState.uploadedGraphNames ?? []).filter(
      (name) => name !== exampleGraphJson.name,
    );

    const handleKeyDown = (e) => {
      if (isTypingTarget(document.activeElement) || isPopupOpen()) return;
      const digit = parseInt(e.key, 10);
      if (digit >= 1 && digit <= 9) {
        const filename = uploadedGraphNames[digit - 1];
        if (filename) {
          e.preventDefault();
          graphService.handleSelectGraph(filename);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [graphState.uploadedGraphNames]);
}
