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

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const defaultSys = (
    "You are a deterministic paraphraser. You never invent facts. " +
    "You only rewrite blocks using the provided buckets and means. " +
    "No emojis. No filler. 700 words max. Keep sections: Core Orientation, Emotional Regulation, Social Style, Interpersonal Values, Cognitive Style, Motivational Drivers, Summary Pattern. " +
    "Use short, direct sentences. No clinical diagnoses. Return valid JSON matching the exact structure requested. " +
    "Forbidden claims: do not state that \"pressure is manageable\" when Anxiety or Vulnerability is High; do not claim \"cooperation is a strength\" when Cooperation is Low; do not claim \"highly gregarious\" when Gregariousness is Low."
  );
  const defaultUser = (
    "FACTS:\n" +
    "- Openness mean_raw: {{O.mean_raw}}\n" +
    "- Conscientiousness mean_raw: {{C.mean_raw}}\n" +
    "- Extraversion mean_raw: {{E.mean_raw}}\n" +
    "- Agreeableness mean_raw: {{A.mean_raw}}\n" +
    "- Neuroticism mean_raw: {{N.mean_raw}}\n\n" +
    "BUCKETS:\n" +
    "- O: {{O.bucket_json}}\n" +
    "- C: {{C.bucket_json}}\n" +
    "- E: {{E.bucket_json}}\n" +
    "- A: {{A.bucket_json}}\n" +
    "- N: {{N.bucket_json}}\n\n" +
    "MANDATORY LINES (include only when predicate true):\n" +
    "- If O_high_C_high: \"You combine high openness with high conscientiousness. You explore new paths and still land results.\"\n" +
    "- If N_lowAnx: include a sentence that anxiety is low and pressure is manageable.\n" +
    "- If N_highImmod: include a one-line caution about impulse spikes.\n" +
    "- If E_lowGregar: include a one-line guidance to choose rooms over crowds.\n" +
    "- If A_lowCoop: include a one-line note that clarity beats consensus.\n" +
    "- If A_highCoop: include a one-line note about cooperation as a strength.\n\n" +
    "TASK:\n" +
    "Write the full Psychological Profile with the fixed section headers. One to three sentences per section. Base every claim on FACTS and BUCKETS. Do not contradict buckets. Do not mention scores or percentages. " +
    "Hard rules: every section string must be at least 60 characters; use one line per string (no embedded newlines). " +
    "Conclude with a Summary Pattern: Strengths (3 items), Risks (1–3 items), Growth (3 items).\n\n" +
    "Return ONLY valid JSON in this exact format:\n" +
    "{\n  \"sections\": {\n    \"core\": \"string (>=60 chars, one line)\",\n    \"emotion\": \"string (>=60 chars, one line)\",\n    \"social\": \"string (>=60 chars, one line)\",\n    \"values\": \"string (>=60 chars, one line)\",\n    \"cognition\": \"string (>=60 chars, one line)\",\n    \"motivation\": \"string (>=60 chars, one line)\",\n    \"summary\": {\n      \"strengths\": [\"string\", \"string\", \"string\"],\n      \"risks\": [\"string\"],\n      \"growth\": [\"string\", \"string\", \"string\"]\n    }\n  }\n}\n"
  );

  async function fetchOrDefault(path: string, fallback: string): Promise<string> {
    try {
      const res = await fetch(`${origin}${path}`);
      if (!res.ok) return fallback;
      return await res.text();
    } catch {
      return fallback;
    }
  }

  const sys = await fetchOrDefault('/prompts/psych_profile.system.txt', defaultSys);
  const tmpl = await fetchOrDefault('/prompts/psych_profile.user.txt', defaultUser);

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
  // Coerce array-wrapped objects (some models return [ { ... } ])
  if (Array.isArray(json)) {
    json = json[0];
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
