"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { VERSION, DOMAINS, FACET_HINTS, ANCHORS, P1_PROMPTS, DOMAIN_DESCRIPTIONS, canonicalFacets, FACET_DESCRIPTIONS, FACET_INTERPRETATIONS, CONFIRM } from "@/lib/bigfive/constants";
import { stableStringify, toPercentFromRaw, getScoreLevel, getFacetScoreLevel } from "@/lib/bigfive/format";
import { anchorsBudget, applyConfirmersBucket, baseBucket, computePrior, shortlistResolver, triggersForConfirmers } from "@/lib/bigfive/logic";
import { sha256 } from "@/lib/crypto/sha256";

type DomainKey = keyof typeof DOMAINS;

function FacetChip({ domain, facet, selected, onToggle, tags = [] }: { domain: DomainKey; facet: string; selected: boolean; onToggle: () => void; tags?: string[] }){
  const hint = (FACET_HINTS as any)[domain]?.[facet] ?? "";
  return (
    <button className={`btn-chip${selected ? ' selected' : ''}`} title={hint} onClick={onToggle}>
      <b>{facet}</b>
      <small>{hint}</small>
      {tags.length ? (
        <div className="tags">{tags.map((t,i)=>(<span key={i} className="tag">{t}</span>))}</div>
      ) : null}
    </button>
  );
}

