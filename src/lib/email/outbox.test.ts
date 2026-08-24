import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  updateMany: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  sendMail: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail: mocks.sendMail }) },
}));
vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    emailOutbox: {
      findFirst: mocks.findFirst,
      updateMany: mocks.updateMany,
      findUniqueOrThrow: mocks.findUniqueOrThrow,
    },
  }),
}));
vi.mock("@/lib/env", () => ({
  parseEmailEnv: () => ({
    SMTP_HOST: "mailpit",
    SMTP_PORT: 1025,
    SMTP_SECURE: false,
    EMAIL_FROM: "nao-responda@astroaxe.local",
    EMAIL_FROM_NAME: "AstroAxe",
  }),
  parseServerEnv: () => ({
    SITE_URL: "https://astroaxe.example.test",
    AUTH_SESSION_SECRET: "test-secret-with-more-than-thirty-two-characters",
  }),
}));
vi.mock("@/lib/logger", () => ({ logger: { info: mocks.info, error: mocks.error } }));

import { processNextEmail } from "./outbox";

describe("processNextEmail", () => {
  const now = new Date("2026-08-22T12:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findFirst.mockResolvedValue({ id: "email-id" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.findUniqueOrThrow.mockResolvedValue({
      id: "email-id",
      kind: "ACCOUNT_WELCOME",
      attemptCount: 1,
      user: { email: "recipient@example.test" },
      accountToken: null,
    });
    mocks.sendMail.mockResolvedValue({ messageId: "provider-id" });
  });

  it("returns idle when no message is available", async () => {
    mocks.findFirst.mockResolvedValue(null);
    await expect(processNextEmail("worker-id", now)).resolves.toBe(false);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("continues when another worker wins the lease", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    await expect(processNextEmail("worker-id", now)).resolves.toBe(true);
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it("sends and records the provider message ID without logging the recipient", async () => {
    await expect(processNextEmail("worker-id", now)).resolves.toBe(true);
    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "recipient@example.test",
        messageId: "<email-id@astroaxe.local>",
      }),
    );
    expect(mocks.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "SENT" }) }),
    );
    expect(mocks.info).toHaveBeenCalledWith(
      { emailId: "email-id", kind: "ACCOUNT_WELCOME" },
      expect.any(String),
    );
  });

  it("schedules a retry after a transient SMTP failure", async () => {
    mocks.sendMail.mockRejectedValue(new TypeError("connection failed"));
    await expect(processNextEmail("worker-id", now)).resolves.toBe(true);
    expect(mocks.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "RETRY", lastErrorCategory: "TypeError" }),
      }),
    );
  });

  it("dead-letters an exhausted or unsupported message", async () => {
    mocks.findUniqueOrThrow.mockResolvedValue({
      id: "email-id",
      kind: "UNKNOWN",
      attemptCount: 6,
      user: { email: "recipient@example.test" },
      accountToken: null,
    });
    await expect(processNextEmail("worker-id", now)).resolves.toBe(true);
    expect(mocks.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "DEAD", lastErrorCategory: "UNSUPPORTED_KIND" }),
      }),
    );
  });
});
