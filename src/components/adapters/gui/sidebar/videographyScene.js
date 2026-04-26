import { useFilter } from "../../state/filterState.js";
import { usePhysics } from "../../state/physicsState.js";
import { useSearchState } from "../../state/searchState.js";
import { useCommunityState } from "../../state/communityState.js";
import { useAppearance } from "../../state/appearanceState.js";
import { useColorschemeState } from "../../state/colorschemeState.js";
import { useGraphState } from "../../state/graphState.js";
import { usePixiState } from "../../state/pixiState.js";
import { useTheme } from "../../state/themeState.js";
import { tooltipInit, useTooltipSettings } from "../../state/tooltipState.js";
import { getNodeIdEntries } from "../../../domain/service/parsing/nodeIdParsing.js";
import { isLikelyUniprotAccession, parseNodeIdEntries } from "../../../domain/service/parsing/nodeIdBioParsing.js";

export const KEYFRAME_SCENE_ACTION_INHERIT = "inherit";
export const KEYFRAME_SCENE_ACTION_APPLY = "apply";
export const KEYFRAME_TOOLTIP_ACTION_OPEN = "open";
export const KEYFRAME_TOOLTIP_ACTION_CLOSE = "close";
const FILTER_SCENE_SETTLE_MS = 140;

const PHYSICS_NUMERIC_FIELDS = [
  "gravityStrength",
  "componentStrength",
  "nodeRepulsionStrength",
  "linkLength",
  "borderWidth",
  "borderHeight",
  "borderDepth",
  "communityForceStrength",
];

const PHYSICS_TEXT_FIELDS = {
  gravityStrength: "gravityStrengthText",
  componentStrength: "componentStrengthText",
  nodeRepulsionStrength: "nodeRepulsionStrengthText",
  linkLength: "linkLengthText",
  borderWidth: "borderWidthText",
  borderHeight: "borderHeightText",
  borderDepth: "borderDepthText",
  communityForceStrength: "communityForceStrengthText",
};

const PHYSICS_BOOLEAN_FIELDS = ["circleForce", "linkForce", "checkBorder"];
const TOOLTIP_OFFSET = 14;
const TOOLTIP_MARGIN = 8;
const TOOLTIP_CAPTURE_STABLE_MS = 180;
const TOOLTIP_CAPTURE_BASE_WAIT_MS = 120;
const TOOLTIP_CAPTURE_DETAILS_WAIT_MS = 5000;

export function createCapturedKeyframeScene(params = {}) {
  const snapshot = captureSceneStateSnapshot(params);
  const tooltipNodeId = getActiveTooltipNodeId(snapshot.tooltipSettings);

  return {
    filterAction: KEYFRAME_SCENE_ACTION_APPLY,
    filterSnapshot: snapshot.filter,
    physicsAction: KEYFRAME_SCENE_ACTION_APPLY,
    physicsSnapshot: snapshot.physics,
    searchSnapshot: snapshot.search,
    communitySnapshot: snapshot.community,
    appearanceSnapshot: snapshot.appearance,
    colorschemeSnapshot: snapshot.colorscheme,
    themeSnapshot: snapshot.theme,
    graphSnapshot: snapshot.graph,
    tooltipAction: tooltipNodeId ? KEYFRAME_TOOLTIP_ACTION_OPEN : KEYFRAME_TOOLTIP_ACTION_CLOSE,
    tooltipNodeId,
  };
}

