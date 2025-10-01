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
  
  // Normalize borderline outputs
  if (json && json.sections) {
    const s = json.sections;
    const ensureLine = (t: any) => typeof t === 'string' ? t.replace(/\n+/g, ' ').trim() : t;
    s.core = ensureLine(s.core);
    s.emotion = ensureLine(s.emotion);
    s.social = ensureLine(s.social);
    s.values = ensureLine(s.values);
    s.cognition = ensureLine(s.cognition);
    s.motivation = ensureLine(s.motivation);
    if (s.summary) {
      const coerceArr = (v: any) => Array.isArray(v) ? v.map((x:any)=> String(x)).filter(Boolean) : [];
      s.summary.strengths = coerceArr(s.summary.strengths).slice(0,3);
      s.summary.risks = coerceArr(s.summary.risks).slice(0,3);
      s.summary.growth = coerceArr(s.summary.growth).slice(0,3);
    }
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
