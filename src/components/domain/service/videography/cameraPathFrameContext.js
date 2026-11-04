import { finiteNumberOr, interpolateFiniteNumber } from "./cameraPathMath.js";
import { buildTransitionGraphData, hasGraphData } from "./graphTransitionData.js";
import { interpolateRgb } from "d3";

export function getFrameRenderContext(sample, fallback) {
  const keyframe = sample?.stepType === "transition" ? sample.to : sample?.keyframe ?? sample?.to ?? sample?.from;
  const scene = keyframe?.scene ?? {};
  const transitionGraphData =
    sample?.stepType === "transition"
      ? buildTransitionGraphData(sample.from?.scene?.graphSnapshot, sample.to?.scene?.graphSnapshot, sample.easedT)
      : null;
  const usesSnapshotGraph = hasGraphData(transitionGraphData) || hasGraphData(scene.graphSnapshot);
  const frameGraphData = transitionGraphData ?? (hasGraphData(scene.graphSnapshot) ? scene.graphSnapshot : fallback.graphData);
  const isTransition = sample?.stepType === "transition";
  const discreteScene = isTransition && sample.easedT < 1 ? sample.from?.scene ?? {} : scene;
  const appearance = discreteScene.appearanceSnapshot ?? {};
  const fromAppearance = sample?.from?.scene?.appearanceSnapshot ?? {};
  const toAppearance = sample?.to?.scene?.appearanceSnapshot ?? {};
  const fromLabels = typeof fromAppearance.showNodeLabels === "boolean" ? fromAppearance.showNodeLabels : fallback.showNodeLabels;
  const toLabels = typeof toAppearance.showNodeLabels === "boolean" ? toAppearance.showNodeLabels : fallback.showNodeLabels;
  const colorscheme = discreteScene.colorschemeSnapshot ?? {};
  const theme = discreteScene.themeSnapshot ?? {};

  return {
    graphData: frameGraphData,
    nodeMap: usesSnapshotGraph ? null : fallback.nodeMap,
    gridLines: usesSnapshotGraph ? [] : fallback.gridLines,
    showNodeLabels: isTransition ? fromLabels || toLabels : typeof appearance.showNodeLabels === "boolean" ? appearance.showNodeLabels : fallback.showNodeLabels,
    enableShading: typeof appearance.enable3DShading === "boolean" ? appearance.enable3DShading : fallback.enableShading,
    showGrid: typeof appearance.show3DGrid === "boolean" ? appearance.show3DGrid : fallback.showGrid,
    container: getFrameSourceContainer(sample, fallback.container),
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

function getFrameSourceContainer(sample, fallback) {
  const from = sample?.from?.scene?.viewportSnapshot ?? fallback;
  const to = sample?.to?.scene?.viewportSnapshot ?? fallback;
  if (sample?.stepType !== "transition") return sample?.keyframe?.scene?.viewportSnapshot ?? to;
  return {
    width: interpolateFiniteNumber(from?.width, to?.width, sample.easedT, fallback?.width),
    height: interpolateFiniteNumber(from?.height, to?.height, sample.easedT, fallback?.height),
  };
}

function getFrameDrawParams({ sample, colorscheme, theme, fromAppearance, toAppearance, appearance, fallback, scene }) {
  const transition = sample?.stepType === "transition";
  const fromScene = sample?.from?.scene ?? {};
  const toScene = sample?.to?.scene ?? {};
  const progress = transition ? sample.easedT : 1;
  const fromColorscheme = fromScene.colorschemeSnapshot ?? {};
  const toColorscheme = toScene.colorschemeSnapshot ?? {};
  const fromTheme = fromScene.themeSnapshot ?? {};
  const toTheme = toScene.themeSnapshot ?? {};
  const nodeHighlights = interpolateSelection(
    fromScene.searchSnapshot?.highlightedNodeIds,
    toScene.searchSnapshot?.highlightedNodeIds,
    scene.searchSnapshot?.highlightedNodeIds ?? fallback.highlightNodeIds,
    progress,
    transition,
  );
  const linkHighlights = interpolateSelection(
    fromScene.searchSnapshot?.highlightedLinkIds,
    toScene.searchSnapshot?.highlightedLinkIds,
    scene.searchSnapshot?.highlightedLinkIds ?? fallback.highlightLinkIds,
    progress,
    transition,
  );
  const communityHighlights = interpolateSelection(
    getCommunityHighlightNodeIds(fromScene.communitySnapshot),
    getCommunityHighlightNodeIds(toScene.communitySnapshot),
    getCommunityHighlightNodeIds(scene.communitySnapshot, fallback.communityHighlightNodeIds),
    progress,
    transition,
  );
  const linkWidth =
    sample?.stepType === "transition"
      ? interpolateFiniteNumber(fromAppearance.linkWidth, toAppearance.linkWidth, sample.easedT, fallback.linkWidth)
      : finiteNumberOr(appearance.linkWidth, fallback.linkWidth);

  return {
    linkWidth,
    labelOpacity: transition
      ? (fromAppearance.showNodeLabels ?? fallback.showNodeLabels ? 1 - progress : 0)
        + (toAppearance.showNodeLabels ?? fallback.showNodeLabels ? progress : 0)
      : 1,
    linkColorscheme: transition
      ? interpolatePalette(fromColorscheme.linkColorscheme, toColorscheme.linkColorscheme, fallback.linkColorscheme, progress)
      : getColorschemeData(colorscheme.linkColorscheme, fallback.linkColorscheme),
    linkAttribsToColorIndices: getColorIndexMap(colorscheme.linkAttribsToColorIndices, fallback.linkAttribsToColorIndices),
    circleBorderColor: interpolateSceneColor(fromTheme.circleBorderColor, toTheme.circleBorderColor, theme.circleBorderColor ?? fallback.circleBorderColor, progress, transition),
    textColor: interpolateSceneColor(fromTheme.textColor, toTheme.textColor, theme.textColor ?? fallback.textColor, progress, transition),
    nodeColorscheme: transition
      ? interpolatePalette(fromColorscheme.nodeColorscheme, toColorscheme.nodeColorscheme, fallback.nodeColorscheme, progress)
      : getColorschemeData(colorscheme.nodeColorscheme, fallback.nodeColorscheme),
    nodeAttribsToColorIndices: getColorIndexMap(colorscheme.nodeAttribsToColorIndices, fallback.nodeAttribsToColorIndices),
    highlightNodeIds: nodeHighlights.ids,
    highlightNodeAlphas: nodeHighlights.alphas,
    highlightLinkIds: linkHighlights.ids,
    highlightLinkAlphas: linkHighlights.alphas,
    communityHighlightNodeIds: communityHighlights.ids,
    communityHighlightNodeAlphas: communityHighlights.alphas,
    focusFromNodeId: transition ? fromScene.focusNodeId ?? fromScene.tooltipNodeId ?? null : scene.focusNodeId ?? scene.tooltipNodeId ?? null,
    focusToNodeId: transition ? toScene.focusNodeId ?? toScene.tooltipNodeId ?? null : scene.focusNodeId ?? scene.tooltipNodeId ?? null,
    focusProgress: progress,
    highlightColor: interpolateSceneColor(fromTheme.highlightColor, toTheme.highlightColor, theme.highlightColor ?? fallback.highlightColor, progress, transition),
    communityHighlightColor: interpolateSceneColor(fromTheme.communityHighlightColor, toTheme.communityHighlightColor, theme.communityHighlightColor ?? fallback.communityHighlightColor, progress, transition),
  };
}

function interpolateSceneColor(from, to, fallback, progress, transition) {
  if (!transition || typeof from !== "string" || typeof to !== "string") return fallback;
  if (progress <= 0) return from;
  if (progress >= 1) return to;
  return interpolateRgb(from, to)(progress);
}

function interpolatePalette(fromSnapshot, toSnapshot, fallback, progress) {
  const from = getColorschemeData(fromSnapshot, fallback);
  const to = getColorschemeData(toSnapshot, fallback);
  return Array.from({ length: Math.max(from.length, to.length) }, (_, index) =>
    interpolateSceneColor(from[index], to[index], progress < 1 ? from[index] ?? to[index] : to[index] ?? from[index], progress, true),
  );
}

function interpolateSelection(fromIds, toIds, settledIds, t, transition) {
  const from = new Set((Array.isArray(fromIds) ? fromIds : []).map(String));
  const to = new Set((Array.isArray(toIds) ? toIds : []).map(String));
  const ids = transition ? [...new Set([...from, ...to])] : (Array.isArray(settledIds) ? settledIds : []);
  const alphas = transition ? Object.fromEntries(ids.map((id) => [id, (from.has(String(id)) ? 1 - t : 0) + (to.has(String(id)) ? t : 0)])) : null;
  return { ids, alphas };
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
