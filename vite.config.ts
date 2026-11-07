import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
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
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Every source file is reported, tested or not.
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        // Test suites themselves.
        "src/**/*.test.{ts,tsx}",
        // Test-only setup and fixtures, never shipped to the browser.
        "src/test/**",
        // Bootstrap only: mounts the router and providers; all app wiring
        // lives in app/routes.tsx and app/AppLayout.tsx.
        "src/main.tsx",
        // Ambient type declarations, no runtime code.
        "src/**/*.d.ts",
      ],
    },
  },
});