export function getKeyframeScene(keyframe) {
  const scene = keyframe?.scene ?? {};
  const hasFilterSnapshot = scene.filterSnapshot != null;
  const hasPhysicsSnapshot = scene.physicsSnapshot != null;

  return {
    filterAction:
      scene.filterAction === KEYFRAME_SCENE_ACTION_APPLY || hasFilterSnapshot
        ? KEYFRAME_SCENE_ACTION_APPLY
        : KEYFRAME_SCENE_ACTION_INHERIT,
    filterSnapshot: scene.filterSnapshot ?? null,
    physicsAction:
      scene.physicsAction === KEYFRAME_SCENE_ACTION_APPLY || hasPhysicsSnapshot
        ? KEYFRAME_SCENE_ACTION_APPLY
        : KEYFRAME_SCENE_ACTION_INHERIT,
    physicsSnapshot: scene.physicsSnapshot ?? null,
    searchSnapshot: scene.searchSnapshot ?? null,
    communitySnapshot: scene.communitySnapshot ?? null,
    appearanceSnapshot: scene.appearanceSnapshot ?? null,
    colorschemeSnapshot: scene.colorschemeSnapshot ?? null,
    themeSnapshot: scene.themeSnapshot ?? null,
    graphSnapshot: scene.graphSnapshot ?? null,
    tooltipAction:
      scene.tooltipAction === KEYFRAME_SCENE_ACTION_APPLY || scene.tooltipAction === KEYFRAME_TOOLTIP_ACTION_OPEN
        ? KEYFRAME_TOOLTIP_ACTION_OPEN
        : scene.tooltipAction === KEYFRAME_TOOLTIP_ACTION_CLOSE
          ? KEYFRAME_TOOLTIP_ACTION_CLOSE
          : KEYFRAME_SCENE_ACTION_INHERIT,
    tooltipNodeId: typeof scene.tooltipNodeId === "string" && scene.tooltipNodeId.length > 0 ? scene.tooltipNodeId : null,
  };
}

export function captureSceneStateSnapshot({ graphData, nodeMap, mode } = {}) {
  const appearance = useAppearance.getState().appearance;
  const sourceGraphData = graphData ?? useGraphState.getState().graphState.graph?.data;
  const sourceNodeMap = nodeMap ?? usePixiState.getState().pixiState.nodeMap;
  const snapshotMode = mode ?? (appearance?.threeD ? "3d" : "2d");

  return {
    filter: cloneSerializable(useFilter.getState().filter),
    physics: cloneSerializable(usePhysics.getState().physics),
    search: cloneSerializable(useSearchState.getState().searchState),
    community: cloneSerializable(useCommunityState.getState().communityState),
    appearance: captureAppearanceSnapshot(appearance),
    colorscheme: captureColorschemeSnapshot(useColorschemeState.getState().colorschemeState),
    theme: cloneSerializable(useTheme.getState().theme),
    graph: captureGraphSnapshot(sourceGraphData, sourceNodeMap, snapshotMode),
    tooltipSettings: cloneSerializable(useTooltipSettings.getState().tooltipSettings),
  };
}

export async function restoreSceneStateSnapshot(snapshot) {
  if (!snapshot) return;
  let filterChanged = false;
  let searchChanged = false;
  let communityChanged = false;

  if (snapshot.filter && !isSameSnapshot(useFilter.getState().filter, snapshot.filter)) {
    useFilter.getState().setAllFilter(cloneSerializable(snapshot.filter));
    filterChanged = true;
  }
  if (snapshot.physics && !isSameSnapshot(usePhysics.getState().physics, snapshot.physics)) {
    usePhysics.getState().setAllPhysics(cloneSerializable(snapshot.physics));
  }

  if (filterChanged) {
    await wait(FILTER_SCENE_SETTLE_MS);
  }

  communityChanged = applyCommunitySnapshot(snapshot.community);
  searchChanged = applySearchSnapshot(snapshot.search);

  if (snapshot.tooltipSettings) {
    useTooltipSettings.getState().setAllTooltipSettings(cloneSerializable(snapshot.tooltipSettings));
  }

  if (searchChanged || communityChanged) {
    await waitForFrames(2);
  }

  if (searchChanged) {
    applySearchSnapshot(snapshot.search);
  }
}

