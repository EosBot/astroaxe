import { z } from "zod";

export const credentialsSchema = z.object({
  email: z
    .email()
    .max(320)
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(12).max(128),
});

export const authResponseSchema = z.object({
  user: z.object({ email: z.email() }),
  claimedProfiles: z.number().int().nonnegative().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(12).max(128),
    newPassword: z.string().min(12).max(128),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    path: ["newPassword"],
    message: "A nova senha deve ser diferente da atual.",
  });

export const deleteAccountSchema = z.object({
  currentPassword: z.string().min(12).max(128),
  confirmation: z.literal("EXCLUIR"),
});

export const emailRequestSchema = z.object({
  email: z
    .email()
    .max(320)
    .transform((value) => value.trim().toLowerCase()),
});

export const accountTokenSchema = z.object({
  token: z.string().min(80).max(160),
});

export const passwordResetSchema = accountTokenSchema.extend({
  newPassword: z.string().min(12).max(128),
});
