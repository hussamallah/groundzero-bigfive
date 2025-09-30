import { DOMAINS, canonicalFacets, FACET_INTERPRETATIONS, DomainKey } from "./constants";
import { getFacetScoreLevel, stableStringify } from "./format";
import { sha256 } from "@/lib/crypto/sha256";

export type CardChoice = 'Overwrite' | 'Compatibility' | 'Versus';
export type FacetState = 'High' | 'Medium' | 'Low';

export type WhoDerived = {
  polarity: number;
  stabilityMean: number;            // Stability = 6 - Neuroticism mean
  stabilityFlag: boolean;           // Stability >= 3.5 or <= 2.5
  lowestDomainMean: number;         // raw min across O,C,E,A,N (kept for transparency)
  lowsCount: number;                // raw Low count (N-Low counted as Low for telemetry)
  domainMeans: Record<DomainKey, number>;
};

export type WhoAudit = {
  checksum: string;                 // sha256 of canonical payload and rule version
  ruleVersion: string;
};

export type WhoExport = {
  version: string;
  runId: string | null;
  states: Record<DomainKey, Record<string, FacetState>>;
  raw: Record<DomainKey, Record<string, number>>; // 1-5
  derived: WhoDerived;
  chosen: { card: CardChoice; reasons: string[] };
  narrative: string[];              // 6-10 sentences
  lists?: { strengths: string[]; risks: string[]; mediums: string[] };
  listSentences?: { strengths: string[]; risks: string[]; mediums: string[] };
  audit: WhoAudit;
};

export const WHO_ENGINE_VERSION = "who-engine-0.1.0" as const;
export const WHO_RULE_VERSION  = "who-rule-0.1.0"  as const;

const DOMAIN_TIE_ORDER: DomainKey[] = ['O', 'C', 'E', 'A', 'N']; // S ~ N (Stability = 6 - N)

/* ---------- helpers ---------- */

function mapBucketFromRaw(raw: number): FacetState {
  const lvl = getFacetScoreLevel(raw);
  if (lvl === 'high') return 'High';
  if (lvl === 'low')  return 'Low';
  return 'Medium';
}