export async function applyKeyframeScene(keyframe, { app, nodeMap, settle = true } = {}) {
  const scene = getKeyframeScene(keyframe);
  let filterChanged = false;
  let physicsChanged = false;
  let searchChanged = false;
  let communityChanged = false;
  let tooltipChanged = false;

  if (
    scene.filterAction === KEYFRAME_SCENE_ACTION_APPLY &&
    scene.filterSnapshot &&
    !isSameSnapshot(useFilter.getState().filter, scene.filterSnapshot)
  ) {
    useFilter.getState().setAllFilter(cloneSerializable(scene.filterSnapshot));
    filterChanged = true;
  }

  if (
    scene.physicsAction === KEYFRAME_SCENE_ACTION_APPLY &&
    scene.physicsSnapshot &&
    !isSameSnapshot(usePhysics.getState().physics, scene.physicsSnapshot)
  ) {
    usePhysics.getState().setAllPhysics(cloneSerializable(scene.physicsSnapshot));
    physicsChanged = true;
  }

  if (
    scene.tooltipAction === KEYFRAME_TOOLTIP_ACTION_CLOSE &&
    useTooltipSettings.getState().tooltipSettings?.isClickTooltipActive
  ) {
    useTooltipSettings.getState().setAllTooltipSettings(cloneSerializable(tooltipInit));
    tooltipChanged = true;
  }

  if (settle && filterChanged) {
    await wait(FILTER_SCENE_SETTLE_MS);
  }

  communityChanged = applyCommunitySnapshot(scene.communitySnapshot);
  searchChanged = applySearchSnapshot(scene.searchSnapshot);

  if (settle && physicsChanged) {
    await waitForFrames(2);
  }

  if (scene.tooltipAction === KEYFRAME_TOOLTIP_ACTION_OPEN && scene.tooltipNodeId) {
    tooltipChanged = openClickTooltipForNode(scene.tooltipNodeId, { app, nodeMap });
  }

  if (tooltipChanged || searchChanged || communityChanged) {
    await waitForFrames(2);
  }

  if (searchChanged) {
    applySearchSnapshot(scene.searchSnapshot);
  }

  return scene;
}

export function applyKeyframeTransitionStart(fromKeyframe, toKeyframe) {
  const fromScene = getKeyframeScene(fromKeyframe);
  const toScene = getKeyframeScene(toKeyframe);
  let filterChanged = false;

  if (
    toScene.filterAction === KEYFRAME_SCENE_ACTION_APPLY &&
    toScene.filterSnapshot &&
    !isSameSnapshot(fromScene.filterSnapshot, toScene.filterSnapshot) &&
    !isSameSnapshot(useFilter.getState().filter, toScene.filterSnapshot)
  ) {
    useFilter.getState().setAllFilter(cloneSerializable(toScene.filterSnapshot));
    filterChanged = true;
  }

  return filterChanged;
}

export async function applyKeyframeTransitionScene(fromKeyframe, toKeyframe, { app, nodeMap, settle = true } = {}) {
  const targetScene = getKeyframeScene(toKeyframe);
  const filterChanged = applyKeyframeTransitionStart(fromKeyframe, toKeyframe);
  let searchChanged = false;
  let communityChanged = false;
  let tooltipChanged = false;

  if (settle && filterChanged) {
    await wait(FILTER_SCENE_SETTLE_MS);
  }

  communityChanged = applyCommunitySnapshot(targetScene.communitySnapshot);
  searchChanged = applySearchSnapshot(targetScene.searchSnapshot);

  if (
    targetScene.tooltipAction === KEYFRAME_TOOLTIP_ACTION_CLOSE &&
    useTooltipSettings.getState().tooltipSettings?.isClickTooltipActive
  ) {
    useTooltipSettings.getState().setAllTooltipSettings(cloneSerializable(tooltipInit));
    tooltipChanged = true;
  }

  if (targetScene.tooltipAction === KEYFRAME_TOOLTIP_ACTION_OPEN && targetScene.tooltipNodeId) {
    tooltipChanged = openClickTooltipForNode(targetScene.tooltipNodeId, { app, nodeMap });
  }

  if (tooltipChanged || searchChanged || communityChanged) {
    await waitForFrames(2);
  }

  if (searchChanged) {
    applySearchSnapshot(targetScene.searchSnapshot);
  }

  return { filterChanged, searchChanged, communityChanged, tooltipChanged };
}

export function applyInterpolatedKeyframePhysics(fromKeyframe, toKeyframe, t) {
  const physicsSnapshot = interpolateKeyframePhysics(fromKeyframe, toKeyframe, t);
  if (!physicsSnapshot) return false;
  usePhysics.getState().setAllPhysics(physicsSnapshot);
  return true;
}

