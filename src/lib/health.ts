import { Prisma } from "@/generated/prisma/client";

import { getPrisma } from "./prisma";
import { getRedis } from "./redis";

export type DependencyStatus = "up" | "down";

export interface ReadinessResult {
  ready: boolean;
  checks: { database: DependencyStatus; redis: DependencyStatus };
}

const CHECK_TIMEOUT_MS = 2_500;

async function withTimeout<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("dependency check timed out")), CHECK_TIMEOUT_MS);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function isDatabaseReady(): Promise<boolean> {
  try {
    await withTimeout(getPrisma().$queryRaw(Prisma.sql`SELECT 1`));
    return true;
  } catch {
    return false;
  }
}

async function isRedisReady(): Promise<boolean> {
  try {
    const client = getRedis();
    if (client.status === "wait") await withTimeout(client.connect());
    return (await withTimeout(client.ping())) === "PONG";
  } catch {
    return false;
  }
}

export async function checkReadiness(): Promise<ReadinessResult> {
  const [databaseReady, redisReady] = await Promise.all([isDatabaseReady(), isRedisReady()]);
  return {
    ready: databaseReady && redisReady,
    checks: {
      database: databaseReady ? "up" : "down",
      redis: redisReady ? "up" : "down",
    },
  };
}
