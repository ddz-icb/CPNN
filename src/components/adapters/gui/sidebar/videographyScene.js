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
import { defaultCamera } from "../../../domain/service/canvas_drawing/render3D.js";
import { radius as canvasNodeRadius } from "../../../domain/service/canvas_drawing/nodes.js";
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
const TOOLTIP_OFFSET = 12;
const TOOLTIP_MARGIN = 8;
const TOOLTIP_CAPTURE_PADDING = 16;
const TOOLTIP_CAPTURE_VIEWPORT_MARGIN = 64;
const TOOLTIP_CAPTURE_STABLE_MS = 180;
const TOOLTIP_CAPTURE_BASE_WAIT_MS = 120;
const TOOLTIP_CAPTURE_DETAILS_WAIT_MS = 12000;
const TOOLTIP_VIDEO_CAPTURE_CLASS = "tooltip-popup--videography-capture";
const TOOLTIP_VIDEO_PREPARING_CLASS = "tooltip-popup--videography-preparing";
const TOOLTIP_TRANSITION_SHOW_AT = 0.98;
const TOOLTIP_VIDEO_MAX_WIDTH = 680;
const TOOLTIP_VIDEO_MAX_HEIGHT = 760;

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

export function createTooltipOverlayController({ app, captureScale } = {}) {
  let overlay = null;
  let captureInFlight = null;
  let disposed = false;
  let version = 0;
  const keyframeOverlays = new Map();

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
      const tooltipCapture = await captureTooltipElement(tooltipElement, { expanded: true, captureScale });

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
        padding: tooltipCapture.padding,
        nodeId: tooltipSettings.clickTooltipData?.node ?? null,
      };
    })().finally(() => {
      captureInFlight = null;
    });

    return captureInFlight;
  };

  return {
    async prepareKeyframes(keyframes, { nodeMap, captureScale: keyframeCaptureScale = captureScale } = {}) {
      keyframeOverlays.clear();
      if (!Array.isArray(keyframes) || keyframes.length === 0 || disposed) return;

      const previousTooltipSettings = cloneSerializable(useTooltipSettings.getState().tooltipSettings);
      const overlaysByNodeId = new Map();
      document.body?.classList.add(TOOLTIP_VIDEO_PREPARING_CLASS);

      try {
        for (const keyframe of keyframes) {
          if (disposed) return;

          const scene = getKeyframeScene(keyframe);
          if (scene.tooltipAction !== KEYFRAME_TOOLTIP_ACTION_OPEN || !scene.tooltipNodeId) continue;

          const node = getTooltipNodeForScene(scene, nodeMap);
          if (!node) continue;

          const cachedOverlay = overlaysByNodeId.get(node.id);
          if (cachedOverlay) {
            keyframeOverlays.set(keyframe.id, cachedOverlay);
            continue;
          }

          useTooltipSettings.getState().setAllTooltipSettings({
            isClickTooltipActive: true,
            clickTooltipData: {
              node: node.id,
              nodeAttribs: node.attribs ?? [],
              x: 0,
              y: 0,
            },
            isHoverTooltipActive: false,
            hoverTooltipData: null,
          });

          await waitForFrames(2);

          const tooltipElement = document.querySelector(".tooltip-popup");
          if (!tooltipElement) continue;

          const tooltipCapture = await captureTooltipElement(tooltipElement, {
            expanded: true,
            captureScale: keyframeCaptureScale,
          });
          if (!tooltipCapture) continue;

          const preparedOverlay = {
            canvas: tooltipCapture.canvas,
            width: tooltipCapture.width,
            height: tooltipCapture.height,
            padding: tooltipCapture.padding,
            nodeId: node.id,
            isPreparedKeyframeOverlay: true,
          };
          overlaysByNodeId.set(node.id, preparedOverlay);
          keyframeOverlays.set(keyframe.id, preparedOverlay);
        }
      } finally {
        document.body?.classList.remove(TOOLTIP_VIDEO_PREPARING_CLASS);
        useTooltipSettings.getState().setAllTooltipSettings(previousTooltipSettings ?? cloneSerializable(tooltipInit));
        await waitForFrames(1);
      }
    },
    async sync() {
      await refresh();
    },
    markDirty() {
      version += 1;
    },
    draw(context, { sample, frameContext, sourceContainer, nodeMap } = {}) {
      const frameOverlay = getTooltipOverlayForSample(sample, keyframeOverlays) ?? overlay;
      if (!frameOverlay || !context) return;

      const tooltipSettings = useTooltipSettings.getState().tooltipSettings;
      const nodeId =
        frameOverlay.nodeId ?? (tooltipSettings?.isClickTooltipActive ? tooltipSettings.clickTooltipData?.node : null);
      const capturePadding = Number.isFinite(frameOverlay.padding) ? Math.max(0, frameOverlay.padding) : 0;
      const visibleWidth = Math.max(1, frameOverlay.width - capturePadding * 2);
      const visibleHeight = Math.max(1, frameOverlay.height - capturePadding * 2);
      const fitScale = getTooltipCanvasFitScale({
        app,
        container: sourceContainer,
        width: visibleWidth,
        height: visibleHeight,
      });
      const drawWidth = frameOverlay.width * fitScale;
      const drawHeight = frameOverlay.height * fitScale;
      const visibleDrawWidth = visibleWidth * fitScale;
      const visibleDrawHeight = visibleHeight * fitScale;
      const drawPadding = capturePadding * fitScale;
      const framePosition = getTooltipFrameCanvasPosition(nodeId, {
        sample,
        frameContext,
        container: sourceContainer,
        width: visibleDrawWidth,
        height: visibleDrawHeight,
      });
      const dynamicPosition =
        framePosition ??
        (frameOverlay.isPreparedKeyframeOverlay
          ? null
          : getTooltipCanvasPosition(nodeId, {
              app,
              nodeMap,
              width: visibleDrawWidth,
              height: visibleDrawHeight,
            }));

      if (!dynamicPosition && nodeId) return;

      context.drawImage(
        frameOverlay.canvas,
        (dynamicPosition?.x ?? frameOverlay.x ?? 0) - drawPadding,
        (dynamicPosition?.y ?? frameOverlay.y ?? 0) - drawPadding,
        drawWidth,
        drawHeight,
      );
    },
    clear,
    dispose() {
      disposed = true;
      overlay = null;
      keyframeOverlays.clear();
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

async function captureTooltipElement(tooltipElement, { expanded = false, captureScale } = {}) {
  let restoreCaptureStyles = null;
  let addedPreparingClass = false;
  try {
    if (expanded) {
      tooltipElement.classList.add(TOOLTIP_VIDEO_CAPTURE_CLASS);
    }

    const isReady = await waitForTooltipContentReady(tooltipElement);
    if (!isReady) return null;
    await waitForFontsReady();

    if (!document.body?.classList.contains(TOOLTIP_VIDEO_PREPARING_CLASS)) {
      document.body?.classList.add(TOOLTIP_VIDEO_PREPARING_CLASS);
      addedPreparingClass = true;
    }
    restoreCaptureStyles = moveTooltipIntoCaptureViewport(tooltipElement);
    const { default: html2canvas } = await import("html2canvas");
    const scale = getTooltipCaptureScale(captureScale);
    const rect = tooltipElement.getBoundingClientRect();
    const contentElement = tooltipElement.querySelector(".tooltip-popup-content");
    const width = Math.ceil(Math.max(1, rect.width, tooltipElement.scrollWidth, contentElement?.scrollWidth ?? 0)) + 2;
    const height = Math.ceil(Math.max(1, rect.height, tooltipElement.scrollHeight, contentElement?.scrollHeight ?? 0)) + 2;
    const canvas = await html2canvas(tooltipElement, {
      backgroundColor: null,
      foreignObjectRendering: true,
      height,
      logging: false,
      onclone: (clonedDocument, clonedElement) => {
        clonedDocument.body?.classList.remove(TOOLTIP_VIDEO_PREPARING_CLASS);
        clonedElement.classList.add(TOOLTIP_VIDEO_CAPTURE_CLASS);
        clonedElement.style.opacity = "1";
        clonedElement.style.visibility = "visible";
        clonedElement.style.left = "0px";
        clonedElement.style.top = "0px";
        clonedElement.style.right = "auto";
        clonedElement.style.bottom = "auto";
        clonedElement.style.transform = "none";
        clonedElement.style.width = `${width}px`;
        clonedElement.style.height = `${height}px`;
      },
      scale,
      useCORS: true,
      width,
      windowHeight: Math.max(window.innerHeight, Math.ceil(rect.top + height + TOOLTIP_CAPTURE_VIEWPORT_MARGIN)),
      windowWidth: Math.max(window.innerWidth, Math.ceil(rect.left + width + TOOLTIP_CAPTURE_VIEWPORT_MARGIN)),
    });
    const paddedCapture = addCanvasPadding(canvas, scale, TOOLTIP_CAPTURE_PADDING);

    return {
      canvas: paddedCapture.canvas,
      width: paddedCapture.canvas.width / scale,
      height: paddedCapture.canvas.height / scale,
      padding: paddedCapture.padding,
    };
  } catch {
    return null;
  } finally {
    if (restoreCaptureStyles) {
      restoreCaptureStyles();
    }
    if (expanded) {
      tooltipElement.classList.remove(TOOLTIP_VIDEO_CAPTURE_CLASS);
    }
    if (addedPreparingClass) {
      document.body?.classList.remove(TOOLTIP_VIDEO_PREPARING_CLASS);
    }
  }
}

function getTooltipCaptureScale(captureScale) {
  const deviceScale = typeof window === "undefined" ? 1 : Math.max(1, window.devicePixelRatio || 1);
  const requestedScale = Number.parseFloat(captureScale);
  if (!Number.isFinite(requestedScale) || requestedScale <= 0) return deviceScale;
  return Math.max(deviceScale, requestedScale);
}

function moveTooltipIntoCaptureViewport(tooltipElement) {
  const previous = {
    left: tooltipElement.style.left,
    top: tooltipElement.style.top,
    right: tooltipElement.style.right,
    bottom: tooltipElement.style.bottom,
    transform: tooltipElement.style.transform,
  };

  tooltipElement.style.left = "0px";
  tooltipElement.style.top = "0px";
  tooltipElement.style.right = "auto";
  tooltipElement.style.bottom = "auto";
  tooltipElement.style.transform = "none";

  return () => {
    tooltipElement.style.left = previous.left;
    tooltipElement.style.top = previous.top;
    tooltipElement.style.right = previous.right;
    tooltipElement.style.bottom = previous.bottom;
    tooltipElement.style.transform = previous.transform;
  };
}

function addCanvasPadding(canvas, scale, padding) {
  const pixelPadding = Math.ceil(Math.max(0, padding) * scale);
  if (!canvas || pixelPadding <= 0) return { canvas, padding: 0 };

  const paddedCanvas = document.createElement("canvas");
  paddedCanvas.width = canvas.width + pixelPadding * 2;
  paddedCanvas.height = canvas.height + pixelPadding * 2;

  const context = paddedCanvas.getContext("2d");
  if (!context) return { canvas, padding: 0 };

  context.drawImage(canvas, pixelPadding, pixelPadding);
  return {
    canvas: paddedCanvas,
    padding: pixelPadding / Math.max(1, scale),
  };
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

    const hasRequiredDetails = !waitForProteinDetails || isTooltipApiReady(tooltipElement);
    const waitedLongEnough = currentTime - startedAt >= minWait;
    const isStable = currentTime - stableSince >= TOOLTIP_CAPTURE_STABLE_MS;

    if (hasRequiredDetails && waitedLongEnough && isStable) return true;
  }

  return !waitForProteinDetails || isTooltipApiReady(tooltipElement) || hasProteinDetailFields(tooltipElement);
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

function isTooltipApiReady(tooltipElement) {
  const readyState = tooltipElement?.dataset?.tooltipApiReady;
  if (readyState === "true") return true;
  if (readyState === "false") return false;

  return hasProteinDetailFields(tooltipElement);
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

function getTooltipNodeForScene(scene, nodeMap) {
  const nodeId = scene?.tooltipNodeId;
  if (!nodeId) return null;

  const fromSceneGraph = scene.graphSnapshot?.nodes?.find((node) => String(node.id) === String(nodeId));
  if (fromSceneGraph) return fromSceneGraph;

  const fromNodeMap = nodeMap?.[nodeId]?.node;
  if (fromNodeMap) return fromNodeMap;

  return useGraphState.getState().graphState.graph?.data?.nodes?.find((node) => String(node.id) === String(nodeId)) ?? null;
}

function getTooltipOverlayForSample(sample, overlays) {
  if (!sample || !overlays?.size) return null;
  if (sample.stepType === "transition" && sample.rawT < TOOLTIP_TRANSITION_SHOW_AT) return null;

  const keyframe = sample.stepType === "transition" ? sample.to : sample.keyframe ?? sample.to ?? sample.from;
  return keyframe?.id ? overlays.get(keyframe.id) ?? null : null;
}

function getTooltipCanvasPosition(nodeId, { app, nodeMap, width = 0, height = 0 } = {}) {
  const point = getNodeCanvasPosition(nodeId, { app, nodeMap });
  const size = getCanvasCssSize(app);
  if (!point || !size) return null;

  return fitTooltipNearPoint({ ...point, radius: getNodeCanvasRadius(nodeId, { nodeMap }) }, size, width, height);
}

function getTooltipFrameCanvasPosition(nodeId, { sample, frameContext, container, width = 0, height = 0 } = {}) {
  const point = getFrameNodeCanvasPosition(nodeId, { sample, frameContext, container });
  const size = getCanvasCssSizeFromContainer(container);
  if (!point || !size) return null;

  return fitTooltipNearPoint(point, size, width, height);
}

function getFrameNodeCanvasPosition(nodeId, { sample, frameContext, container } = {}) {
  if (!nodeId || !frameContext?.graphData?.nodes || !container) return null;

  const node = frameContext.graphData.nodes.find((currentNode) => String(currentNode.id) === String(nodeId));
  if (!node || getSceneAlpha(node) <= 0) return null;

  if (sample?.mode === "3d") {
    return projectTooltipNode3D(node, sample.view, container);
  }

  const zoom = clamp(Number.isFinite(Number.parseFloat(sample?.view?.zoom)) ? Number.parseFloat(sample.view.zoom) : 1, 0.05, 50);
  return {
    x: container.width / 2 - (Number.parseFloat(sample?.view?.centerX) || 0) * zoom + (Number.parseFloat(node.x) || 0) * zoom,
    y: container.height / 2 - (Number.parseFloat(sample?.view?.centerY) || 0) * zoom + (Number.parseFloat(node.y) || 0) * zoom,
    radius: canvasNodeRadius * zoom,
  };
}

function projectTooltipNode3D(node, camera, container) {
  if (!container?.width || !container?.height) return null;

  const centerX = container.width / 2;
  const centerY = container.height / 2;
  const rotX = camera?.rotX ?? defaultCamera.rotX;
  const rotY = camera?.rotY ?? defaultCamera.rotY;
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const cameraX = camera?.x ?? centerX;
  const cameraY = camera?.y ?? centerY;
  const cameraZ = camera?.z ?? defaultCamera.z;
  const fov = camera?.fov ?? defaultCamera.fov;

  const shiftedX = (Number.parseFloat(node.x) || 0) - centerX;
  const shiftedY = (Number.parseFloat(node.y) || 0) - centerY;
  const zBase = Number.parseFloat(node.z) || 0;

  let x = shiftedX * cosY - zBase * sinY;
  let z = shiftedX * sinY + zBase * cosY;
  const y = shiftedY * cosX - z * sinX;
  z = shiftedY * sinX + z * cosX;

  const dx = x + centerX - cameraX;
  const dy = y + centerY - cameraY;
  const dz = z - cameraZ;

  if (dz <= 0.000001) return null;

  const scale = fov / Math.abs(dz);
  return {
    x: centerX + dx * scale,
    y: centerY + dy * scale,
    radius: canvasNodeRadius * scale,
  };
}

function getSceneAlpha(item) {
  const alpha = Number.parseFloat(item?.__alpha);
  if (!Number.isFinite(alpha)) return 1;
  return clamp(alpha, 0, 1);
}

function fitTooltipNearPoint(point, size, width = 0, height = 0) {
  const visualRadius = Math.max(0, Number.isFinite(point?.radius) ? point.radius : 0);
  let x = point.x + visualRadius + TOOLTIP_OFFSET;
  let y = point.y;

  if (x + width > size.width - TOOLTIP_MARGIN) {
    x = point.x - visualRadius - width - TOOLTIP_OFFSET;
  }
  if (y + height > size.height - TOOLTIP_MARGIN) {
    y = point.y - height;
  }

  return {
    x: clamp(x, TOOLTIP_MARGIN, Math.max(TOOLTIP_MARGIN, size.width - width - TOOLTIP_MARGIN)),
    y: clamp(y, TOOLTIP_MARGIN, Math.max(TOOLTIP_MARGIN, size.height - height - TOOLTIP_MARGIN)),
  };
}

function getTooltipCanvasFitScale({ app, container, width = 0, height = 0 } = {}) {
  const size = getCanvasCssSizeFromContainer(container) ?? getCanvasCssSize(app);
  if (!size || width <= 0 || height <= 0) return 1;

  const maxWidth = Math.max(1, Math.min(size.width - TOOLTIP_MARGIN * 2, TOOLTIP_VIDEO_MAX_WIDTH));
  const maxHeight = Math.max(1, Math.min(size.height - TOOLTIP_MARGIN * 2, TOOLTIP_VIDEO_MAX_HEIGHT));
  return Math.min(1, maxWidth / width, maxHeight / height);
}

function getCanvasCssSizeFromContainer(container) {
  if (!container?.width || !container?.height) return null;
  return {
    width: Math.max(1, container.width),
    height: Math.max(1, container.height),
  };
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

function getNodeCanvasRadius(nodeId, { nodeMap } = {}) {
  const circle = nodeMap?.[nodeId]?.circle;
  if (!circle || circle.destroyed) return canvasNodeRadius;

  try {
    const wt = circle.worldTransform;
    if (wt) {
      const scaleX = Math.hypot(Number.parseFloat(wt.a) || 0, Number.parseFloat(wt.b) || 0);
      const scaleY = Math.hypot(Number.parseFloat(wt.c) || 0, Number.parseFloat(wt.d) || 0);
      const worldScale = Math.max(scaleX, scaleY);
      if (Number.isFinite(worldScale) && worldScale > 0) return canvasNodeRadius * worldScale;
    }

    const localScale = Number.parseFloat(circle.scale?.x);
    if (Number.isFinite(localScale) && localScale > 0) return canvasNodeRadius * localScale;
  } catch {
    return canvasNodeRadius;
  }

  return canvasNodeRadius;
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
