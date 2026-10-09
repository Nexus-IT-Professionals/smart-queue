import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { presentationDevMiddleware } from "./scripts/copy-presentation.mjs";

// In dev, the FastAPI backend runs on :8000. In the packaged image the API
// serves the built assets itself, so /api is same-origin and no proxy is needed.
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      name: "public-demo-policy",
      transformIndexHtml() {
        if (mode !== "public-demo") return [];
        return [
          {
            tag: "meta",
            attrs: {
              "http-equiv": "Content-Security-Policy",
              content:
                "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'",
            },
            injectTo: "head-prepend" as const,
          },
        ];
      },
    },
    {
      // Builds copy the presentation via `npm run copy:presentation`; preview
      // serves that dist/ copy. Dev serves the allowlisted source files.
      name: "presentation-dev",
      configureServer(server) {
        server.middlewares.use("/presentation", presentationDevMiddleware());
      },
    },
  ],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
}));
