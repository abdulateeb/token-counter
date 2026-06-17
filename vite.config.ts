import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the project site under /<repo>/.
// Set base so built asset URLs resolve correctly.
export default defineConfig({
  base: "/token-counter/",
  plugins: [react()],
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 1500,
  },
});
