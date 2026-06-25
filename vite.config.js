import { defineConfig, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import fs from "node:fs";

// Vite configuration for the React frontend. Keeps CRA conventions where possible.
const srcDir = path.resolve(process.cwd(), "src").replace(/\\/g, "/") + "/";

const jsxInJs = () => ({
  name: "jsx-in-js",
  enforce: "pre",
  async load(id) {
    const fileName = id.split("?")[0];
    if (!fileName.startsWith(srcDir) || !fileName.match(/\.[jt]sx?$/)) return null;
    // Convert forward slashes back to backslashes only on Windows
    const filePath = process.platform === "win32" ? fileName.replace(/\//g, "\\") : fileName;
    const code = fs.readFileSync(filePath, "utf-8");
    return transformWithEsbuild(code, id, {
      loader: "jsx",
      jsx: "automatic",
    });
  },
});

const proxy = {
  "/stringdb-api": {
    target: "https://string-db.org/api",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/stringdb-api/, ""),
  },
  "/omnipathdb-api": {
    target: "https://omnipathdb.org",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/omnipathdb-api/, ""),
  },
};

export default defineConfig(({ mode }) => ({
  plugins: [
    jsxInJs(),
    react({
      // Enable JSX in .js files across the project.
      include: /\.[jt]sx?(\?.*)?$/,
    }),
  ],
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/,
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  server: {
    port: 3000,
    strictPort: false,
    allowedHosts: ["cpnn.ddz.de"],
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    proxy,
  },
  preview: {
    port: 3000,
    strictPort: true,
    allowedHosts: ["cpnn.ddz.de"],
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    proxy,
  },
  build: {
    // Keep the CRA-style output directory so downstream scripts (serve, etc.) still work.
    outDir: "build",
  },
  envPrefix: ["VITE_", "REACT_APP_"],
  define: {
    // Preserve access to NODE_ENV checks used in the app while moving to Vite's env system.
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
}));
