import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./test-support/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "src/app/api/**/*.ts",
        "src/lib/**/*.ts",
        "src/domain/**/*.ts",
        "src/components/**/*.tsx",
      ],
      exclude: ["src/generated/**"],
    },
  },
});
