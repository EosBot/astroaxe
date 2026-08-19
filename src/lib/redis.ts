import Redis from "ioredis";

import { parseServerEnv } from "./env";

let redis: Redis | undefined;

export function getRedis(): Redis {
  if (!redis) {
    const { REDIS_URL } = parseServerEnv();
    redis = new Redis(REDIS_URL, {
      lazyConnect: true,
      enableReadyCheck: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 3_000,
      commandTimeout: 3_000,
      retryStrategy: (attempt) => Math.min(attempt * 100, 1_000),
    });
  }
  return redis;
}

export async function disconnectRedis(): Promise<void> {
  const client = redis;
  if (!client) return;

  redis = undefined;
  client.disconnect(false);
}
