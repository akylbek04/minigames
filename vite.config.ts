import { defineConfig } from "vitest/config";

export default defineConfig({
  // Served from https://akylbek04.github.io/minigames/ on GitHub Pages, not
  // domain root.
  base: "/minigames/",
  build: {
    outDir: "dist",
  },
  test: {
    // Components build real DOM (dialogs, popovers, forms), so tests run in
    // a simulated browser.
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Every source file is reported, tested or not.
      include: ["src/**/*.ts"],
      exclude: [
        // Test suites themselves.
        "src/**/*.test.ts",
        // Test-only setup and fixtures, never shipped to the browser.
        "src/test/**",
        // Bootstrap only: imports global styles and calls createApp() and
        // startRouter(); all app wiring lives in app/create-app.ts.
        "src/app/index.ts",
        // Ambient type declarations, no runtime code.
        "src/**/*.d.ts",
      ],
    },
  },
});
