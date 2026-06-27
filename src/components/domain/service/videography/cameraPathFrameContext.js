import { finiteNumberOr, interpolateFiniteNumber } from "./cameraPathMath.js";
import { buildTransitionGraphData, hasGraphData } from "./graphTransitionData.js";

export function getFrameRenderContext(sample, fallback) {
  const keyframe = sample?.stepType === "transition" ? sample.to : sample?.keyframe ?? sample?.to ?? sample?.from;
  const scene = keyframe?.scene ?? {};
  const transitionGraphData =
    sample?.stepType === "transition"
      ? buildTransitionGraphData(sample.from?.scene?.graphSnapshot, sample.to?.scene?.graphSnapshot, sample.easedT)
      : null;
  const usesSnapshotGraph = hasGraphData(transitionGraphData) || hasGraphData(scene.graphSnapshot);
  const frameGraphData = transitionGraphData ?? (hasGraphData(scene.graphSnapshot) ? scene.graphSnapshot : fallback.graphData);
  const appearance = scene.appearanceSnapshot ?? {};
  const fromAppearance = sample?.from?.scene?.appearanceSnapshot ?? {};
  const toAppearance = sample?.to?.scene?.appearanceSnapshot ?? {};
  const colorscheme = scene.colorschemeSnapshot ?? {};
  const theme = scene.themeSnapshot ?? {};

  return {
    graphData: frameGraphData,
    nodeMap: usesSnapshotGraph ? null : fallback.nodeMap,
    gridLines: usesSnapshotGraph ? [] : fallback.gridLines,
    showNodeLabels: typeof appearance.showNodeLabels === "boolean" ? appearance.showNodeLabels : fallback.showNodeLabels,
    enableShading: typeof appearance.enable3DShading === "boolean" ? appearance.enable3DShading : fallback.enableShading,
    showGrid: typeof appearance.show3DGrid === "boolean" ? appearance.show3DGrid : fallback.showGrid,
    container: fallback.container,
    drawParams: getFrameDrawParams({
      sample,
      colorscheme,
      theme,
      fromAppearance,
      toAppearance,
      appearance,
      fallback,
      scene,
    }),
  };
}

function getFrameDrawParams({ sample, colorscheme, theme, fromAppearance, toAppearance, appearance, fallback, scene }) {
  const linkWidth =
    sample?.stepType === "transition"
      ? interpolateFiniteNumber(fromAppearance.linkWidth, toAppearance.linkWidth, sample.easedT, fallback.linkWidth)
      : finiteNumberOr(appearance.linkWidth, fallback.linkWidth);

  return {
    linkWidth,
    linkColorscheme: getColorschemeData(colorscheme.linkColorscheme, fallback.linkColorscheme),
    linkAttribsToColorIndices: getColorIndexMap(colorscheme.linkAttribsToColorIndices, fallback.linkAttribsToColorIndices),
    circleBorderColor: theme.circleBorderColor ?? fallback.circleBorderColor,
    textColor: theme.textColor ?? fallback.textColor,
    nodeColorscheme: getColorschemeData(colorscheme.nodeColorscheme, fallback.nodeColorscheme),
    nodeAttribsToColorIndices: getColorIndexMap(colorscheme.nodeAttribsToColorIndices, fallback.nodeAttribsToColorIndices),
    highlightNodeIds: Array.isArray(scene.searchSnapshot?.highlightedNodeIds)
      ? scene.searchSnapshot.highlightedNodeIds
      : fallback.highlightNodeIds ?? [],
    highlightLinkIds: Array.isArray(scene.searchSnapshot?.highlightedLinkIds)
      ? scene.searchSnapshot.highlightedLinkIds
      : fallback.highlightLinkIds ?? [],
    communityHighlightNodeIds: getCommunityHighlightNodeIds(scene.communitySnapshot, fallback.communityHighlightNodeIds),
    highlightColor: theme.highlightColor ?? fallback.highlightColor,
    communityHighlightColor: theme.communityHighlightColor ?? fallback.communityHighlightColor,
  };
}

function getColorschemeData(snapshotColorscheme, fallbackColorscheme) {
  if (Array.isArray(snapshotColorscheme)) return snapshotColorscheme;
  if (Array.isArray(snapshotColorscheme?.data)) return snapshotColorscheme.data;
  if (Array.isArray(fallbackColorscheme)) return fallbackColorscheme;
  if (Array.isArray(fallbackColorscheme?.data)) return fallbackColorscheme.data;
  return [];
}

function getColorIndexMap(snapshotMap, fallbackMap) {
  const normalizedSnapshot = normalizeColorIndexMap(snapshotMap);
  if (Object.keys(normalizedSnapshot).length > 0) return normalizedSnapshot;
  const normalizedFallback = normalizeColorIndexMap(fallbackMap);
  if (Object.keys(normalizedFallback).length > 0) return normalizedFallback;
  return {};
}

function normalizeColorIndexMap(mapping) {
  if (!mapping || typeof mapping !== "object") return {};
  return Object.fromEntries(
    Object.entries(mapping)
      .filter(([key, value]) => key !== "length" && Number.isFinite(Number.parseInt(value, 10)))
      .map(([key, value]) => [key, Number.parseInt(value, 10)]),
  );
}

function getCommunityHighlightNodeIds(communitySnapshot, fallback = []) {
  const selectedCommunityId = communitySnapshot?.selectedCommunityId;
  if (selectedCommunityId == null || !communitySnapshot?.communityToNodeIds) return fallback ?? [];

  const directMatch = communitySnapshot.communityToNodeIds[selectedCommunityId];
  if (Array.isArray(directMatch)) return directMatch;

  const stringMatch = communitySnapshot.communityToNodeIds[String(selectedCommunityId)];
  return Array.isArray(stringMatch) ? stringMatch : fallback ?? [];
}
