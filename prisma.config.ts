import "dotenv/config";

import { defineConfig } from "prisma/config";

import { resolveSecretValue } from "./src/lib/config/read-secret";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url:
      resolveSecretValue(process.env, "DATABASE_URL") ??
      "postgresql://astroaxe:build-only@127.0.0.1:5432/astroaxe?schema=public",
  },
});
