export function resetStageTransform(stage) {
  if (!stage) return;
  stage.x = 0;
  stage.y = 0;
  stage.scale?.set?.(1, 1);
}

export function resetGridVisibility(grid, visible) {
  if (!grid) return;
  grid.visible = !!visible;
  grid.clear();
}

export function restoreProjectionHidden(nodeMap) {
  if (!nodeMap) return;
  Object.values(nodeMap).forEach(({ circle, nodeLabel }) => {
    if (circle?.__hiddenByProjection) {
      circle.visible = true;
      circle.__hiddenByProjection = false;
    }
    if (nodeLabel?.__hiddenByProjection) {
      nodeLabel.visible = true;
      nodeLabel.__hiddenByProjection = false;
    }
  });
}
