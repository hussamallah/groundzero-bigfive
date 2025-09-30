// Output schema guard using Zod
import { z } from "zod";

export const ProfileSchema = z.object({
  sections: z.object({
    core: z.string().min(30).max(400),
    emotion: z.string().min(30).max(300),
    social: z.string().min(30).max(300),
    values: z.string().min(30).max(300),
    cognition: z.string().min(30).max(300),
    motivation: z.string().min(30).max(300),
    summary: z.object({
      strengths: z.array(z.string()).min(1).max(3),
      risks: z.array(z.string()).min(0).max(3),
      growth: z.array(z.string()).min(1).max(3),
    }),
  }),
});

export type ProfileOutput = z.infer<typeof ProfileSchema>;
