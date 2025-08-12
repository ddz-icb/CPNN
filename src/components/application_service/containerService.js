import { useContainer } from "../adapters/state/containerState.js";

export const containerService = {
  // ===== Generic getter/setter =====
  get(key) {
    return useContainer.getState().container[key];
  },
  set(key, value) {
    useContainer.getState().setContainer(key, value);
  },
  getAll() {
    return useContainer.getState().container;
  },
  setAll(value) {
    useContainer.getState().setAllContainer(value);
  },

  // ===== Specific getters/setters =====
  getHeight() {
    return this.get("height");
  },
  setHeight(val) {
    this.set("height", val);
  },

  getWidth() {
    return this.get("width");
  },
  setWidth(val) {
    this.set("width", val);
  },
};
