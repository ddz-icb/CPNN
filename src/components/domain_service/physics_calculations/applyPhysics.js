export function applyPhysics(physics, setPhysics) {
  if (physics.circleLayout !== undefined) setPhysics("circleLayout", physics.circleLayout);
  if (physics.xStrength !== undefined) {
    setPhysics("xStrength", physics.xStrength);
    setPhysics("xStrengthText", physics.xStrength);
  }
  if (physics.yStrength !== undefined) {
    setPhysics("yStrength", physics.yStrength);
    setPhysics("yStrengthText", physics.yStrength);
  }
  if (physics.componentStrength !== undefined) {
    setPhysics("componentStrength", physics.componentStrength);
    setPhysics("componentStrengthText", physics.componentStrength);
  }
  if (physics.nodeRepulsionStrength !== undefined) {
    setPhysics("nodeRepulsionStrength", physics.nodeRepulsionStrength);
    setPhysics("nodeRepulsionStrengthText", physics.nodeRepulsionStrength);
  }
  if (physics.linkForce !== undefined) setPhysics("linkForce", physics.linkForce);
  if (physics.linkLength !== undefined) {
    setPhysics("linkLength", physics.linkLength);
  }
  if (physics.checkBorder !== undefined) setPhysics("checkBorder", physics.checkBorder);
  if (physics.borderWidth !== undefined) {
    setPhysics("borderWidth", physics.borderWidth);
    setPhysics("borderWidthText", physics.borderWidth);
  }
  if (physics.borderHeight !== undefined) {
    setPhysics("borderHeight", physics.borderHeight);
    setPhysics("borderHeightText", physics.borderHeight);
  }
  if (physics.communityForceStrength !== undefined) {
    setPhysics("communityForceStrength", physics.communityForceStrength);
    setPhysics("communityForceStrengthText", physics.communityForceStrength);
  }
}
