import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["dist/**", "node_modules/**", "src/__tests__/integration/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      exclude: ["src/__tests__/**", "src/types.ts", "src/index.ts"],
      thresholds: {
        statements: 65,
        branches: 55,
        functions: 75,
        lines: 65,
      },
    },
  },
});
