import { useCallback, useRef } from "react";

import { useAppearance } from "../../state/appearanceState.js";
import { useContainer } from "../../state/containerState.js";
import { useGraphState } from "../../state/graphState.js";
import { usePixiState } from "../../state/pixiState.js";
import { useRenderState } from "../../state/canvasState.js";
import { defaultTransitionSecondsInit, holdSecondsInit, useVideography } from "../../state/videographyState.js";
import {
  ButtonGrid,
  DetailNumberRow,
  DetailRow,
  DetailSelectRow,
  FieldBlock,
  SelectFieldBlock,
  SliderBlock,
  StatusProgressBlock,
  ToggleList,
} from "../reusable_components/sidebarComponents.js";
import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import trashSvg from "../../../../assets/icons/trash.svg?raw";
import {
  CAMERA_PATH_LIMITS,
  EASING_OPTIONS,
  applyKeyframe,
  buildKeyframeRows,
  captureCurrentView,
  createCameraKeyframe,
  formatNumber,
  formatKeyframeView,
  getCameraPathDurationMs,
  getKeyframeHoldSeconds,
  getRouteMode,
  getVideoExportQualityPreset,
  getViewMode,
  getViewModeLabel,
  moveKeyframeById,
  playCameraPath,
  recordCameraPathSceneVideo,
  removeKeyframeById,
  sanitizeNumber,
  updateKeyframeById,
  validateCameraPath,
  VIDEO_EXPORT_QUALITY_OPTIONS,
} from "../../../domain/service/videography/videography.js";
import {
  applyKeyframeScene,
  applyKeyframeTransitionScene,
  applyInterpolatedKeyframePhysics,
  captureSceneStateSnapshot,
  createCapturedKeyframeScene,
  createTooltipOverlayController,
  describeKeyframeScene,
  restoreSceneStateSnapshot,
} from "./videographyScene.js";

const DeleteIcon = (props) => <SvgIcon svg={trashSvg} {...props} />;

const VIDEO_SETTING_FIELDS = [
  {
    key: "holdSeconds",
    textKey: "holdSecondsText",
    fallbackValue: holdSecondsInit,
    limits: CAMERA_PATH_LIMITS.holdSeconds,
    text: "Default Hold",
    infoHeading: "Default Hold",
    infoDescription: "Pause time used for new keyframes, and as fallback for older ones.",
  },
];

