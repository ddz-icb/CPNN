import { defineConfig, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

// Vite configuration for the React frontend. Keeps CRA conventions where possible.
const jsxInJs = () => ({
  name: "jsx-in-js",
  enforce: "pre",
  async transform(code, id) {
    if (!id.match(/\.[jt]sx?$/)) return null;
    return transformWithEsbuild(code, id, {
      loader: "jsx",
      jsx: "automatic",
    });
  },
});

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
    strictPort: true,
    allowedHosts: ["cpnn.ddz.de"],
  },
  preview: {
    port: 3000,
    strictPort: true,
    allowedHosts: ["cpnn.ddz.de"],
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