export function interpolateKeyframePhysics(fromKeyframe, toKeyframe, t) {
  const fromScene = getKeyframeScene(fromKeyframe);
  const toScene = getKeyframeScene(toKeyframe);
  const fromPhysics = fromScene.physicsSnapshot;
  const toPhysics = toScene.physicsSnapshot;

  if (!fromPhysics || !toPhysics || isSameSnapshot(fromPhysics, toPhysics)) return null;

  const amount = clamp(Number.isFinite(t) ? t : 0, 0, 1);
  const base = amount < 0.5 ? fromPhysics : toPhysics;
  const nextPhysics = cloneSerializable(base);

  for (const field of PHYSICS_NUMERIC_FIELDS) {
    const fromValue = Number.parseFloat(fromPhysics[field]);
    const toValue = Number.parseFloat(toPhysics[field]);
    if (!Number.isFinite(fromValue) || !Number.isFinite(toValue)) continue;

    const value = fromValue + (toValue - fromValue) * amount;
    nextPhysics[field] = value;

    const textField = PHYSICS_TEXT_FIELDS[field];
    if (textField) {
      nextPhysics[textField] = formatSceneNumber(value);
    }
  }

  for (const field of PHYSICS_BOOLEAN_FIELDS) {
    if (fromPhysics[field] === undefined && toPhysics[field] === undefined) continue;
    nextPhysics[field] = amount <= 0 ? Boolean(fromPhysics[field]) : Boolean(toPhysics[field]);
  }

  return nextPhysics;
}

export function describeKeyframeScene(keyframe) {
  const scene = getKeyframeScene(keyframe);
  return {
    tooltip:
      scene.tooltipAction === KEYFRAME_TOOLTIP_ACTION_OPEN
        ? scene.tooltipNodeId
          ? `Open ${scene.tooltipNodeId}`
          : "Open"
        : scene.tooltipAction === KEYFRAME_TOOLTIP_ACTION_CLOSE
          ? "Closed"
          : "Unchanged",
    filter: scene.filterAction === KEYFRAME_SCENE_ACTION_APPLY && scene.filterSnapshot ? "Captured" : "Unchanged",
    physics: scene.physicsAction === KEYFRAME_SCENE_ACTION_APPLY && scene.physicsSnapshot ? "Captured" : "Unchanged",
    search: scene.searchSnapshot ? describeSearchScene(scene.searchSnapshot) : "Unchanged",
    community: scene.communitySnapshot ? describeCommunityScene(scene.communitySnapshot) : "Unchanged",
  };
}

export function createTooltipOverlayController({ app } = {}) {
  let overlay = null;
  let captureInFlight = null;
  let disposed = false;
  let version = 0;

  const clear = () => {
    overlay = null;
    version += 1;
  };

  const refresh = async () => {
    if (disposed) return;

    const { tooltipSettings } = useTooltipSettings.getState();
    if (!tooltipSettings?.isClickTooltipActive) {
      clear();
      return;
    }

    const tooltipElement = document.querySelector(".tooltip-popup");
    const sourceCanvas = getPixiCanvas(app);
    if (!tooltipElement || !sourceCanvas) {
      clear();
      return;
    }

    if (captureInFlight) {
      return captureInFlight;
    }

    const currentVersion = version;
    captureInFlight = (async () => {
      const tooltipCapture = await captureTooltipElement(tooltipElement);

      if (disposed || currentVersion !== version) return;
      if (!tooltipCapture) {
        clear();
        return;
      }

      const tooltipRect = tooltipElement.getBoundingClientRect();
      const sourceRect = sourceCanvas.getBoundingClientRect();

      overlay = {
        canvas: tooltipCapture.canvas,
        x: tooltipRect.left - sourceRect.left,
        y: tooltipRect.top - sourceRect.top,
        width: tooltipCapture.width,
        height: tooltipCapture.height,
      };
    })().finally(() => {
      captureInFlight = null;
    });

    return captureInFlight;
  };

  return {
    async sync() {
      await refresh();
    },
    markDirty() {
      version += 1;
    },
    draw(context, { nodeMap } = {}) {
      if (!overlay || !context) return;
      const tooltipSettings = useTooltipSettings.getState().tooltipSettings;
      const nodeId = tooltipSettings?.isClickTooltipActive ? tooltipSettings.clickTooltipData?.node : null;
      const fitScale = getTooltipCanvasFitScale({ app, width: overlay.width, height: overlay.height });
      const drawWidth = overlay.width * fitScale;
      const drawHeight = overlay.height * fitScale;
      const dynamicPosition = getTooltipCanvasPosition(nodeId, {
        app,
        nodeMap,
        width: drawWidth,
        height: drawHeight,
      });

      if (!dynamicPosition && nodeId) return;

      context.drawImage(
        overlay.canvas,
        dynamicPosition?.x ?? overlay.x,
        dynamicPosition?.y ?? overlay.y,
        drawWidth,
        drawHeight,
      );
    },
    clear,
    dispose() {
      disposed = true;
      overlay = null;
      captureInFlight = null;
    },
  };
}

