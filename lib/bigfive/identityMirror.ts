import type { DomainKey } from "./constants";
import { computeSignals, DomainMeans } from "./signals";

export interface FacetData {
  domain: DomainKey;
  facet: string;
  raw: number;
  bucket: 'High' | 'Medium' | 'Low';
}

export interface IdentityMirrorInput {
  domainMeans: DomainMeans;
  facets: FacetData[];
  conflicts: Array<{ left: string; right: string; id: number }>;
}

// Copy tokens per spec (O)
const BRIDGE = "The 30 cards below break this into detail and show where to reinforce or rebalance.";

// Negative facets (treat highs as risks)
const NEG = new Set(['Anxiety','Anger','Depression','Vulnerability','Immoderation']);
const z = (x:number)=> Math.max(0, Math.min(1, (x-1)/4));

type Facet = FacetData;

const strengthScore = (f:Facet)=> NEG.has(f.facet) ? (1 - z(f.raw)) : z(f.raw);
const riskScore     = (f:Facet)=> NEG.has(f.facet) ? z(f.raw) : (1 - z(f.raw)); // low positives only

function pickStrengths(facets:Facet[], k=2){
  const top = [...facets].sort((a,b)=> strengthScore(b)-strengthScore(a));
  const out = top.slice(0,k).map(f=> f.facet.toLowerCase());
  while (out.length<2) out.push('follow-through');
  return out.slice(0,2);
}

function pickRisks(facets:Facet[], k=2){
  const ranked = [...facets].sort((a,b)=> riskScore(b)-riskScore(a));
  const safe = ranked.filter(f=> NEG.has(f.facet) || z(f.raw) <= 0.4); // filter out high positives
  const out = safe.slice(0,k).map(f=> f.facet.toLowerCase());
  while (out.length<2) out.push('inconsistency');
  return out.slice(0,2);
}

function tiltLabel(m:{O:number;C:number;E:number;A:number;N:number}){
  const O=z(m.O), C=z(m.C), E=z(m.E), N=z(m.N);
  if (E>=0.6 && C>=0.6) return 'high drive with careful control';
  if (C>=0.6 && O<=0.4) return 'structure and security';
  if (O>=0.6 && C<=0.4) return 'imagination over routine';
  if (E>=0.6 && N>=0.6) return 'drive with volatility';
  return 'balanced preferences';
}

export function buildIdentityMirror(input: IdentityMirrorInput, runHash: string): string[] {
  const { domainMeans, facets } = input;

  // L1 — two strengths
  const [s1, s2] = pickStrengths(facets);
  const L1 = `You rely on ${s1} and ${s2}, which makes you quick to move when the path is clear.`;

  // L2 — two risks, only negatives or low positives
  const [r1, r2] = pickRisks(facets);
  const L2 = `But your ${r1} and ${r2} can drain momentum, especially under pressure.`;

  // L3 — tilt sentence with fixed phrasing
  const L3 = `You tilt toward ${tiltLabel(domainMeans)}, which shapes how you start and finish work.`;

  // L4 — fixed social mirror line to prevent drift
  const L4 = `Others tend to see you as confident and expressive, but they may notice sharp edges when cooperation is required.`;

  // L5 — locked bridge
  const L5 = BRIDGE;

  return [L1, L2, L3, L4, L5];
}
