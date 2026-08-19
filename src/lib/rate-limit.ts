import { getRedis } from "@/lib/redis";
import { z } from "zod";

const RATE_LIMIT_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return current
`;

export async function enforceRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const redis = getRedis();
  const count = z.coerce
    .number()
    .int()
    .positive()
    .parse(await redis.eval(RATE_LIMIT_SCRIPT, 1, key, windowSeconds));
  return count <= limit;
}
