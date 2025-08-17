import { usePhysics } from "../adapters/state/physicsState.js";

export const physicsService = {
  // ===== Generic getter/setter =====
  get(key) {
    return usePhysics.getState().physics[key];
  },
  set(key, value) {
    usePhysics.getState().setPhysics(key, value);
  },
  getAll() {
    return usePhysics.getState().physics;
  },
  setAll(value) {
    usePhysics.getState().setAllPhysics(value);
  },

  // ===== Specific getters/setters =====
  getLinkForce() {
    return this.get("linkForce");
  },
  setLinkForce(val) {
    this.set("linkForce", val);
  },

  getLinkLength() {
    return this.get("linkLength");
  },
  setLinkLength(val) {
    this.set("linkLength", val);
  },

  getGravityStrength() {
    return this.get("gravityStrength");
  },
  setGravityStrength(val) {
    this.set("gravityStrength", val);
  },
  getComponentStrength() {
    return this.get("componentStrength");
  },
  setComponentStrength(val) {
    this.set("componentStrength", val);
  },

  getNodeRepulsionStrength() {
    return this.get("nodeRepulsionStrength");
  },
  setNodeRepulsionStrength(val) {
    this.set("nodeRepulsionStrength", val);
  },

  getNodeCollision() {
    return this.get("nodeCollision");
  },
  setNodeCollision(val) {
    this.set("nodeCollision", val);
  },

  getCircleLayout() {
    return this.get("circleLayout");
  },
  setCircleLayout(val) {
    this.set("circleLayout", val);
  },

  getCommunityForceStrength() {
    return this.get("communityForceStrength");
  },
  setCommunityForceStrength(val) {
    this.set("communityForceStrength", val);
  },

  getCheckBorder() {
    return this.get("checkBorder");
  },
  setCheckBorder(val) {
    this.set("checkBorder", val);
  },

  getBorderWidth() {
    return this.get("borderWidth");
  },
  setBorderWidth(val) {
    this.set("borderWidth", val);
  },

  getBorderHeight() {
    return this.get("borderHeight");
  },
  setBorderHeight(val) {
    this.set("borderHeight", val);
  },
};
