import { disconnectPrisma } from "@/lib/prisma";
import { deleteExpiredSessions } from "@/lib/retention/cleanup";
import { logger } from "@/lib/logger";

const INTERVAL_MS = 60 * 60 * 1000;
let stopping = false;

async function cleanup(): Promise<void> {
  try {
    const deleted = await deleteExpiredSessions();
    logger.info(deleted, "expired sessions cleaned");
  } catch (error) {
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "session cleanup failed",
    );
  }
}

async function stop(): Promise<void> {
  if (stopping) return;
  stopping = true;
  clearInterval(timer);
  await disconnectPrisma();
  process.exitCode = 0;
}

await cleanup();
const timer = setInterval(() => void cleanup(), INTERVAL_MS);
process.on("SIGTERM", () => void stop());
process.on("SIGINT", () => void stop());