export function refreshActiveTooltipPosition({ app, nodeMap } = {}) {
  const tooltipSettings = useTooltipSettings.getState().tooltipSettings;
  if (!tooltipSettings?.isClickTooltipActive || !tooltipSettings.clickTooltipData?.node) return false;

  const point = getNodeScreenPosition(tooltipSettings.clickTooltipData.node, { app, nodeMap });
  if (!point) return false;

  const current = tooltipSettings.clickTooltipData;
  if (Math.abs((current.x ?? 0) - point.x) < 0.5 && Math.abs((current.y ?? 0) - point.y) < 0.5) {
    return false;
  }

  useTooltipSettings.getState().setTooltipSettings("clickTooltipData", {
    ...current,
    x: point.x,
    y: point.y,
  });
  return true;
}

function openClickTooltipForNode(nodeId, { app, nodeMap } = {}) {
  const entry = nodeMap?.[nodeId];
  const point = getNodeScreenPosition(nodeId, { app, nodeMap });

  if (!entry?.node || !point) {
    useTooltipSettings.getState().setAllTooltipSettings(cloneSerializable(tooltipInit));
    return true;
  }

  try {
    useTooltipSettings.getState().setAllTooltipSettings({
      isClickTooltipActive: true,
      clickTooltipData: {
        node: entry.node.id,
        nodeAttribs: entry.node.attribs ?? [],
        x: point.x,
        y: point.y,
      },
      isHoverTooltipActive: false,
      hoverTooltipData: null,
    });
    return true;
  } catch {
    useTooltipSettings.getState().setAllTooltipSettings(cloneSerializable(tooltipInit));
    return true;
  }
}

async function captureTooltipElement(tooltipElement) {
  try {
    const isReady = await waitForTooltipContentReady(tooltipElement);
    if (!isReady) return null;
    await waitForFontsReady();

    const { default: html2canvas } = await import("html2canvas");
    const scale = Math.max(1, window.devicePixelRatio || 1);
    const rect = tooltipElement.getBoundingClientRect();
    const width = Math.ceil(Math.max(1, rect.width));
    const height = Math.ceil(Math.max(1, rect.height));
    const canvas = await html2canvas(tooltipElement, {
      backgroundColor: null,
      foreignObjectRendering: true,
      height,
      logging: false,
      scale,
      useCORS: true,
      width,
      windowHeight: Math.max(window.innerHeight, Math.ceil(tooltipElement.getBoundingClientRect().top + height)),
      windowWidth: Math.max(window.innerWidth, Math.ceil(tooltipElement.getBoundingClientRect().left + width)),
    });

    return {
      canvas,
      width: canvas.width / scale,
      height: canvas.height / scale,
    };
  } catch {
    return null;
  }
}