export default function Assessment({ initialDomain, silentOnComplete, onComplete }: { initialDomain?: DomainKey; silentOnComplete?: boolean; onComplete?: (payload:any)=>void }){
  const [nonce, setNonce] = useState<string | null>(null);
  const [domain, setDomain] = useState<DomainKey | null>(initialDomain ?? null);
  const [verifyStatus, setVerifyStatus] = useState<'idle'|'ok'|'fail'>('idle');

  const [picksP, setPicksP] = useState<Record<string, number> | null>(null);
  const [picksM, setPicksM] = useState<Record<string, number> | null>(null);
  const [picksT, setPicksT] = useState<Record<string, number> | null>(null);
  const [priorP, setPriorP] = useState<Record<string, number> | null>(null);

  const [phase2Answers, setPhase2Answers] = useState<Array<{facet:string; idx:number; value:number}>>([]);
  const [A_raw, setAraw] = useState<Record<string, number> | null>(null);

  const [phase3Asked, setPhase3Asked] = useState<Array<{facet:string; answer:'Yes'|'No'|'Maybe'}>>([]);

  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [hover, setHover] = useState<Record<string, boolean>>({});
  const [selectedCount, setSelectedCount] = useState<number>(0);

  const facets = useMemo(()=> domain ? canonicalFacets(domain) : [], [domain]);

  // Auto-expand top 2 facets when results are available
  useEffect(() => {
    if (A_raw && Object.keys(open).length === 0) {
      const order = facets.slice().sort((a,b)=>{
        const rank = { High: 3, Medium: 2, Low: 1 } as const;
        const bucket = Object.fromEntries(facets.map(f=> [f, baseBucket((A_raw as any)[f], (priorP as any)[f])])) as Record<string,'High'|'Medium'|'Low'>;
        const finalBucket = applyConfirmersBucket(bucket, A_raw, priorP, phase3Asked);
        if (rank[finalBucket[a]] !== rank[finalBucket[b]]) return rank[finalBucket[a]] - rank[finalBucket[b]];
        if ((A_raw as any)[b] !== (A_raw as any)[a]) return (A_raw as any)[b] - (A_raw as any)[a];
        if ((priorP as any)[b] !== (priorP as any)[a]) return (priorP as any)[b] - (priorP as any)[a];
        return facets.indexOf(a) - facets.indexOf(b);
      });
      const top2 = order.slice(0, 2);
      const initialOpen: Record<string, boolean> = {};
      top2.forEach(f => {
        initialOpen[f] = true;
      });
      setOpen(initialOpen);
    }
  }, [A_raw, priorP, phase3Asked, facets, open]);

  function reset(){
    setPicksP(null); setPicksM(null); setPicksT(null); setPriorP(null);
    setPhase2Answers([]); setAraw(null); setPhase3Asked([]);
    setOpen({});
    setHover({});
    setSelectedCount(0);
  }

  // initialDomain is handled in initial state; remounting with a new key will reset

  // Q2 is interactive: user drops 2 out of the 3 selected in Q1

  // Compute audit hash only when final data is available; keep hook order stable
  useEffect(()=>{
    if (!domain || !picksP || !picksM || !picksT || !priorP || !A_raw) return;
    const f = canonicalFacets(domain);
    const A_pct: Record<string,number> = Object.fromEntries(f.map(ff=> [ff, toPercentFromRaw((A_raw as any)[ff])])) as any;
    const initialBucket = Object.fromEntries(f.map(ff=> [ff, baseBucket((A_raw as any)[ff], (priorP as any)[ff])])) as Record<string,'High'|'Medium'|'Low'>;
    const bucket = applyConfirmersBucket(initialBucket, A_raw, priorP, phase3Asked);
    const order = f.slice().sort((a,b)=>{
      const rank = { High: 3, Medium: 2, Low: 1 } as const;
      if (rank[bucket[a]] !== rank[bucket[b]]) return rank[bucket[a]] - rank[bucket[b]];
      if ((A_raw as any)[b] !== (A_raw as any)[a]) return (A_raw as any)[b] - (A_raw as any)[a];
      if ((priorP as any)[b] !== (priorP as any)[a]) return (priorP as any)[b] - (priorP as any)[a];
      return f.indexOf(a) - f.indexOf(b);
    });
    const domain_mean_raw = Math.round((f.reduce((s,ff)=>s+(A_raw as any)[ff],0)/6)*100)/100;
    const domain_mean_pct = Math.round((toPercentFromRaw(domain_mean_raw))*10)/10;
    const payload = {
      version: VERSION,
      domain,
      phase1: { p: picksP, m: picksM, t: picksT, P: priorP },
      phase2: { answers: phase2Answers, A_raw },
      phase3: { asked: phase3Asked },
      final: { A_pct, bucket, order, domain_mean_raw, domain_mean_pct }
    };
    setNonce(null);
    sha256(stableStringify(payload)).then(setNonce);
    setVerifyStatus('idle');
  }, [domain, picksP, picksM, picksT, priorP, phase2Answers, A_raw, phase3Asked]);

  // Prepare result payload for full test flow
  const resultPayload = useMemo(()=>{
    if (!domain || !picksP || !picksM || !picksT || !priorP || !A_raw) return null;
    const f = canonicalFacets(domain);
    const A_pct: Record<string,number> = Object.fromEntries(f.map(ff=> [ff, toPercentFromRaw((A_raw as any)[ff])])) as any;
    const initialBucket = Object.fromEntries(f.map(ff=> [ff, baseBucket((A_raw as any)[ff], (priorP as any)[ff])])) as Record<string,'High'|'Medium'|'Low'>;
    const bucket = applyConfirmersBucket(initialBucket, A_raw, priorP, phase3Asked);
    const order = f.slice().sort((a,b)=>{
      const rank = { High: 3, Medium: 2, Low: 1 } as const;
      if (rank[bucket[a]] !== rank[bucket[b]]) return rank[bucket[a]] - rank[bucket[b]];
      if ((A_raw as any)[b] !== (A_raw as any)[a]) return (A_raw as any)[b] - (A_raw as any)[a];
      if ((priorP as any)[b] !== (priorP as any)[a]) return (priorP as any)[b] - (priorP as any)[a];
      return f.indexOf(a) - f.indexOf(b);
    });
    const domain_mean_raw = Math.round((f.reduce((s,ff)=>s+(A_raw as any)[ff],0)/6)*100)/100;
    const domain_mean_pct = Math.round((toPercentFromRaw(domain_mean_raw))*10)/10;
    return {
      version: VERSION,
      domain,
      phase1: { p: picksP, m: picksM, t: picksT, P: priorP },
      phase2: { answers: phase2Answers, A_raw },
      phase3: { asked: phase3Asked },
      final: { A_pct, bucket, order, domain_mean_raw, domain_mean_pct },
      audit: { nonce }
    };
  }, [domain, picksP, picksM, picksT, priorP, phase2Answers, A_raw, phase3Asked, nonce]);

  const emittedRef = useRef(false);
  useEffect(()=>{
    if (silentOnComplete && onComplete && resultPayload && (resultPayload as any).audit?.nonce && !emittedRef.current){
      emittedRef.current = true;
      onComplete(resultPayload);
    }
  }, [silentOnComplete, onComplete, resultPayload]);

  // Persist per-domain payload by hash for later retrieval
  useEffect(()=>{
    const rp:any = resultPayload as any;
    const hash = rp?.audit?.nonce;
    if (!hash || !rp) return;
    try{
      const raw = localStorage.getItem('gz_domain_results');
      const db = raw ? JSON.parse(raw) : {};
      if (!db[hash]){
        db[hash] = rp;
        localStorage.setItem('gz_domain_results', JSON.stringify(db));
      }
    } catch {}
  }, [resultPayload]);

  // UI steps
  if (!domain){
    return (
      <div className="card">
        <div className="row-nowrap" style={{justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h2>Select domain</h2>
            <p className="muted">Run the flow for one domain at a time. O, C, E, A, or N.</p>
          </div>
          <div><span className="pill">Deterministic • No RNG</span></div>
        </div>
        <div className="row mt16">
          {(Object.keys(DOMAINS) as DomainKey[]).map(d=> (
            <button key={d} className="domain-btn btn" onClick={()=>{ setDomain(d); reset(); }}>{DOMAINS[d].label}</button>
          ))}
        </div>
      </div>
    );
  }

  if (!picksP){
    return (
      <div className="card">
        <div className="row-nowrap" style={{justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h2>Phase 1 — Q1 (Plus)</h2>
            <p>{P1_PROMPTS[domain].q1}</p>
          </div>
          <div className="count-pill"><span className="count">{`${selectedCount}/3`}</span></div>
        </div>
        <FacetPickGrid key="phase1" domain={domain} facets={facets} required={3} onSubmit={(arr)=>{
          const p = Object.fromEntries(facets.map(f=>[f,0]));
          for (const f of arr) (p as any)[f]=1;
          setPicksP(p as Record<string,number>);
        }} onBack={()=>{ setDomain(null); }} selectedCount={selectedCount} onSelectedCountChange={setSelectedCount}/>
      </div>
    );
  }

  if (!picksM){
    const q1Selected = facets.filter(f => (picksP as any)[f] === 1);
    return (
      <div className="card">
        <div className="row-nowrap" style={{justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h2>Phase 1 — Q2 (Minus)</h2>
            <p>{P1_PROMPTS[domain].q2}</p>
          </div>
          <div className="count-pill"><span className="count">{`${selectedCount}/2`}</span></div>
        </div>
        <FacetPickGrid key="phase2" domain={domain} facets={q1Selected} required={2} onSubmit={(arr)=>{
          const m = Object.fromEntries(facets.map(f=>[f,0]));
          for (const f of arr) (m as any)[f]=1;
          setPicksM(m as Record<string,number>);
        }} onBack={()=>{ setPicksP(null); }} selectedCount={selectedCount} onSelectedCountChange={setSelectedCount}/>
      </div>
    );
  }

  if (!picksT){
    const shortlist = shortlistResolver(picksP, picksM, domain);
    const tagsFor = (f: string) => {
      const tags: string[] = [];
      if ((picksP as any)[f]===1 && (picksM as any)[f]===1) tags.push("Picked & Dropped");
      if ((picksP as any)[f]===0) tags.push("Untouched in Q1");
      if ((picksM as any)[f]===1 && !((picksP as any)[f]===1 && (picksM as any)[f]===1)) tags.push("Dropped in Q2");
      return tags;
    };
    const required = Math.min(2, shortlist.length);
    return (
      <div className="card">
        <div className="row-nowrap" style={{justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h2>Phase 1 — Q3 (Resolver)</h2>
            <p>{P1_PROMPTS[domain].q3}</p>
            <small className="muted">Why these? Picked & Dropped / Untouched.</small>
          </div>
          <div className="count-pill"><span className="count">{`${selectedCount}/${required}`}</span></div>
        </div>
        <FacetPickGrid key={`phase3-${shortlist.join(',')}`} domain={domain} facets={shortlist} required={required} tagsFor={tagsFor} onSubmit={(arr)=>{
          const t = Object.fromEntries(facets.map(f=>[f,0]));
          for (const f of arr) (t as any)[f]=1;
          setPicksT(t as Record<string,number>);
          const P = computePrior(picksP!, t as Record<string,number>, picksM!, facets);
          setPriorP(P);
        }} onBack={()=>{ setPicksM(null); }} selectedCount={selectedCount} onSelectedCountChange={setSelectedCount}/>
      </div>
    );
  }

  if (!A_raw){
    const P = priorP!;
    const budget = anchorsBudget(P, facets);
    const queue: Array<{facet:string; idx:number}> = [];
    for (const f of facets){ for (let i=0;i<(budget as any)[f];i++){ queue.push({facet:f, idx:i}); } }
    return (
      <AnchorsFlow domain={domain} queue={queue} onDone={(answers)=>{
        const perFacet: Record<string, number[]> = Object.fromEntries(facets.map(f=>[f, []]));
        for (const a of answers){ perFacet[a.facet].push(a.value); }
        const A = Object.fromEntries(facets.map(f=>{
          const arr = perFacet[f];
          if (arr.length === 0) return [f, 3.00];
          const avg = arr.reduce((s,x)=>s+x,0) / arr.length;
          return [f, Math.round(avg*100)/100];
        }));
        setPhase2Answers(answers);
        setAraw(A as Record<string,number>);
      }} onBack={()=>{ setPicksT(null); setPriorP(null); }} />
    );
  }

  const P = priorP!;
  const triggers = triggersForConfirmers(A_raw, P, domain);
  if (phase3Asked.length < triggers.length){
    const idx = phase3Asked.length;
    const f = triggers[idx];
    const q = CONFIRM[domain][f];
    return (
      <ConfirmFlow facet={f} domainLabel={DOMAINS[domain].label} question={q} onAnswer={(ans)=>{
        setPhase3Asked(prev=> prev.concat({facet:f, answer: ans}));
      }} onBack={()=>{ setAraw(null); setPhase2Answers([]); }} />
    );
  }

  // Final results
  const A_pct: Record<string,number> = Object.fromEntries(facets.map(f=> [f, toPercentFromRaw((A_raw as any)[f])])) as any;
  const initialBucket = Object.fromEntries(facets.map(f=> [f, baseBucket((A_raw as any)[f], (P as any)[f])])) as Record<string,'High'|'Medium'|'Low'>;
  const bucket = applyConfirmersBucket(initialBucket, A_raw, P, phase3Asked);
  const order = facets.slice().sort((a,b)=>{
    const rank = { High: 3, Medium: 2, Low: 1 } as const;
    if (rank[bucket[a]] !== rank[bucket[b]]) return rank[bucket[a]] - rank[bucket[b]];
    if ((A_raw as any)[b] !== (A_raw as any)[a]) return (A_raw as any)[b] - (A_raw as any)[a];
    if ((P as any)[b] !== (P as any)[a]) return (P as any)[b] - (P as any)[a];
    return facets.indexOf(a) - facets.indexOf(b);
  });
  const domain_mean_raw = Math.round((facets.reduce((s,f)=>s+(A_raw as any)[f],0)/6)*100)/100;
  const domain_mean_pct = Math.round((toPercentFromRaw(domain_mean_raw))*10)/10;


  // If running in silent mode (full test), short-circuit results UI (emission handled by effect above)
  if (silentOnComplete && resultPayload){
    return null;
  }

  

  // Helper functions for summary
  function firstSentence(text: string): string {
    const idx = text.indexOf('.');
    if (idx === -1) return text;
    return text.slice(0, idx + 1);
  }
  
  function buildSummary(): JSX.Element {
    const domainName = DOMAINS[domain].label.split(' (')[0];
    const lvlKey = (getScoreLevel as any)(domain_mean_raw).replace('neutral','medium') as 'high'|'medium'|'low';
    const levelMeaning: Record<'high'|'medium'|'low', string> = {
      high: 'You can access this trait easily and consistently.',
      medium: 'You can turn this trait on when needed, but it is not your default.',
      low: 'This trait stays in the background unless the situation forces it.'
    };
    const highs = facets.filter(f => (bucket as any)[f] === 'High').sort((a,b)=> (A_raw[b]-A_raw[a])).slice(0,2);
    const mids = facets.filter(f => (bucket as any)[f] === 'Medium').sort((a,b)=> (Math.abs(3 - A_raw[a]) - Math.abs(3 - A_raw[b]))).slice(0,2);
    const lows = facets.filter(f => (bucket as any)[f] === 'Low').sort((a,b)=> (A_raw[a]-A_raw[b])).slice(0,2);
    return (
      <div>
        <h3>{domainName} — Summary</h3>
        <p style={{marginTop:6}}>Your overall level is <b>{lvlKey.charAt(0).toUpperCase()+lvlKey.slice(1)}</b>. {levelMeaning[lvlKey]}</p>
        <p>Domain average: <b>{domain_mean_raw.toFixed(2)} / 5</b> (average of your behavior ratings).</p>
        {highs.length ? (
          <div style={{marginTop:10}}>
            <div style={{fontWeight:600}}>Strong behavior levers</div>
            <ul style={{margin:'4px 0 0', paddingLeft:18}}>
              {highs.map(name => (
                <li key={name}><b>{name}</b>: {firstSentence((FACET_INTERPRETATIONS as any)[domain][name].high)}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {mids.length ? (
          <div style={{marginTop:12}}>
            <div style={{fontWeight:600}}>Workable levers</div>
            <ul style={{margin:'4px 0 0', paddingLeft:18}}>
              {mids.map(name => (
                <li key={name}><b>{name}</b>: {firstSentence((FACET_INTERPRETATIONS as any)[domain][name].medium)}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {lows.length ? (
          <div style={{marginTop:12}}>
            <div style={{fontWeight:600}}>Development levers</div>
            <ul style={{margin:'4px 0 0', paddingLeft:18}}>
              {lows.map(name => (
                <li key={name}><b>{name}</b>: {firstSentence((FACET_INTERPRETATIONS as any)[domain][name].low)}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="card">
      {/* Summary moved to top */}
      <div className="card mt16" style={{background:'#0f141a',border:'1px solid #1a212a',borderRadius:10,padding:20}}>
        <h3 style={{margin:'0 0 16px 0',color:'#d6e5ff'}}>Your {DOMAINS[domain].label} Summary</h3>
        <div style={{fontSize:14,lineHeight:1.8,color:'#d6e5ff'}}>
          {buildSummary()}
        </div>
      </div>

      <details style={{marginTop:16}}>
        <summary style={{cursor:'pointer',color:'#a7c8ff',fontSize:12}}>
          About {DOMAINS[domain].label}: <span className="muted">{(DOMAIN_DESCRIPTIONS as any)[domain].shortDescription}</span>
        </summary>
        <div style={{marginTop:8,fontSize:13,lineHeight:1.5,color:'#b6c2d1'}}>{(DOMAIN_DESCRIPTIONS as any)[domain].fullDescription}</div>
      </details>

      <div className="card mt16">
        <h3>Legend</h3>
        <div className="grid" style={{gap:8}}>
          <div>
            <div style={{fontWeight:600, fontSize:13, color:'#d6e5ff'}}>What the badges mean</div>
            <ul style={{margin:'6px 0', paddingLeft:18, color:'#b6c2d1', fontSize:13, lineHeight:1.5}}>
              <li><b>High</b>: Strong, reliable part of your behavior. Easy to access; others notice it.</li>
              <li><b>Medium</b>: Situational. You can use it when needed but it's not your default move.</li>
              <li><b>Low</b>: De‑emphasized. You rarely use this lever unless context forces it.</li>
            </ul>
          </div>
          <div>
            <div style={{fontWeight:600, fontSize:13, color:'#d6e5ff'}}>What the stars mean</div>
            <ul style={{margin:'6px 0', paddingLeft:18, color:'#b6c2d1', fontSize:13, lineHeight:1.5}}>
              <li><b>Stars</b> show your average agreement on the direct behavior statements for that lever (1 = Very Inaccurate … 5 = Very Accurate).</li>
              <li>Quick read: <b>4–5</b> strong fuel source; <b>≈3</b> workable/context‑dependent; <b>1–2</b> weak fuel source.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid cols-2 mt16">
          {order.map(f=>{
            const b = (bucket as any)[f] as 'High'|'Medium'|'Low';
            const cls = b.toLowerCase();
            const pctVal = (A_pct as any)[f];
            const facetRaw = (A_raw as any)[f];
            const facetScoreLevel = getFacetScoreLevel(facetRaw);
            const desc = (FACET_DESCRIPTIONS as any)[domain][f] || "";
            const interp = (FACET_INTERPRETATIONS as any)[domain][f][facetScoreLevel] || "";
          const isOpen = !!open[f];
          const stars = Math.round(facetRaw);
          const full = Array.from({length: Math.max(0, Math.min(5, stars))});
          const empty = Array.from({length: Math.max(0, 5 - Math.max(0, Math.min(5, stars)))});
          const isHovered = !!hover[f];
            return (
            <div
              key={f}
              className="card"
              title="Click to expand"
              style={{cursor:'pointer', borderColor: isHovered ? '#2a3240' : undefined}}
              onMouseEnter={()=> setHover(h=> ({...h, [f]: true}))}
              onMouseLeave={()=> setHover(h=> ({...h, [f]: false}))}
              onClick={()=> setOpen(o=> ({...o, [f]: !o[f]}))}
            >
              <div className="row-nowrap" style={{justifyContent:'space-between',alignItems:'center'}} aria-expanded={isOpen}>
                <div>
                  <b>{f}</b>
                  <span className="muted" style={{marginLeft:6}}>{isOpen ? '▾' : '▸'}</span>
                  {!isOpen ? (
                    <span className="pill" style={{marginLeft:8, background:'#2c250f', borderColor:'#846f1d', color:'#ffeaa7', fontSize:11}}>Click to reveal</span>
                  ) : null}
                </div>
                  <div className={`badge ${cls}`}>{b}</div>
                </div>
              <div className="row mt8" style={{alignItems:'center', gap:6}}>
                <div aria-label={`Rating ${stars} out of 5`}>
                  {full.map((_,i)=>(<span key={`fs-${i}`} style={{color:'#f1c40f', fontSize:16}}>★</span>))}
                  {empty.map((_,i)=>(<span key={`es-${i}`} style={{color:'#2a2f38', fontSize:16}}>☆</span>))}
                </div>
              </div>
                {desc ? <div style={{marginTop:8,fontSize:12,color:'#b6c2d1',lineHeight:1.4}}><strong>What this measures:</strong> {desc}</div> : null}
              {isOpen && interp ? <div style={{marginTop:6,fontSize:12,color:'#d6e5ff',lineHeight:1.4,fontStyle:'italic'}}><strong>Your result:</strong> {interp}</div> : null}
              </div>
            );
          })}
        </div>


      <div className="divider"></div>
      <div className="row-nowrap" style={{justifyContent:'space-between'}}>
        <small className="muted">Session hash (SHA-256): <span className="kbd">{nonce || '...'}</span></small>
        <div className="row-nowrap" style={{gap:8, alignItems:'center'}}>
          <button className="btn" onClick={async ()=>{
            if (!domain || !picksP || !picksM || !picksT || !priorP || !A_raw) return;
            const f = canonicalFacets(domain);
            const A_pct_check: Record<string,number> = Object.fromEntries(f.map(ff=> [ff, toPercentFromRaw((A_raw as any)[ff])])) as any;
            const initialBucket_check = Object.fromEntries(f.map(ff=> [ff, baseBucket((A_raw as any)[ff], (priorP as any)[ff])])) as Record<string,'High'|'Medium'|'Low'>;
            const bucket_check = applyConfirmersBucket(initialBucket_check, A_raw, priorP, phase3Asked);
            const order_check = f.slice().sort((a,b)=>{
              const rank = { High: 3, Medium: 2, Low: 1 } as const;
              if (rank[bucket_check[a]] !== rank[bucket_check[b]]) return rank[bucket_check[a]] - rank[bucket_check[b]];
              if ((A_raw as any)[b] !== (A_raw as any)[a]) return (A_raw as any)[b] - (A_raw as any)[a];
              if ((priorP as any)[b] !== (priorP as any)[a]) return (priorP as any)[b] - (priorP as any)[a];
              return f.indexOf(a) - f.indexOf(b);
            });
            const domain_mean_raw_check = Math.round((f.reduce((s,ff)=>s+(A_raw as any)[ff],0)/6)*100)/100;
            const domain_mean_pct_check = Math.round((toPercentFromRaw(domain_mean_raw_check))*10)/10;
            const auditPayload = {
              version: VERSION,
              domain,
              phase1: { p: picksP, m: picksM, t: picksT, P: priorP },
              phase2: { answers: phase2Answers, A_raw },
              phase3: { asked: phase3Asked },
              final: { A_pct: A_pct_check, bucket: bucket_check, order: order_check, domain_mean_raw: domain_mean_raw_check, domain_mean_pct: domain_mean_pct_check }
            };
            const hash = await sha256(stableStringify(auditPayload));
            setVerifyStatus(hash === nonce ? 'ok' : 'fail');
          }}>Verify hash</button>
          {verifyStatus==='ok' ? <span className="badge high">Verified</span> : null}
          {verifyStatus==='fail' ? <span className="badge low">Mismatch</span> : null}
          <small className="muted">Tie-breaks use canonical facet order.</small>
        </div>
      </div>
    </div>
  );
}

function FacetPickGrid({ domain, facets, required, onSubmit, onBack, tagsFor, selectedCount, onSelectedCountChange }:{ domain: DomainKey; facets: string[]; required: number; onSubmit: (selected: string[])=>void; onBack: ()=>void; tagsFor?: (f:string)=>string[]; selectedCount: number; onSelectedCountChange: (count: number)=>void }){
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (f: string) => {
    const newSelected = selected.includes(f) ? selected.filter(x=>x!==f) : (selected.length >= required ? selected : selected.concat(f));
    setSelected(newSelected);
    onSelectedCountChange(newSelected.length);
  };
  return (
    <div>
      <div className="facet-grid mt8">
        {facets.map(f=> (
          <FacetChip key={f} domain={domain} facet={f} selected={selected.includes(f)} onToggle={()=>toggle(f)} tags={tagsFor? tagsFor(f): []} />
        ))}
      </div>
      <div className="row mt16" style={{justifyContent:'space-between'}}>
        <button className="ghost" onClick={onBack}>Back</button>
        <div className="row-nowrap" style={{gap:8}}>
          <button className="primary" disabled={selected.length !== required} onClick={()=> onSubmit(selected)}>Next</button>
        </div>
      </div>
    </div>
  );
}

function AnchorsFlow({ domain, queue, onDone, onBack }:{ domain: DomainKey; queue: Array<{facet:string; idx:number}>; onDone: (answers: Array<{facet:string; idx:number; value:number}>)=>void; onBack: ()=>void }){
  const ratings = [
    {text: "Very Inaccurate", val: 1},
    {text: "Moderately Inaccurate", val: 2},
    {text: "Neutral", val: 3},
    {text: "Moderately Accurate", val: 4},
    {text: "Very Accurate", val: 5}
  ];
  const [ans, setAns] = useState<Array<{facet:string; idx:number; value:number}>>([]);
  const qi = ans.length;
  // Call onDone after render via effect to avoid parent updates during child render
  useEffect(()=>{
    if (ans.length >= queue.length){
      onDone(ans);
    }
  }, [ans, queue.length, onDone]);
  if (qi >= queue.length){ return null; }
  const {facet, idx} = queue[qi];
  const prompt = (ANCHORS as any)[domain][facet][idx];
  return (
    <div className="card">
      <div className="row-nowrap" style={{justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h2>Phase 2 — Accuracy item {qi+1} / {queue.length}</h2>
          <p><b>{facet}</b> • Rate the statement for <b>{DOMAINS[domain].label}</b>.</p>
        </div>
        <div className="pill">Scale: Very Inaccurate → Very Accurate</div>
      </div>
      <div className="mt16">
        <div className="card" style={{background:'#0f141a',borderStyle:'dashed' as any}}>
          <div style={{fontSize:18}}>{prompt}</div>
        </div>
      </div>
      <div className="row mt16">
        {ratings.map(r=> (
          <button key={r.val} className={`rate btn${ans[qi]?.value===r.val?' selected':''}`} onClick={()=>{
            setAns(prev => prev.concat({facet, idx, value: r.val}));
          }}>{r.text}</button>
        ))}
      </div>
      <div className="row mt16" style={{justifyContent:'flex-start'}}>
        <button className="ghost" onClick={()=>{
          if (ans.length>0){ setAns(prev=> prev.slice(0,-1)); }
          else { onBack(); }
        }}>Back</button>
      </div>
    </div>
  );
}

function ConfirmFlow({ facet, domainLabel, question, onAnswer, onBack }:{ facet:string; domainLabel:string; question:string; onAnswer:(ans:'Yes'|'No'|'Maybe')=>void; onBack:()=>void }){
  const [chosen, setChosen] = useState<'Yes'|'No'|'Maybe'|null>(null);
  return (
    <div className="card">
      <div className="row-nowrap" style={{justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h2>Phase 3 — Confirm</h2>
          <p><b>{facet}</b> • Quick behavioral check.</p>
        </div>
        <div className="pill">Answers: Yes / No / Maybe</div>
      </div>
      <div className="mt16">
        <div className="card" style={{background:'#0f141a',borderStyle:'dashed' as any}}>
          <div style={{fontSize:18}}>{question}</div>
        </div>
      </div>
      <div className="row mt16">
        {['Yes','No','Maybe'].map(x=> (
          <button key={x} className={`rate btn${chosen===x?' selected':''}`} onClick={()=> setChosen(x as any)}>{x}</button>
        ))}
      </div>
      <div className="row mt16" style={{justifyContent:'space-between'}}>
        <button className="ghost" onClick={onBack}>Back</button>
        <button className="primary" disabled={!chosen} onClick={()=> chosen && onAnswer(chosen)}>Next</button>
      </div>
    </div>
  );
}

// no-op


