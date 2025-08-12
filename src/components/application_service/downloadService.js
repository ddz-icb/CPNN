import { useDownload } from "../adapters/state/download/downloadState.js";

export const downloadService = {
  // ===== Generic getter/setter =====
  get(key) {
    return useDownload.getState().download[key];
  },
  set(key, value) {
    useDownload.getState().setDownloadData(key, value);
  },
  getAll() {
    return useDownload.getState().download;
  },
  setAll(value) {
    useDownload.getState().setAllDownload(value);
  },

  // ===== Specific getters/setters =====
  getJson() {
    return this.get("json");
  },
  setJson(val) {
    this.set("json", val);
  },

  getJsonCoordsPhysics() {
    return this.get("jsonCoordsPhysics");
  },
  setJsonCoordsPhysics(val) {
    this.set("jsonCoordsPhysics", val);
  },

  getPng() {
    return this.get("png");
  },
  setPng(val) {
    this.set("png", val);
  },

  getSvg() {
    return this.get("svg");
  },
  setSvg(val) {
    this.set("svg", val);
  },

  getPdf() {
    return this.get("pdf");
  },
  setPdf(val) {
    this.set("pdf", val);
  },

  getLegendPdf() {
    return this.get("legendPdf");
  },
  setLegendPdf(val) {
    this.set("legendPdf", val);
  },
};