async function waitForTooltipContentReady(tooltipElement) {
  const waitForProteinDetails = shouldWaitForActiveProteinDetails();
  const startedAt = now();
  const maxWait = waitForProteinDetails ? TOOLTIP_CAPTURE_DETAILS_WAIT_MS : TOOLTIP_CAPTURE_BASE_WAIT_MS * 4;
  const minWait = waitForProteinDetails ? TOOLTIP_CAPTURE_BASE_WAIT_MS : TOOLTIP_CAPTURE_BASE_WAIT_MS;
  let lastSignature = getTooltipContentSignature(tooltipElement);
  let stableSince = startedAt;

  while (now() - startedAt < maxWait) {
    await waitForFrames(1);
    if (!document.body.contains(tooltipElement)) return false;

    const currentSignature = getTooltipContentSignature(tooltipElement);
    const currentTime = now();
    if (currentSignature !== lastSignature) {
      lastSignature = currentSignature;
      stableSince = currentTime;
    }

    const hasRequiredDetails = !waitForProteinDetails || hasProteinDetailFields(tooltipElement);
    const waitedLongEnough = currentTime - startedAt >= minWait;
    const isStable = currentTime - stableSince >= TOOLTIP_CAPTURE_STABLE_MS;

    if (hasRequiredDetails && waitedLongEnough && isStable) return true;
  }

  return !waitForProteinDetails || hasProteinDetailFields(tooltipElement);
}

function shouldWaitForActiveProteinDetails() {
  const nodeId = getActiveTooltipNodeId(useTooltipSettings.getState().tooltipSettings);
  if (!nodeId) return false;

  const parsedEntries = parseNodeIdEntries(getNodeIdEntries(nodeId));
  return isLikelyUniprotAccession(parsedEntries.protIdNoIsoform);
}

function hasProteinDetailFields(tooltipElement) {
  const labels = Array.from(tooltipElement.querySelectorAll(".tooltip-popup-item-label")).map((label) =>
    label.textContent?.trim().toUpperCase(),
  );
  return labels.includes("FULL NAME") || labels.includes("DESCRIPTION");
}

function getTooltipContentSignature(tooltipElement) {
  return [
    tooltipElement.textContent ?? "",
    tooltipElement.getBoundingClientRect().width,
    tooltipElement.getBoundingClientRect().height,
    tooltipElement.querySelector(".tooltip-popup-body")?.scrollHeight ?? 0,
  ].join("|");
}

function applySearchSnapshot(searchSnapshot) {
  if (!searchSnapshot || isSameSnapshot(useSearchState.getState().searchState, searchSnapshot)) return false;
  useSearchState.getState().setAllSearchState(cloneSerializable(searchSnapshot));
  return true;
}

function applyCommunitySnapshot(communitySnapshot) {
  if (!communitySnapshot || isSameSnapshot(useCommunityState.getState().communityState, communitySnapshot)) return false;
  useCommunityState.getState().setAllCommunityState(cloneSerializable(communitySnapshot));
  return true;
}

function captureAppearanceSnapshot(appearance) {
  if (!appearance) return null;

  return cloneSerializable({
    showNodeLabels: Boolean(appearance.showNodeLabels),
    linkWidth: Number.isFinite(Number.parseFloat(appearance.linkWidth)) ? Number.parseFloat(appearance.linkWidth) : 2,
    enable3DShading: Boolean(appearance.enable3DShading),
    show3DGrid: Boolean(appearance.show3DGrid),
    threeD: Boolean(appearance.threeD),
  });
}

function captureColorschemeSnapshot(colorschemeState) {
  if (!colorschemeState) return null;

  return cloneSerializable({
    nodeColorscheme: colorschemeState.nodeColorscheme ?? null,
    linkColorscheme: colorschemeState.linkColorscheme ?? null,
    linkAttribsToColorIndices: toPlainColorIndexMap(colorschemeState.linkAttribsToColorIndices),
    nodeAttribsToColorIndices: toPlainColorIndexMap(colorschemeState.nodeAttribsToColorIndices),
  });
}

function toPlainColorIndexMap(mapping) {
  if (!mapping || typeof mapping !== "object") return null;
  return Object.fromEntries(
    Object.entries(mapping)
      .filter(([key, value]) => key !== "length" && Number.isFinite(Number.parseInt(value, 10)))
      .map(([key, value]) => [key, Number.parseInt(value, 10)]),
  );
}

