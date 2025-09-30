import { canonicalFacets, DomainKey } from "./constants";

export type Phase1 = {
  p: Record<string, number>;
  m: Record<string, number>;
  t: Record<string, number>;
  P: Record<string, number>;
};

export function computeNet(p: Record<string,number>, m: Record<string,number>, facets: string[]): Record<string, number> {
  return Object.fromEntries(facets.map(f => [f, (p[f]||0) - (m[f]||0)]));
}

export function computeAmbiguity(p: Record<string,number>, m: Record<string,number>, facets: string[]): Record<string, number> {
  const S = Object.fromEntries(facets.map(f => [f, 2*(p[f]||0) - 2*(m[f]||0)]));
  const AmbScore = Object.fromEntries(facets.map(f => {
    let amb = 2 - Math.abs(S[f] as number);
    if ((p[f]||0)===0) amb += 0.5;
    if ((m[f]||0)===1) amb += 0.5;
    return [f, amb];
  }));
  return AmbScore as Record<string, number>;
}

export function shortlistResolver(p: Record<string,number>, m: Record<string,number>, domain: DomainKey): string[] {
  const facets = canonicalFacets(domain);
  const AmbScore = computeAmbiguity(p, m, facets);
  let shortlist: string[] = [];
  shortlist = shortlist.concat(facets.filter(f=> (p[f]||0)===1 && (m[f]||0)===1));
  shortlist = shortlist.concat(facets.filter(f=> (p[f]||0)===0 && (m[f]||0)===0));
  const remaining = facets.filter(f=>!shortlist.includes(f))
    .sort((a,b)=> (AmbScore[b]-AmbScore[a]) || facets.indexOf(a)-facets.indexOf(b));
  shortlist = Array.from(new Set(shortlist.concat(remaining)));
  if (shortlist.length > 4) shortlist = shortlist.slice(0,4);
  if (shortlist.length < 2){
    for (const f of facets){
      if (!shortlist.includes(f)) shortlist.push(f);
      if (shortlist.length >= 2) break;
    }
  }
  return shortlist;
}

export function computePrior(p: Record<string,number>, t: Record<string,number>, m: Record<string,number>, facets: string[]): Record<string, number> {
  return Object.fromEntries(facets.map(f => [f, 2*(p[f]||0) + 1*(t[f]||0) - 2*(m[f]||0)]));
}

export function anchorsBudget(P: Record<string,number>, facets: string[]): Record<string, number> {
  return Object.fromEntries(facets.map(f => [f, (P[f] >= 2 || P[f] <= -2) ? 1 : 2]));
}

export function triggersForConfirmers(A_raw: Record<string, number>, P: Record<string, number>, domain: DomainKey): string[] {
  const facets = canonicalFacets(domain);
  return facets.filter(f => {
    const a = A_raw[f];
    const p = P[f];
    if (a > 3.50 && a < 4.00 && p <= 0) return true;
    if (a > 2.00 && a < 2.50 && p >= 0) return true;
    return false;
  });
}

export function baseBucket(raw: number, prior: number): 'High'|'Medium'|'Low' {
  if (raw >= 4.00) return 'High';
  if (raw <= 2.00) return 'Low';
  if (raw > 2.75 && raw < 3.25) return 'Medium';
  if (raw >= 3.75 && raw < 4.00 && prior >= 1) return 'High';
  if (raw > 2.00 && raw <= 2.25 && prior <= -1) return 'Low';
  return 'Medium';
}

export function applyConfirmersBucket(bucket: Record<string,'High'|'Medium'|'Low'>, A_raw: Record<string, number>, P: Record<string, number>, asked: Array<{facet:string; answer:'Yes'|'No'|'Maybe'}>): Record<string,'High'|'Medium'|'Low'> {
  const out = { ...bucket };
  for (const {facet: f, answer} of asked){
    const a = A_raw[f];
    const prior = P[f];
    if (a > 3.50 && a < 4.00 && prior <= 0){
      if (answer === 'Yes') out[f] = 'High';
      else if (answer === 'No') out[f] = 'Medium';
    } else if (a > 2.00 && a < 2.50 && prior >= 0){
      if (answer === 'No') out[f] = 'Low';
      else if (answer === 'Yes') out[f] = 'Medium';
    }
  }
  return out;
}

export function orderFacets(facets: string[], bucket: Record<string,'High'|'Medium'|'Low'>, A_raw: Record<string, number>, P: Record<string, number>): string[] {
  const rank = { High: 3, Medium: 2, Low: 1 } as const;
  return facets.slice().sort((a,b)=>{
    if (rank[bucket[a]] !== rank[bucket[b]]) return rank[bucket[a]] - rank[bucket[b]];
    if (A_raw[b] !== A_raw[a]) return A_raw[b] - A_raw[a];
    if (P[b] !== P[a]) return P[b] - P[a];
    return facets.indexOf(a) - facets.indexOf(b);
  });
}


