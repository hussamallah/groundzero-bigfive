// Output schema guard using Zod
import { z } from "zod";

// Identity Mirror output: exactly 5 lines
export const ProfileSchema = z.object({
  lines: z
    .array(
      z
        .string()
        .min(6) // enforce some minimal content; exact word count handled upstream
        .max(160)
    )
    .length(5),
});

export type ProfileOutput = z.infer<typeof ProfileSchema>;
