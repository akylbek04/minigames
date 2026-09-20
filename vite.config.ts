import { defineConfig } from "vite";

export default defineConfig({
  // Served from https://akylbek04.github.io/minigames/ on GitHub Pages, not
  // domain root.
  base: "/minigames/",
  build: {
    outDir: "dist",
  },
});
