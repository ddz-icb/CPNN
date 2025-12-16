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

