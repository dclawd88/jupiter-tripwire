import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/jup-lite": {
        target: "https://lite-api.jup.ag",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/jup-lite/, "")
      },
      "/jup": {
        target: "https://api.jup.ag",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/jup/, "")
      }
    }
  }
});