function captureGraphSnapshot(graphData, nodeMap, mode) {
  if (!Array.isArray(graphData?.nodes) || !Array.isArray(graphData?.links)) return null;
  const nodeEntries = new Map(graphData.nodes.map((node) => [String(node.id), node]));
  const snapshotNodes = graphData.nodes
    .filter((node) => shouldCaptureNode(node, nodeMap?.[node.id]))
    .map((node) => captureRenderedNode(node, nodeMap?.[node.id], mode));
  const capturedNodeIds = new Set(snapshotNodes.map((node) => String(node.id)));
  const snapshotLinks = graphData.links
    .map((link) => {
      const source = getGraphEndpointId(link.source);
      const target = getGraphEndpointId(link.target);
      if (!capturedNodeIds.has(String(source)) || !capturedNodeIds.has(String(target))) return null;

      return {
        ...link,
        source,
        target,
      };
    })
    .filter(Boolean);

  return cloneSerializable({
    ...graphData,
    nodes: snapshotNodes.map((node) => {
      const sourceNode = nodeEntries.get(String(node.id));
      return sourceNode ? { ...sourceNode, ...node } : node;
    }),
    links: snapshotLinks,
  });
}

function shouldCaptureNode(node, entry) {
  if (!entry?.circle) return true;
  if (entry.circle.__hiddenByFilter === true) return false;
  return entry.circle.visible !== false || entry.circle.__hiddenByProjection === true;
}

function captureRenderedNode(node, entry, mode) {
  const circle = entry?.circle;
  const sourceNode = entry?.node ?? node;
  const renderedNode = {
    ...node,
    x: finiteSceneNumber(sourceNode?.fx ?? sourceNode?.x ?? node.x, 0),
    y: finiteSceneNumber(sourceNode?.fy ?? sourceNode?.y ?? node.y, 0),
  };

  if (mode === "2d" && circle && circle.visible !== false) {
    renderedNode.x = finiteSceneNumber(circle.x, renderedNode.x);
    renderedNode.y = finiteSceneNumber(circle.y, renderedNode.y);
  }

  const nodeLabel = entry?.nodeLabel;
  if (nodeLabel && nodeLabel.destroyed !== true) {
    renderedNode.labelX = finiteSceneNumber(nodeLabel.x, renderedNode.x);
    renderedNode.labelY = finiteSceneNumber(nodeLabel.y, renderedNode.y);
    renderedNode.labelVisible = nodeLabel.visible !== false;
    renderedNode.labelText = typeof nodeLabel.text === "string" ? nodeLabel.text : renderedNode.labelText;
    renderedNode.labelFontSize = finiteSceneNumber(nodeLabel._fontSize, renderedNode.labelFontSize);
  }

  renderedNode.z = finiteSceneNumber(getNodeWorldZ(node, entry), 0);
  return renderedNode;
}

function getNodeWorldZ(node, entry) {
  const sourceNode = entry?.node ?? node;
  return sourceNode?.fz ?? sourceNode?.z ?? node?.z ?? 0;
}

function finiteSceneNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function getGraphEndpointId(endpoint) {
  if (endpoint == null) return endpoint;
  if (typeof endpoint === "object") {
    return endpoint.id ?? endpoint.data?.id ?? null;
  }
  return endpoint;
}

