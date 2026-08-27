import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    ".next/**",
    ".citadel/**",
    // Scratch directory another local tool drops in the repo root, like .citadel above.
    ".tmp/**",
    // Ambientes e caches de ferramentas Python que vivem dentro de scripts/.
    "**/.venv/**",
    "**/__pycache__/**",
    ".planning/**",
    ".codex/agent-context/**",
    "coverage/**",
    "src/generated/**",
  ]),
]);
