import { randomUUID } from "node:crypto";

import nodemailer, { type Transporter } from "nodemailer";
import type { Prisma } from "@/generated/prisma/client";

import { parseEmailEnv, parseServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma";
import { formatAccountToken } from "@/lib/auth/account-token";

import { nextEmailAttempt } from "./retry";
import {
  RECOVERY_EMAIL_KIND,
  renderPasswordResetEmail,
  renderVerificationEmail,
  renderWelcomeEmail,
  VERIFICATION_EMAIL_KIND,
  WELCOME_EMAIL_KIND,
} from "./template";

const LEASE_MS = 2 * 60 * 1000;
let transporter: Transporter | undefined;

export async function processNextEmail(workerId: string, now = new Date()): Promise<boolean> {
  const prisma = getPrisma();
  const available: Prisma.EmailOutboxWhereInput = {
    OR: [
      { status: { in: ["PENDING", "RETRY"] }, nextAttemptAt: { lte: now } },
      { status: "PROCESSING", leaseExpiresAt: { lt: now } },
    ],
  };
  const candidate = await prisma.emailOutbox.findFirst({
    where: available,
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (candidate === null) return false;

  const leaseExpiresAt = new Date(now.getTime() + LEASE_MS);
  const claimed = await prisma.emailOutbox.updateMany({
    where: { id: candidate.id, ...available },
    data: {
      status: "PROCESSING",
      leaseOwner: workerId,
      leaseExpiresAt,
      attemptCount: { increment: 1 },
    },
  });
  if (claimed.count === 0) return true;

  const email = await prisma.emailOutbox.findUniqueOrThrow({
    where: { id: candidate.id },
    select: {
      id: true,
      kind: true,
      attemptCount: true,
      user: { select: { email: true } },
      accountToken: { select: { id: true, purpose: true } },
    },
  });

  try {
    const emailEnv = parseEmailEnv();
    const serverEnv = parseServerEnv();
    const message = renderMessage(email, serverEnv.SITE_URL, serverEnv.AUTH_SESSION_SECRET);
    const info = await getTransporter().sendMail({
      from: { name: emailEnv.EMAIL_FROM_NAME, address: emailEnv.EMAIL_FROM },
      to: email.user.email,
      subject: message.subject,
      text: message.text,
      html: message.html,
      messageId: `<${email.id}@${emailEnv.EMAIL_FROM.split("@")[1]}>`,
    });
    await prisma.emailOutbox.updateMany({
      where: { id: email.id, leaseOwner: workerId, status: "PROCESSING" },
      data: {
        status: "SENT",
        sentAt: new Date(),
        providerMessageId: info.messageId,
        leaseOwner: null,
        leaseExpiresAt: null,
        lastErrorCategory: null,
      },
    });
    logger.info({ emailId: email.id, kind: email.kind }, "transactional email sent");
  } catch (error) {
    const nextAttemptAt = nextEmailAttempt(email.attemptCount, new Date());
    await prisma.emailOutbox.updateMany({
      where: { id: email.id, leaseOwner: workerId, status: "PROCESSING" },
      data: {
        status: nextAttemptAt === null ? "DEAD" : "RETRY",
        nextAttemptAt: nextAttemptAt ?? new Date(),
        leaseOwner: null,
        leaseExpiresAt: null,
        lastErrorCategory: categorizeEmailError(error),
      },
    });
    logger.error(
      { emailId: email.id, kind: email.kind, errorType: categorizeEmailError(error) },
      "transactional email delivery failed",
    );
  }
  return true;
}

export function createEmailWorkerId(): string {
  return randomUUID();
}

function getTransporter(): Transporter {
  if (transporter !== undefined) return transporter;
  const env = parseEmailEnv();
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER === undefined ? undefined : { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

function renderMessage(
  email: { kind: string; accountToken: { id: string; purpose: string } | null },
  siteUrl: string,
  secret: string,
) {
  const actionUrl = createActionUrl(email.accountToken, siteUrl, secret);
  if (email.kind === WELCOME_EMAIL_KIND) return renderWelcomeEmail(siteUrl, actionUrl);
  if (email.kind === VERIFICATION_EMAIL_KIND && actionUrl !== undefined)
    return renderVerificationEmail(actionUrl);
  if (email.kind === RECOVERY_EMAIL_KIND && actionUrl !== undefined)
    return renderPasswordResetEmail(actionUrl);
  throw new Error("UnsupportedEmailKind");
}

function createActionUrl(
  token: { id: string; purpose: string } | null,
  siteUrl: string,
  secret: string,
): string | undefined {
  if (token === null) return undefined;
  if (token.purpose !== "EMAIL_VERIFICATION" && token.purpose !== "PASSWORD_RESET")
    return undefined;
  const path = token.purpose === "EMAIL_VERIFICATION" ? "/verificar-email" : "/redefinir-senha";
  const url = new URL(path, siteUrl);
  url.searchParams.set("token", formatAccountToken(token.id, token.purpose, secret));
  return url.toString();
}

function categorizeEmailError(error: unknown): string {
  if (error instanceof Error && error.message === "UnsupportedEmailKind") return "UNSUPPORTED_KIND";
  if (error instanceof Error) return error.name.slice(0, 50);
  return "UNKNOWN_ERROR";
}
