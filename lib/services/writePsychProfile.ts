// Call wrapper with hard guards
import { loadFacts } from "../data/buildPayload";
import { predicates } from "../logic/predicates";
import { ProfileSchema, ProfileOutput } from "../logic/schema";
import { enforceGuards } from "../logic/guards";

export async function writePsychProfile(callLLM: (args: {
  system: string;
  user: string;
  temperature: number;
}) => Promise<string>): Promise<ProfileOutput> {
  const facts = loadFacts();
  const p = predicates(facts);

  const sys = await fetch("/prompts/psych_profile.system.txt").then(r => r.text());
  const tmpl = await fetch("/prompts/psych_profile.user.txt").then(r => r.text());

  const fill = (s: string) => s
    .replace("{{O.mean_raw}}", String(facts.domains.O.mean_raw))
    .replace("{{C.mean_raw}}", String(facts.domains.C.mean_raw))
    .replace("{{E.mean_raw}}", String(facts.domains.E.mean_raw))
    .replace("{{A.mean_raw}}", String(facts.domains.A.mean_raw))
    .replace("{{N.mean_raw}}", String(facts.domains.N.mean_raw))
    .replace("{{O.bucket_json}}", JSON.stringify(facts.domains.O.bucket))
    .replace("{{C.bucket_json}}", JSON.stringify(facts.domains.C.bucket))
    .replace("{{E.bucket_json}}", JSON.stringify(facts.domains.E.bucket))
    .replace("{{A.bucket_json}}", JSON.stringify(facts.domains.A.bucket))
    .replace("{{N.bucket_json}}", JSON.stringify(facts.domains.N.bucket))
    + `\n\nPREDICATES: ${JSON.stringify(p)}`;

  const user = fill(tmpl);

  const raw = await callLLM({ system: sys, user, temperature: 0 });
  
  let json: any;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("AI did not return valid JSON");
  }
  
  const parsed = ProfileSchema.safeParse(json);
  if (!parsed.success) {
    console.error("Schema validation failed:", parsed.error);
    throw new Error("Profile failed schema guard");
  }
  // enforce deterministic guardrails against contradictions
  const guarded = enforceGuards(facts, parsed.data);

  return guarded;
}