function safeFirstNSentences(text: string, n: number): string {
  const parts = (text || '').split(/(?<=\.)\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts.slice(0, Math.max(1, Math.min(n, parts.length))).join(' ');
}

function computeDomainMeans(rawByDomain: Record<DomainKey, Record<string, number>>): Record<DomainKey, number> {
  const means: Record<DomainKey, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  for (const d of DOMAIN_TIE_ORDER) {
    const vals = canonicalFacets(d).map(f => rawByDomain[d][f]);
    const mean = vals.reduce((a,b)=> a + (b||0), 0) / vals.length;
    means[d] = Number.isFinite(mean) ? mean : 0;
  }
  return means;
}

function rankAllFacets(
  rawByDomain: Record<DomainKey, Record<string, number>>
): Array<{domain: DomainKey; facet: string; raw: number; distance: number}> {
  const all: Array<{domain: DomainKey; facet: string; raw: number; distance: number}> = [];
  for (const d of DOMAIN_TIE_ORDER) {
    for (const f of canonicalFacets(d)) {
      const raw = rawByDomain[d][f];
      const distance = Math.abs((raw || 0) - 3.0);
      all.push({ domain: d, facet: f, raw, distance });
    }
  }
  return all.sort((a,b)=>{
    if (b.distance !== a.distance) return b.distance - a.distance;
    if (a.domain !== b.domain)     return DOMAIN_TIE_ORDER.indexOf(a.domain) - DOMAIN_TIE_ORDER.indexOf(b.domain);
    const facA = canonicalFacets(a.domain);
    return facA.indexOf(a.facet) - facA.indexOf(b.facet);
  });
}

// raw Low counter (telemetry only)
function countLows(states: Record<DomainKey, Record<string, FacetState>>): number {
  let c = 0;
  for (const d of DOMAIN_TIE_ORDER) {
    for (const f of canonicalFacets(d)) if (states[d][f] === 'Low') c++;
  }
  return c;
}

// effective Low count for decisions (invert N: N-High counts as "low-risk")
function countEffectiveLows(states: Record<DomainKey, Record<string, FacetState>>): number {
  let c = 0;
  for (const d of ['O','C','E','A'] as DomainKey[]) {
    for (const f of canonicalFacets(d)) if (states[d][f] === 'Low') c++;
  }
  for (const f of canonicalFacets('N')) if (states.N[f] === 'High') c++;
  return c;
}

// labeling for strengths/risks/mediums lists
function labelForList(domain: DomainKey, facet: string, state: FacetState): string {
  const tag = DOMAINS[domain].label.split(' ')[0]; // "Openness", "Conscientiousness", ...
  if (domain === 'N') {
    if (state === 'Low')  return `low ${facet.toLowerCase()} (Neuroticism)`;
    if (state === 'High') return `high ${facet.toLowerCase()} (Neuroticism)`;
    return `${facet.toLowerCase()} (Neuroticism)`;
  }
  return `${facet.toLowerCase()} (${tag})`;
}

/* ---------- card picker ---------- */

function pickCard(
  derived: WhoDerived,
  states: Record<DomainKey, Record<string, FacetState>>
): { card: CardChoice; reasons: string[] } {
  const reasons: string[] = [];

  const lowsEffective = countEffectiveLows(states);
  const stabilityAsS   = 6 - derived.domainMeans.N; // convert N→Stability
  const lowestAdjusted = Math.min(
    derived.domainMeans.O, derived.domainMeans.C, derived.domainMeans.E, derived.domainMeans.A, stabilityAsS
  );

  // Rule 1 — Overwrite
  if (lowsEffective >= 8) {
    return { card: 'Overwrite', reasons: ['LOW_COUNT_GE_8_EFFECTIVE'] };
  }
  if (derived.stabilityFlag && lowsEffective >= 4) {
    return { card: 'Overwrite', reasons: ['STABILITY_FLAG_AND_LOW_COUNT_GE_4_EFFECTIVE'] };
  }
  if (derived.polarity >= 1.2 && lowestAdjusted < 2.5) {
    return { card: 'Overwrite', reasons: ['POLARITY_GE_1_2_AND_LOWEST_ADJUSTED_LT_2_5'] };
  }

  // Rule 2 — Compatibility
  const Ehigh = derived.domainMeans.E >= 4.0;
  const Elow  = derived.domainMeans.E <= 2.0;
  const Ahigh = derived.domainMeans.A >= 4.0;
  const Alow  = derived.domainMeans.A <= 2.0;
  if (Ehigh && Alow) return { card: 'Compatibility', reasons: ['SOCIAL_OPPOSITION_E_HIGH_A_LOW'] };
  if (Ahigh && Elow) return { card: 'Compatibility', reasons: ['SOCIAL_OPPOSITION_A_HIGH_E_LOW'] };
  if (derived.polarity <= 0.8) {
    let socialHighs = 0;
    for (const f of canonicalFacets('E')) if (states.E[f] === 'High') socialHighs++;
    for (const f of canonicalFacets('A')) if (states.A[f] === 'High') socialHighs++;
    if (socialHighs >= 4) return { card: 'Compatibility', reasons: ['LOW_POLARITY_WITH_SOCIAL_HIGHS'] };
  }

  // Rule 3 — Versus
  return { card: 'Versus', reasons: ['DEFAULT_VERSUS'] };
}

/* ---------- narrative ---------- */

function buildNarrative(
  states: Record<DomainKey, Record<string, FacetState>>,
  rawByDomain: Record<DomainKey, Record<string, number>>
): string[] {
  const ranked       = rankAllFacets(rawByDomain);
  const domainMeans  = computeDomainMeans(rawByDomain);
  const highestMean  = Math.max(domainMeans.O, domainMeans.C, domainMeans.E, domainMeans.A, domainMeans.N);
  const lowestMean   = Math.min(domainMeans.O, domainMeans.C, domainMeans.E, domainMeans.A, domainMeans.N);
  const polarity     = highestMean - lowestMean;
  const stabilityMean= 6 - domainMeans.N;

  const sentences: string[] = [];

  // Opening synthesis
  if (polarity >= 1.0) {
    sentences.push('You move through life with sharp contrasts. At your best, you bring strong fuel where it counts; at your weak points, you under-invest where structure and patience are needed.');
  } else {
    sentences.push('You move through life with measured balance. You can bring strengths forward without overplaying them, and your softer spots rarely dominate.');
  }
  if (stabilityMean >= 3.5) {
    sentences.push('Under stress you stay composed and steady; pressure rarely knocks you off course.');
  } else if (stabilityMean <= 2.5) {
    sentences.push('Under stress you can feel destabilized; spikes can pull you off your usual rhythm.');
  }
  // No user-facing "Polarity X − Y = Z" sentence (kept in export only)

  // Domain snapshots — brief, behavior-first summaries
  const tag = (d: DomainKey) => DOMAINS[d].label.split(' ')[0];
  const describeDomain = (d: DomainKey, mean: number): string | null => {
    const name = tag(d);
    if (d === 'O') {
      if (mean >= 4.0) return `Your ${name} is pronounced; you actively seek novelty, ideas, and change.`;
      if (mean <= 2.0) return `Your ${name} is modest; you prefer proven methods and concrete, workable plans.`;
      return `Your ${name} is balanced; you mix fresh thinking with practical judgment.`;
    }
    if (d === 'C') {
      if (mean >= 4.0) return `Your ${name} is strong; structure, follow-through, and reliability are central to how you operate.`;
      if (mean <= 2.0) return `Your ${name} is light; you move flexibly, dislike tight constraints, and work best with autonomy.`;
      return `Your ${name} is steady; you organize when it matters and keep room for flow.`;
    }
    if (d === 'E') {
      if (mean >= 4.0) return `Your ${name} is high; you draw energy from people, pace, and visible momentum.`;
      if (mean <= 2.0) return `Your ${name} is low; you conserve energy, prefer depth over crowds, and choose focused settings.`;
      return `Your ${name} is moderate; you can engage widely or work quietly as needed.`;
    }
    if (d === 'A') {
      if (mean >= 4.0) return `Your ${name} is high; you lean toward harmony, good faith, and collaborative moves.`;
      if (mean <= 2.0) return `Your ${name} is low; you prioritize candor and self-direction over smoothing edges.`;
      return `Your ${name} is balanced; you can cooperate without losing your stance.`;
    }
    // Neuroticism
    if (mean >= 4.0) return `Your ${name} runs high; feelings arrive fast and strong, and stress can bite quickly.`;
    if (mean <= 2.0) return `Your ${name} runs low; you keep an even keel and recover quickly under pressure.`;
    return `Your ${name} is mid-range; emotions register, but rarely take the wheel.`;
  };
  for (const d of ['O','C','E','A','N'] as DomainKey[]) {
    const line = describeDomain(d, domainMeans[d]);
    if (line) sentences.push(line);
  }

  // Interpersonal style (E × A)
  const Ehigh = domainMeans.E >= 4.0, Elow = domainMeans.E <= 2.0;
  const Ahigh = domainMeans.A >= 4.0, Alow = domainMeans.A <= 2.0;
  if (Ehigh && Ahigh) sentences.push('Interpersonally you come across as warm and energizing—quick to include, quick to encourage.');
  else if (Ehigh && Alow) sentences.push('Interpersonally you read as forceful and independent—comfortable taking the mic and stating hard truths.');
  else if (Elow && Ahigh) sentences.push('Interpersonally you are calm and considerate—selective with attention, easy to be around.');
  else if (Elow && Alow) sentences.push('Interpersonally you favor autonomy and directness—reserved, self-contained, and succinct.');
  else sentences.push('Interpersonally you adapt—able to be visible when needed and quieter when depth matters.');

  // Work style (C facets)
  const cHigh = (f: string) => states.C[f] === 'High';
  const cLow  = (f: string) => states.C[f] === 'Low';
  if (cHigh('Self-Discipline') || cHigh('Orderliness') || domainMeans.C >= 3.8) {
    const risk = cHigh('Cautiousness') ? 'and you weigh risks carefully' : 'and you move once essentials are set';
    sentences.push(`At work you build dependable systems, maintain pace through friction, ${risk}.`);
  } else if (cLow('Orderliness') || domainMeans.C <= 2.2) {
    const plus = cHigh('Achievement-Striving') ? 'You still push when goals excite you' : 'You protect room for spontaneity';
    sentences.push(`At work you avoid rigid structure, preferring flexible lanes and just-in-time organization. ${plus}.`);
  } else {
    sentences.push('At work you balance plans with motion—enough structure to finish, enough flexibility to iterate.');
  }

  // Decision-making (O:Intellect/Liberalism × C:Cautiousness)
  const oIntHigh = states.O['Intellect'] === 'High';
  const oLibHigh = states.O['Liberalism'] === 'High';
  const cCautHigh= states.C['Cautiousness'] === 'High';
  if (oIntHigh && cCautHigh) sentences.push('In decisions you analyze models and downside, then commit with clear boundaries.');
  else if (oIntHigh && !cCautHigh) sentences.push('In decisions you reason quickly from principles and run fast experiments.');
  else if (oLibHigh && cCautHigh) sentences.push('In decisions you challenge defaults, but proceed deliberately with safeguards.');
  else if (oLibHigh) sentences.push('In decisions you question conventions and open new options others miss.');
  else if (cCautHigh) sentences.push('In decisions you prefer measured steps, factoring risk and second-order effects.');

  // Stress pattern (N facets)
  const nHigh = (f: string) => states.N[f] === 'High';
  const stressBits: string[] = [];
  if (nHigh('Anxiety')) stressBits.push('worry signals fire early');
  if (nHigh('Anger')) stressBits.push('frustration spikes at blockers');
  if (nHigh('Vulnerability')) stressBits.push('overload can freeze progress');
  if (nHigh('Depression')) stressBits.push('mood can dip and dim drive');
  if (nHigh('Self-Consciousness')) stressBits.push('self-judgment gets loud');
  if (nHigh('Immoderation')) stressBits.push('quick relief can tempt');
  if (stressBits.length) {
    sentences.push(`Under strain ${stressBits.slice(0,3).join(', ')}.`);
  }

  // Top 3 facets → up to 6 sentences total (2 max per facet template)
  const top = ranked.slice(0, 3);
  for (const item of top) {
    const levelKey = states[item.domain][item.facet].toLowerCase() as 'high'|'medium'|'low';
    const interp = (FACET_INTERPRETATIONS as any)[item.domain][item.facet][levelKey] as string;
    sentences.push(safeFirstNSentences(interp, 2));
  }

  // Strengths = High in O/C/E/A + Low in N
  const strengths = ranked
    .filter(r => (r.domain !== 'N' && states[r.domain][r.facet] === 'High') || (r.domain === 'N' && states[r.domain][r.facet] === 'Low'))
    .map(r => labelForList(r.domain, r.facet, states[r.domain][r.facet]));

  // Risks = Low in O/C/E/A + High in N
  const risks = ranked
    .filter(r => (r.domain !== 'N' && states[r.domain][r.facet] === 'Low') || (r.domain === 'N' && states[r.domain][r.facet] === 'High'))
    .map(r => labelForList(r.domain, r.facet, states[r.domain][r.facet]));

  // Mediums (neutral list; N not inverted here)
  const mediums = ranked
    .filter(r => states[r.domain][r.facet] === 'Medium')
    .map(r => labelForList(r.domain, r.facet, 'Medium'));

  // Build descriptive strengths clause using facet templates (top 3)
  function toClause(text: string): string {
    let t = safeFirstNSentences(text, 1).trim();
    if (t.startsWith('You ')) t = t.slice(4);
    if (t.endsWith('.')) t = t.slice(0, -1);
    if (t.length && t[0] === t[0].toUpperCase()) t = t[0].toLowerCase() + t.slice(1);
    return t;
  }
  const strengthItems = ranked.filter(r => (r.domain !== 'N' && states[r.domain][r.facet] === 'High') || (r.domain === 'N' && states[r.domain][r.facet] === 'Low'));
  const topStrengths = strengthItems.slice(0, 3).map(item => {
    const levelKey = (item.domain === 'N' ? 'low' : 'high') as 'high'|'low';
    const interp = (FACET_INTERPRETATIONS as any)[item.domain][item.facet][levelKey] as string;
    return toClause(interp);
  });

  // Do not emit headings in narrative; lists are rendered separately in UI

  // Attach lists to payload via return (set later)

  return sentences.slice(0, 14);
}

/* ---------- main ---------- */

export async function buildWhoFromFullResults(
  fullResults: Array<{domain: DomainKey; payload: any}>,
  suiteHash: string | null
): Promise<WhoExport> {
  // Extract raw per-facet and final buckets
  const rawByDomain: Record<DomainKey, Record<string, number>>   = { O: {}, C: {}, E: {}, A: {}, N: {} } as any;
  const states:      Record<DomainKey, Record<string, FacetState>>= { O: {}, C: {}, E: {}, A: {}, N: {} } as any;

  for (const d of DOMAIN_TIE_ORDER) {
    const r = fullResults.find(x => x.domain === d);
    const facets = canonicalFacets(d);
    for (const f of facets) {
      const raw = r?.payload?.phase2?.A_raw?.[f];
      rawByDomain[d][f] = typeof raw === 'number' ? raw : 3.0;

      // Prefer provided final bucket if present
      const bucket = r?.payload?.final?.bucket?.[f];
      states[d][f] = (bucket === 'High' || bucket === 'Medium' || bucket === 'Low')
        ? bucket
        : mapBucketFromRaw(rawByDomain[d][f]);
    }
  }

  const domainMeans       = computeDomainMeans(rawByDomain);
  const highestMean       = Math.max(domainMeans.O, domainMeans.C, domainMeans.E, domainMeans.A, domainMeans.N);
  const lowestMean        = Math.min(domainMeans.O, domainMeans.C, domainMeans.E, domainMeans.A, domainMeans.N);
  const polarity          = highestMean - lowestMean;
  const stabilityMean     = 6 - domainMeans.N;
  const stabilityFlag     = stabilityMean >= 3.5 || stabilityMean <= 2.5;
  const lowestDomainMean  = lowestMean;         // raw min across O,C,E,A,N (export only)
  const lowsCount         = countLows(states);  // raw low count (export only)

  const derived: WhoDerived = { polarity, stabilityMean, stabilityFlag, lowestDomainMean, lowsCount, domainMeans };
  const chosen   = pickCard(derived, states);
  const narrative= buildNarrative(states, rawByDomain);

  // Build lists for UI rendering (headline + bullet list)
  const rankedAll = rankAllFacets(rawByDomain);
  // Strengths: cap Conscientiousness levers to 3–4 core items; prefer Self-Efficacy, Orderliness, Self-Discipline, Cautiousness
  const strengthsRaw = rankedAll
    .filter(r => (r.domain !== 'N' && states[r.domain][r.facet] === 'High') || (r.domain === 'N' && states[r.domain][r.facet] === 'Low'));
  const cPreferred = ['Self-Efficacy','Orderliness','Self-Discipline','Cautiousness'];
  const cPicked: any[] = [];
  for (const name of cPreferred){
    const hit = strengthsRaw.find(r => r.domain==='C' && r.facet===name);
    if (hit) cPicked.push(hit);
    if (cPicked.length>=4) break;
  }
  const nonC = strengthsRaw.filter(r => r.domain!=='C');
  const remainderC = strengthsRaw.filter(r => r.domain==='C' && !cPicked.includes(r));
  const cappedC = cPicked.length ? cPicked : remainderC.slice(0,3);
  const strengthsOrdered = nonC.concat(cappedC);
  const listStrengths = strengthsOrdered.map(r => labelForList(r.domain, r.facet, states[r.domain][r.facet]));
  // Risks: block contradictions when N is mixed (~3.0). If domainMeans.N between 2.7–3.3, avoid mixing low and high N items simultaneously.
  const listRisks = rankedAll
    .filter(r => {
      const isN = r.domain === 'N';
      const isLowN = isN && states[r.domain][r.facet] === 'Low';
      const isHighN = isN && states[r.domain][r.facet] === 'High';
      const neutralN = domainMeans.N >= 2.7 && domainMeans.N <= 3.3;
      if (neutralN && isLowN) return false; // don't list N-low when overall N is mid if N-high risks exist
      return (r.domain !== 'N' && states[r.domain][r.facet] === 'Low') || isHighN;
    })
    .map(r => labelForList(r.domain, r.facet, states[r.domain][r.facet]));
  const listMediums = rankedAll
    .filter(r => states[r.domain][r.facet] === 'Medium')
    .map(r => labelForList(r.domain, r.facet, 'Medium'));

  // Convert lists into user-readable single sentences (12–16 words) while avoiding awkward cutoffs
  function facetToSentence(domain: DomainKey, facet: string, state: FacetState): string {
    const lvl: 'high'|'medium'|'low' = (state === 'High' ? 'high' : state === 'Low' ? 'low' : 'medium');
    const interp = (FACET_INTERPRETATIONS as any)[domain]?.[facet]?.[lvl] as string | undefined;
    if (!interp) return labelForList(domain, facet, state);

    // Use only the first sentence as the base for readability
    let base = safeFirstNSentences(interp, 1).trim();
    base = base.replace(/[\u2014\u2013]/g, '—').replace(/\s+/g, ' ').trim();

    const words = base.split(/\s+/).filter(Boolean);
    const maxWords = 16;
    const minWords = 12;
    let take = words.length;
    if (take > maxWords) take = maxWords;
    // If very short, keep as-is; otherwise, trim to target window
    if (take < minWords && words.length >= minWords) take = minWords;

    let chosen = words.slice(0, take);
    // Avoid ending on conjunctions/prepositions
    const badEnd = new Set(['and','or','but','for','to','of','in','on','at','by','with','from','as','than','that','which','because','so','if','while','when','although']);
    while (chosen.length > 0 && badEnd.has(chosen[chosen.length - 1].toLowerCase())) {
      chosen.pop();
    }
    let sentence = chosen.join(' ');
    // Ensure starts capitalized
    if (sentence.length) sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    // Address the reader explicitly
    if (!/^You\b/.test(sentence)) {
      // lower-case first letter then prefix "You "
      if (sentence.length) sentence = sentence.charAt(0).toLowerCase() + sentence.slice(1);
      sentence = 'You ' + sentence;
      // Re-capitalize the very first Y already uppercased; keep rest as-is
    }
    // Ensure terminal punctuation
    if (!/[.!?]$/.test(sentence)) sentence += '.';
    return sentence;
  }
  const sentenceStrengths = rankedAll
    .filter(r => (r.domain !== 'N' && states[r.domain][r.facet] === 'High') || (r.domain === 'N' && states[r.domain][r.facet] === 'Low'))
    .map(r => facetToSentence(r.domain, r.facet, states[r.domain][r.facet]));
  const sentenceRisks = rankedAll
    .filter(r => (r.domain !== 'N' && states[r.domain][r.facet] === 'Low') || (r.domain === 'N' && states[r.domain][r.facet] === 'High'))
    .map(r => facetToSentence(r.domain, r.facet, states[r.domain][r.facet]));
  const sentenceMediums = rankedAll
    .filter(r => states[r.domain][r.facet] === 'Medium')
    .map(r => facetToSentence(r.domain, r.facet, 'Medium'));

  const base: WhoExport = {
    version: WHO_ENGINE_VERSION,
    runId: suiteHash || null,
    states,
    raw: rawByDomain,
    derived,
    chosen,
    narrative,
    lists: { strengths: listStrengths, risks: listRisks, mediums: listMediums },
    listSentences: { strengths: sentenceStrengths, risks: sentenceRisks, mediums: sentenceMediums },
    audit: { checksum: '', ruleVersion: WHO_RULE_VERSION }
  };

  // checksum over canonical JSON (without checksum field)
  const checksum = await sha256(stableStringify({
    version: base.version,
    runId:   base.runId,
    states:  base.states,
    raw:     base.raw,
    derived: base.derived,
    chosen:  base.chosen,
    narrative: base.narrative,
    ruleVersion: WHO_RULE_VERSION
  }));
  base.audit.checksum = checksum;

  return base;
}