export function VideographySidebar() {
  const { appearance } = useAppearance();
  const { container } = useContainer();
  const { graphState } = useGraphState();
  const { pixiState } = usePixiState();
  const { renderState } = useRenderState();
  const { videography, setVideography, setKeyframes } = useVideography();
  const lastProgressRef = useRef(0);

  const keyframes = videography.keyframes ?? [];
  const currentMode = getViewMode(appearance);
  const routeMode = getRouteMode(keyframes);
  const exportQualityPreset = getVideoExportQualityPreset(videography.exportQualityPreset);
  const hasModeMismatch = Boolean(routeMode && routeMode !== currentMode);
  const hasReadyCanvas = Boolean(renderState.app && container.width && container.height && graphState.graph);
  const canEditRoute = hasReadyCanvas && !videography.isRendering && !hasModeMismatch;
  const canRenderRoute = canEditRoute && keyframes.length >= 2;
  const totalDurationSeconds = getCameraPathDurationMs(keyframes, videography.holdSeconds) / 1000;
  const transitionLimits = CAMERA_PATH_LIMITS.transitionSeconds;
  const rows = buildKeyframeRows(keyframes);

  const setStatus = useCallback(
    (status, progress = videography.progress) => {
      setVideography("status", status);
      setVideography("progress", progress);
    },
    [setVideography, videography.progress],
  );

  const setRenderProgress = useCallback(
    (progress) => {
      if (progress !== 1 && Math.abs(progress - lastProgressRef.current) < 0.01) return;
      lastProgressRef.current = progress;
      setVideography("progress", progress);
    },
    [setVideography],
  );

  const updateKeyframe = useCallback(
    (id, patch) => {
      setKeyframes((currentKeyframes) => updateKeyframeById(currentKeyframes, id, patch));
    },
    [setKeyframes],
  );

  const handleAddKeyframe = () => {
    const captured = captureCurrentView({ app: renderState.app, appearance, container });
    if (!captured) {
      setStatus("Canvas is not ready.", 0);
      return;
    }

    const nextIndex = keyframes.length;
    const nextKeyframe = {
      ...createCameraKeyframe({
        captured,
        index: nextIndex,
        transitionSeconds: videography.defaultTransitionSeconds,
        holdSeconds: videography.holdSeconds,
      }),
      scene: createCapturedKeyframeScene(),
    };

    setKeyframes([...keyframes, nextKeyframe]);
    setVideography("selectedKeyframeId", nextKeyframe.id);
    setStatus(`Added ${nextKeyframe.label}.`, 0);
  };

  const handleClear = () => {
    setKeyframes([]);
    setVideography("selectedKeyframeId", null);
    setStatus("", 0);
  };

  const runWithCameraPathState = async (operation, busyStatus, completeStatus) => {
    try {
      validateCameraPath(keyframes, currentMode);
      setVideography("error", null);
      setVideography("isRendering", true);
      lastProgressRef.current = 0;
      setStatus(busyStatus, 0);

      await operation();

      setStatus(completeStatus, 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Video rendering failed.";
      setVideography("error", message);
      setStatus(message, 0);
    } finally {
      setVideography("isRendering", false);
    }
  };

  const handlePreview = () =>
    runWithCameraPathState(
      () =>
        playCameraPath({
          keyframes,
          app: renderState.app,
          appearance,
          container,
          holdSeconds: videography.holdSeconds,
          onProgress: setRenderProgress,
          onKeyframeEnter: (keyframe, index) =>
            index === 0 ? applyKeyframeScene(keyframe, { app: renderState.app, nodeMap: pixiState.nodeMap }) : undefined,
          onTransitionStart: (from, to) =>
            applyKeyframeTransitionScene(from, to, { app: renderState.app, nodeMap: pixiState.nodeMap }),
          onTransitionFrame: ({ from, to, easedT }) => applyInterpolatedKeyframePhysics(from, to, easedT),
          syncZoomAtEnd: true,
        }),
      "Previewing camera path...",
      "Preview complete.",
    );

  const handleDownload = () =>
    runWithCameraPathState(
      async () => {
        const sceneSnapshot = captureSceneStateSnapshot();
        const overlayController = createTooltipOverlayController({ app: renderState.app });

        try {
          await recordCameraPathSceneVideo({
            keyframes,
            app: renderState.app,
            appearance,
            container,
            graphName: graphState.graph?.name,
            holdSeconds: videography.holdSeconds,
            exportQualityPreset,
            onProgress: setRenderProgress,
            onKeyframeEnter: async (keyframe, index) => {
              if (index !== 0) return;
              await applyKeyframeScene(keyframe, { app: renderState.app, nodeMap: pixiState.nodeMap });
              overlayController.markDirty();
              await overlayController.sync();
            },
            onTransitionStart: async (from, to) => {
              const transitionScene = await applyKeyframeTransitionScene(from, to, {
                app: renderState.app,
                nodeMap: pixiState.nodeMap,
              });
              if (transitionScene.filterChanged || transitionScene.tooltipChanged) {
                overlayController.markDirty();
                await overlayController.sync();
              }
            },
            onTransitionFrame: ({ from, to, easedT }) => {
              applyInterpolatedKeyframePhysics(from, to, easedT);
            },
            drawOverlay: (context) => overlayController.draw(context),
          });
        } finally {
          overlayController.dispose();
          restoreSceneStateSnapshot(sceneSnapshot);
        }
      },
      "Recording video...",
      "Video downloaded.",
    );

  const modeWarning = hasModeMismatch ? `Route is ${getViewModeLabel(routeMode)}. Switch back to edit or export it.` : "";
  const primaryActions = [
    { text: "Add Keyframe", onClick: handleAddKeyframe, disabled: !canEditRoute },
    { text: "Preview", onClick: handlePreview, disabled: !canRenderRoute },
    { text: "Download Video", onClick: handleDownload, disabled: !canRenderRoute, fullWidth: true },
  ];
  const secondaryActions = [
    {
      text: "Clear Route",
      variant: "secondary",
      onClick: handleClear,
      disabled: videography.isRendering || keyframes.length === 0,
    },
  ];

  return (
    <>
      <ButtonGrid actions={primaryActions} />
      <ButtonGrid actions={secondaryActions} secondary={true} />
      <SliderBlock
        value={videography.defaultTransitionSeconds}
        valueText={videography.defaultTransitionSecondsText}
        setValue={(value) => setVideography("defaultTransitionSeconds", value)}
        setValueText={(value) => setVideography("defaultTransitionSecondsText", value)}
        fallbackValue={defaultTransitionSecondsInit}
        min={transitionLimits.min}
        max={transitionLimits.max}
        step={transitionLimits.step}
        text={"Default Transition"}
        infoHeading={"Default Transition"}
        infoDescription={"Duration used when adding a new keyframe."}
      />
      <SelectFieldBlock
        text={"Export Quality"}
        infoHeading={"Export Quality"}
        infoDescription={"Default exports at 1440p with a smaller file size. High Quality exports at 4K with a higher bitrate."}
        value={exportQualityPreset}
        setValue={(value) => setVideography("exportQualityPreset", getVideoExportQualityPreset(value))}
        options={VIDEO_EXPORT_QUALITY_OPTIONS}
        size={"wide"}
      />
      {VIDEO_SETTING_FIELDS.map(({ key, textKey, fallbackValue, limits, ...fieldProps }) => (
        <FieldBlock
          key={key}
          valueText={videography[textKey]}
          setValue={(value) => setVideography(key, value)}
          setValueText={(value) => setVideography(textKey, value)}
          fallbackValue={fallbackValue}
          min={limits.min}
          max={limits.max}
          step={limits.step}
          {...fieldProps}
        />
      ))}
      <RouteStatus
        status={modeWarning || videography.status}
        progress={videography.progress}
        durationSeconds={totalDurationSeconds}
        busy={videography.isRendering}
        keyframeCount={keyframes.length}
      />
      <ToggleList
        heading={`Camera Keyframes (${keyframes.length})`}
        data={rows}
        displayKey={"primaryText"}
        secondaryKey={"secondaryText"}
        expandedId={videography.selectedKeyframeId}
        getItemId={(keyframe) => keyframe.id}
        onItemToggle={(keyframe) => setVideography("selectedKeyframeId", videography.selectedKeyframeId === keyframe.id ? null : keyframe.id)}
        emptyMessage={"No keyframes"}
        ActionIcon={DeleteIcon}
        onActionIconClick={(keyframe) => {
          setKeyframes((currentKeyframes) => removeKeyframeById(currentKeyframes, keyframe.id));
          if (videography.selectedKeyframeId === keyframe.id) {
            setVideography("selectedKeyframeId", null);
          }
        }}
        actionIconTooltipContent={() => "Delete keyframe"}
        renderExpandedContent={(keyframe) => (
          <KeyframeDetails
            keyframe={keyframe}
            index={keyframes.findIndex((currentKeyframe) => currentKeyframe.id === keyframe.id)}
            keyframeCount={keyframes.length}
            canEdit={canEditRoute}
            defaultHoldSeconds={videography.holdSeconds}
            app={renderState.app}
            appearance={appearance}
            container={container}
            nodeMap={pixiState.nodeMap}
            updateKeyframe={updateKeyframe}
            moveKeyframe={(direction) => setKeyframes((currentKeyframes) => moveKeyframeById(currentKeyframes, keyframe.id, direction))}
            setStatus={setStatus}
          />
        )}
      />
    </>
  );
}

function RouteStatus({ status, progress, durationSeconds, busy, keyframeCount }) {
  const durationText = keyframeCount >= 2 ? `${formatNumber(durationSeconds, 1)}s` : "Add 2+ keyframes";
  const displayProgress = busy ? progress : progress >= 1 ? 1 : 0;

  return <StatusProgressBlock label={"Route"} value={durationText} status={status} progress={displayProgress} />;
}

function KeyframeDetails({
  keyframe,
  index,
  keyframeCount,
  canEdit,
  defaultHoldSeconds,
  app,
  appearance,
  container,
  nodeMap,
  updateKeyframe,
  moveKeyframe,
  setStatus,
}) {
  const transitionSecondsText = keyframe.transitionSecondsText ?? formatNumber(keyframe.transitionSeconds, 2);
  const holdSeconds = getKeyframeHoldSeconds(keyframe, defaultHoldSeconds);
  const holdSecondsText = keyframe.holdSecondsText ?? formatNumber(holdSeconds, 2);
  const transitionLimits = CAMERA_PATH_LIMITS.transitionSeconds;
  const holdLimits = CAMERA_PATH_LIMITS.holdSeconds;

  const handleJump = async () => {
    applyKeyframe(keyframe, { app, appearance, container, syncZoom: true });
    await applyKeyframeScene(keyframe, { app, nodeMap });
    setStatus(`Showing ${keyframe.label}.`);
  };

  const handleUpdateFromView = () => {
    const captured = captureCurrentView({ app, appearance, container });
    if (!captured) {
      setStatus("Canvas is not ready.", 0);
      return;
    }
    updateKeyframe(keyframe.id, { mode: captured.mode, view: captured.view, scene: createCapturedKeyframeScene() });
    setStatus(`Updated ${keyframe.label}.`);
  };
  const actions = [
    { text: "Jump to", variant: "secondary", onClick: handleJump, disabled: !canEdit },
    { text: "Overwrite", variant: "secondary", onClick: handleUpdateFromView, disabled: !canEdit },
    { text: "Up", variant: "secondary", onClick: () => moveKeyframe(-1), disabled: !canEdit || index <= 0 },
    { text: "Down", variant: "secondary", onClick: () => moveKeyframe(1), disabled: !canEdit || index >= keyframeCount - 1 },
  ];

  return (
    <div className="toggle-list-details videography-keyframe-details">
      <DetailRow label={"Mode"} value={getViewModeLabel(keyframe.mode)} />
      <DetailRow label={"View"} value={formatKeyframeView(keyframe)} />
      {index > 0 ? (
        <DetailNumberRow
          label={"Transition"}
          value={transitionSecondsText}
          min={transitionLimits.min}
          max={transitionLimits.max}
          step={transitionLimits.step}
          onChange={(value) => updateKeyframe(keyframe.id, { transitionSecondsText: value })}
          onCommit={(value) => {
            const nextValue = sanitizeNumber(value, keyframe.transitionSeconds, transitionLimits.min, transitionLimits.max);
            updateKeyframe(keyframe.id, {
              transitionSeconds: nextValue,
              transitionSecondsText: formatNumber(nextValue, 2),
            });
          }}
        />
      ) : (
        <DetailRow label={"Transition"} value={"Start frame"} />
      )}
      {index > 0 && (
        <DetailSelectRow
          label={"Easing"}
          value={keyframe.easing ?? EASING_OPTIONS[0].value}
          options={EASING_OPTIONS}
          onChange={(value) => updateKeyframe(keyframe.id, { easing: value })}
          size={"wide"}
          stack={true}
        />
      )}
      <DetailNumberRow
        label={"Hold"}
        value={holdSecondsText}
        min={holdLimits.min}
        max={holdLimits.max}
        step={holdLimits.step}
        onChange={(value) => updateKeyframe(keyframe.id, { holdSecondsText: value })}
        onCommit={(value) => {
          const nextValue = sanitizeNumber(value, holdSeconds, holdLimits.min, holdLimits.max);
          updateKeyframe(keyframe.id, {
            holdSeconds: nextValue,
            holdSecondsText: formatNumber(nextValue, 2),
          });
        }}
      />
      <KeyframeSceneControls keyframe={keyframe} />
      <ButtonGrid actions={actions} compact={true} />
    </div>
  );
}

function KeyframeSceneControls({ keyframe }) {
  const sceneSummary = describeKeyframeScene(keyframe);

  return (
    <>
      <DetailRow label={"Tooltip"} value={sceneSummary.tooltip} />
      <DetailRow label={"Filters"} value={sceneSummary.filter} />
      <DetailRow label={"Physics"} value={sceneSummary.physics} />
    </>
  );
}
