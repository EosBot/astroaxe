import { disconnectPrisma } from "@/lib/prisma";
import { deleteExpiredSessions } from "@/lib/retention/cleanup";
import { logger } from "@/lib/logger";
import { createEmailWorkerId, processNextEmail } from "@/lib/email/outbox";

const INTERVAL_MS = 60 * 60 * 1000;
const EMAIL_POLL_MS = 2_000;
let stopping = false;
let emailDrainRunning = false;
const emailWorkerId = createEmailWorkerId();

async function cleanup(): Promise<void> {
  try {
    const deleted = await deleteExpiredSessions();
    logger.info(deleted, "expired authentication records cleaned");
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
  clearInterval(emailTimer);
  await disconnectPrisma();
  process.exitCode = 0;
}

await cleanup();
const timer = setInterval(() => void cleanup(), INTERVAL_MS);
await drainEmailOutbox();
const emailTimer = setInterval(() => void drainEmailOutbox(), EMAIL_POLL_MS);
process.on("SIGTERM", () => void stop());
process.on("SIGINT", () => void stop());

async function drainEmailOutbox(): Promise<void> {
  if (stopping || emailDrainRunning) return;
  emailDrainRunning = true;
  try {
    while (await processNextEmail(emailWorkerId)) {
      if (stopping) return;
    }
  } catch (error) {
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "email outbox polling failed",
    );
  } finally {
    emailDrainRunning = false;
  }
}
