import { z } from "zod";

export const journalEntryInputSchema = z.object({
  date: z.iso.date(),
  content: z.string().trim().min(1).max(4000),
});

export const journalEntrySchema = z.object({
  id: z.uuid(),
  profileId: z.uuid(),
  date: z.iso.date(),
  content: z.string().min(1).max(4000),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const journalEntriesResponseSchema = z.object({
  entries: z.array(journalEntrySchema),
});

export type JournalEntry = z.infer<typeof journalEntrySchema>;