function cloneSerializable(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function isSameSnapshot(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

function getActiveTooltipNodeId(tooltipSettings) {
  if (!tooltipSettings?.isClickTooltipActive) return null;
  const nodeId = tooltipSettings?.clickTooltipData?.node;
  return nodeId == null || nodeId === "" ? null : nodeId.toString();
}

function describeSearchScene(searchSnapshot) {
  const highlightedCount = Array.isArray(searchSnapshot?.highlightedNodeIds) ? searchSnapshot.highlightedNodeIds.length : 0;
  if (searchSnapshot?.selectedNodeId) return `Selected ${searchSnapshot.selectedNodeId}`;
  if (searchSnapshot?.query) return highlightedCount > 0 ? `${highlightedCount} highlighted` : "Captured";
  return "Cleared";
}

function describeCommunityScene(communitySnapshot) {
  if (communitySnapshot?.selectedCommunityId) return `Selected ${communitySnapshot.selectedCommunityId}`;
  if (Number.isFinite(Number.parseFloat(communitySnapshot?.communityResolution))) {
    return `Resolution ${formatSceneNumber(Number.parseFloat(communitySnapshot.communityResolution))}`;
  }
  return "Captured";
}

function getNodeScreenPosition(nodeId, { app, nodeMap } = {}) {
  const canvasPoint = getNodeCanvasPosition(nodeId, { app, nodeMap });
  const sourceCanvas = getPixiCanvas(app);
  if (!canvasPoint || !sourceCanvas) return null;

  const rect = sourceCanvas.getBoundingClientRect();
  return {
    x: rect.left + canvasPoint.x,
    y: rect.top + canvasPoint.y,
  };
}

function getTooltipCanvasPosition(nodeId, { app, nodeMap, width = 0, height = 0 } = {}) {
  const point = getNodeCanvasPosition(nodeId, { app, nodeMap });
  const size = getCanvasCssSize(app);
  if (!point || !size) return null;

  const { width: canvasWidth, height: canvasHeight } = size;

  let x = point.x + TOOLTIP_OFFSET;
  let y = point.y;

  if (x + width > canvasWidth - TOOLTIP_MARGIN) {
    x = point.x - width - TOOLTIP_OFFSET;
  }
  if (y + height > canvasHeight - TOOLTIP_MARGIN) {
    y = point.y - height;
  }

  return {
    x: clamp(x, TOOLTIP_MARGIN, Math.max(TOOLTIP_MARGIN, canvasWidth - width - TOOLTIP_MARGIN)),
    y: clamp(y, TOOLTIP_MARGIN, Math.max(TOOLTIP_MARGIN, canvasHeight - height - TOOLTIP_MARGIN)),
  };
}

function getTooltipCanvasFitScale({ app, width = 0, height = 0 } = {}) {
  const size = getCanvasCssSize(app);
  if (!size || width <= 0 || height <= 0) return 1;

  const maxWidth = Math.max(1, size.width - TOOLTIP_MARGIN * 2);
  const maxHeight = Math.max(1, size.height - TOOLTIP_MARGIN * 2);
  return Math.min(1, maxWidth / width, maxHeight / height);
}

function getCanvasCssSize(app) {
  const sourceCanvas = getPixiCanvas(app);
  if (!sourceCanvas) return null;

  const rect = sourceCanvas.getBoundingClientRect();
  return {
    width: Math.max(1, rect.width || sourceCanvas.clientWidth || sourceCanvas.width || 1),
    height: Math.max(1, rect.height || sourceCanvas.clientHeight || sourceCanvas.height || 1),
  };
}

function getNodeCanvasPosition(nodeId, { app, nodeMap } = {}) {
  const circle = nodeMap?.[nodeId]?.circle;
  const sourceCanvas = getPixiCanvas(app);
  if (!circle || !sourceCanvas || circle.visible === false || circle.destroyed) return null;

  try {
    const wt = circle.worldTransform;
    if (!Number.isFinite(wt?.tx) || !Number.isFinite(wt?.ty)) return null;
    return { x: wt.tx, y: wt.ty };
  } catch {
    return null;
  }
}

function formatSceneNumber(value) {
  if (!Number.isFinite(value)) return "0";
  return Number.parseFloat(value.toFixed(4)).toString();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getPixiCanvas(app) {
  return app?.canvas ?? app?.renderer?.canvas ?? null;
}

function waitForFrames(count = 1) {
  return new Promise((resolve) => {
    let remaining = Math.max(1, count);
    const step = () => {
      remaining -= 1;
      if (remaining <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function now() {
  return typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now();
}

async function waitForFontsReady() {
  try {
    await document.fonts?.ready;
  } catch {
    // Font readiness is best effort; capture can still proceed with loaded CSS.
  }
}
