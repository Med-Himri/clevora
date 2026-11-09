import { z } from "zod";

export const DOC_MAX_CHARS = 60_000;

/** A text document the assistant can quote (règlement, conditions, tarifs...). */
export const documentSchema = z.object({
  title: z.string().trim().min(2, "required").max(120, "tooLong"),
  content: z.string().trim().min(20, "docTooShort").max(DOC_MAX_CHARS, "tooLong"),
});
