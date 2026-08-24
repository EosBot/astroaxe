const MAX_ATTEMPTS = 6;

export function nextEmailAttempt(attemptCount: number, now: Date): Date | null {
  if (attemptCount >= MAX_ATTEMPTS) return null;
  const delayMinutes = Math.min(2 ** Math.max(0, attemptCount - 1), 60);
  return new Date(now.getTime() + delayMinutes * 60_000);
}
