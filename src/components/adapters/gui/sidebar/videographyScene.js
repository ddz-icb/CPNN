import { useFilter } from "../../state/filterState.js";
import { usePhysics } from "../../state/physicsState.js";
import { tooltipInit, useTooltipSettings } from "../../state/tooltipState.js";

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

export function createCapturedKeyframeScene() {
  const snapshot = captureSceneStateSnapshot();
  const tooltipNodeId = getActiveTooltipNodeId(snapshot.tooltipSettings);

  return {
    filterAction: KEYFRAME_SCENE_ACTION_APPLY,
    filterSnapshot: snapshot.filter,
    physicsAction: KEYFRAME_SCENE_ACTION_APPLY,
    physicsSnapshot: snapshot.physics,
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
    tooltipAction:
      scene.tooltipAction === KEYFRAME_SCENE_ACTION_APPLY || scene.tooltipAction === KEYFRAME_TOOLTIP_ACTION_OPEN
        ? KEYFRAME_TOOLTIP_ACTION_OPEN
        : scene.tooltipAction === KEYFRAME_TOOLTIP_ACTION_CLOSE
          ? KEYFRAME_TOOLTIP_ACTION_CLOSE
          : KEYFRAME_SCENE_ACTION_INHERIT,
    tooltipNodeId: typeof scene.tooltipNodeId === "string" && scene.tooltipNodeId.length > 0 ? scene.tooltipNodeId : null,
  };
}

export function captureSceneStateSnapshot() {
  return {
    filter: cloneSerializable(useFilter.getState().filter),
    physics: cloneSerializable(usePhysics.getState().physics),
    tooltipSettings: cloneSerializable(useTooltipSettings.getState().tooltipSettings),
  };
}

export function restoreSceneStateSnapshot(snapshot) {
  if (!snapshot) return;
  if (snapshot.filter) {
    useFilter.getState().setAllFilter(cloneSerializable(snapshot.filter));
  }
  if (snapshot.physics) {
    usePhysics.getState().setAllPhysics(cloneSerializable(snapshot.physics));
  }
  if (snapshot.tooltipSettings) {
    useTooltipSettings.getState().setAllTooltipSettings(cloneSerializable(snapshot.tooltipSettings));
  }
}

export async function applyKeyframeScene(keyframe, { app, nodeMap, settle = true } = {}) {
  const scene = getKeyframeScene(keyframe);
  let filterChanged = false;
  let physicsChanged = false;
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

  if (settle && physicsChanged) {
    await waitForFrames(2);
  }

  if (scene.tooltipAction === KEYFRAME_TOOLTIP_ACTION_OPEN && scene.tooltipNodeId) {
    tooltipChanged = openClickTooltipForNode(scene.tooltipNodeId, { app, nodeMap });
  }

  if (tooltipChanged) {
    await waitForFrames(2);
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
  let tooltipChanged = false;

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

  if (settle && filterChanged) {
    await wait(FILTER_SCENE_SETTLE_MS);
  }

  if (tooltipChanged) {
    await waitForFrames(2);
  }

  return { filterChanged, tooltipChanged };
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
      const { default: html2canvas } = await import("html2canvas");
      const tooltipCanvas = await html2canvas(tooltipElement, {
        backgroundColor: null,
        logging: false,
        useCORS: true,
        scale: Math.max(1, window.devicePixelRatio || 1),
      });

      if (disposed || currentVersion !== version) return;

      const tooltipRect = tooltipElement.getBoundingClientRect();
      const sourceRect = sourceCanvas.getBoundingClientRect();

      overlay = {
        canvas: tooltipCanvas,
        x: tooltipRect.left - sourceRect.left,
        y: tooltipRect.top - sourceRect.top,
        width: tooltipRect.width,
        height: tooltipRect.height,
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
    draw(context) {
      if (!overlay || !context) return;
      context.drawImage(overlay.canvas, overlay.x, overlay.y, overlay.width, overlay.height);
    },
    clear,
    dispose() {
      disposed = true;
      overlay = null;
      captureInFlight = null;
    },
  };
}

function openClickTooltipForNode(nodeId, { app, nodeMap } = {}) {
  const entry = nodeMap?.[nodeId];
  const circle = entry?.circle;
  const sourceCanvas = getPixiCanvas(app);

  if (!entry?.node || !circle || !sourceCanvas) {
    useTooltipSettings.getState().setAllTooltipSettings(cloneSerializable(tooltipInit));
    return true;
  }

  try {
    const rect = sourceCanvas.getBoundingClientRect();
    const wt = circle.worldTransform;

    useTooltipSettings.getState().setAllTooltipSettings({
      isClickTooltipActive: true,
      clickTooltipData: {
        node: entry.node.id,
        nodeAttribs: entry.node.attribs ?? [],
        x: rect.left + wt.tx,
        y: rect.top + wt.ty,
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
