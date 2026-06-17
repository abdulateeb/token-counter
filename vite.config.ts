import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from the custom apex domain (tokencounter.tech) at the root path,
// so the base is "/". If you ever drop the custom domain and use the
// project URL (abdulateeb.github.io/token-counter/), change this back to
// "/token-counter/".
export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 1500,
  },
});
