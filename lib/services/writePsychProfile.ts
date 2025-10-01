// Call wrapper with hard guards
import { loadFacts } from "../data/buildPayload";
import { ProfileSchema, ProfileOutput } from "../logic/schema";
import { enforceGuards } from "../logic/guards";

export async function writePsychProfile(callLLM: (args: {
  system: string;
  user: string;
  temperature: number;
}) => Promise<string>): Promise<ProfileOutput> {
  const facts = loadFacts();

  // Map domain mean to High/Medium/Low
  const meanToBucket = (mean: number): 'High'|'Medium'|'Low' => {
    if (mean >= 4.0) return 'High';
    if (mean <= 2.0) return 'Low';
    return 'Medium';
  };

  const O_lvl = meanToBucket(facts.domains.O.mean_raw);
  const C_lvl = meanToBucket(facts.domains.C.mean_raw);
  const E_lvl = meanToBucket(facts.domains.E.mean_raw);
  const A_lvl = meanToBucket(facts.domains.A.mean_raw);
  const N_lvl = meanToBucket(facts.domains.N.mean_raw);
  // Stability (S) is inverse of Neuroticism (N)
  const invert = (v: 'High'|'Medium'|'Low'): 'High'|'Medium'|'Low' => (v === 'High' ? 'Low' : v === 'Low' ? 'High' : 'Medium');
  const S_lvl = invert(N_lvl);

  // Helper to read a facet bucket across domains safely
  const facet = (domain: 'O'|'C'|'E'|'A'|'N', name: string): 'High'|'Medium'|'Low'|undefined => {
    const d = (facts.domains as any)[domain];
    return d?.bucket?.[name];
  };

  // Build normalized facets object focused on rules used in the new prompt
  const facetsPayload: Record<string, 'High'|'Medium'|'Low'|undefined> = {
    // Openness
    Imagination: facet('O','Imagination'),
    ArtisticInterests: facet('O','Artistic Interests'),
    Intellect: facet('O','Intellect'),
    // Conscientiousness
    SelfEfficacy: facet('C','Self-Efficacy'),
    Orderliness: facet('C','Orderliness'),
    Dutifulness: facet('C','Dutifulness'),
    AchievementStriving: facet('C','Achievement-Striving') ?? facet('C','Achievement-Striving'),
    SelfDiscipline: facet('C','Self-Discipline'),
    // Extraversion
    Friendliness: facet('E','Friendliness'),
    Gregariousness: facet('E','Gregariousness'),
    Assertiveness: facet('E','Assertiveness'),
    // Agreeableness
    Morality: facet('A','Morality'),
    Cooperation: facet('A','Cooperation'),
    // Neuroticism
    Anxiety: facet('N','Anxiety'),
    Anger: facet('N','Anger'),
  };

  // Identity Mirror system prompt (deterministic 5-sentence spec)
  const systemPrompt = [
    'Goal: Generate exactly 5 sentences that mirror the user based on Big Five facet outputs.',
    'Style: Plain language, second-person ("You"), no jargon, balanced praise + risk, deterministic structure.',
    'Inputs: Domain averages (O,C,E,A,N); Facet highs and lows; Conflict pairs; Social traits (Friendliness, Cooperation, Morality).',
    'Rules:',
    '1) Strength Anchor: Use strongest high facet(s). Format: "You rely on [high facet] and [high facet], which makes you quick to [behavior]."',
    '2) Risk/Friction: Use sharpest lows or strongest negative domain. Format: "But your [low facet] and [low facet] often [risk behavior], especially when [trigger]."',
    '3) Domain Identity Pattern: Contrast two domains. Format: "You show a mix of [domain] and [domain], which makes you [contrast]."',
    '4) Social Mirror: How others experience them. Format: "Others tend to see you as [high social trait], but they may also notice [low social drawback]."',
    '5) Bridge to Results: Always end with a forward path. Format: "The 30 cards below break this into detail and show where you can reinforce or rebalance."',
    'Constraints: Always 5 sentences. No use of terms like "facet" or "domain" or psychometric jargon. Must mention at least 1 strength and 1 risk. Include a "how others see you" line. Include a bridge line to results. Deterministic: same inputs -> same output.',
    'Output: Return ONLY JSON as { "lines": ["...", "...", "...", "...", "..."] } with exactly 5 strings.'
  ].join(' ');

  // User payload = domains + facets
  const userPayload = {
    domains: { O: O_lvl, C: C_lvl, E: E_lvl, A: A_lvl, S: S_lvl },
    facets: facetsPayload,
  };

  const raw = await callLLM({ system: systemPrompt, user: JSON.stringify(userPayload), temperature: 0 });

  // Try to parse into { lines: string[] }
  let parsedAny: any = null;
  try {
    parsedAny = JSON.parse(raw);
  } catch {
    // If it's plain text, split into sentences and wrap
    const candidates = raw
      .split(/\r?\n|(?<=[.!?])\s+/)
      .map(s=> s.trim())
      .filter(Boolean)
      .slice(0, 5);
    parsedAny = { lines: candidates };
  }

  // Some models return top-level array
  if (Array.isArray(parsedAny)) {
    parsedAny = { lines: parsedAny };
  }

  // Normalize: trim, collapse spaces, enforce exactly 5 lines and formats
  if (parsedAny && Array.isArray(parsedAny.lines)) {
    parsedAny.lines = parsedAny.lines
      .map((s: any) => String(s).replace(/\s+/g, ' ').trim())
      .filter((s: string) => !!s);

    // If not exactly 5, attempt to synthesize deterministic placeholders to reach 5
    if (parsedAny.lines.length > 5) parsedAny.lines = parsedAny.lines.slice(0,5);
    while (parsedAny.lines.length < 5) parsedAny.lines.push('The 30 cards below break this into detail and show where you can reinforce or rebalance.');
  }

  const validated = ProfileSchema.safeParse(parsedAny);
  if (!validated.success) {
    console.error('Schema validation failed:', validated.error, 'Raw:', raw);
    throw new Error('Profile failed schema guard');
  }

  const guarded = enforceGuards(facts, validated.data);
  return guarded;
}
