"use client";
import { useMemo, useState } from "react";
import { DOMAINS, FACET_DESCRIPTIONS, FACET_INTERPRETATIONS, DOMAIN_DESCRIPTIONS, canonicalFacets } from "@/lib/bigfive/constants";
import { stableStringify, getFacetScoreLevel, getScoreLevel } from "@/lib/bigfive/format";

type DomainKey = keyof typeof DOMAINS;

export default function FullResults({ data, suiteHash, verifyStatus, onVerify }:{ data: Array<{domain:DomainKey; payload:any}>, suiteHash: string | null, verifyStatus:'idle'|'ok'|'fail', onVerify: ()=>void }){
  const [tab, setTab] = useState<DomainKey>('O');
  const order: DomainKey[] = ['O','C','E','A','N'];
  const byDomain = useMemo(()=>{
    const m = new Map<DomainKey, any>();
    for (const r of data){ m.set(r.domain, r.payload); }
    return m;
  }, [data]);

  return (
    <div>
      <div className="row mt16">
        {order.map(d => (
          <button key={d} className={`btn${tab===d?' selected':''}`} onClick={()=> setTab(d)}>{DOMAINS[d].label}</button>
        ))}
      </div>
      <div className="card mt16">
        {byDomain.get(tab) ? (
          <ResultsPanel payload={byDomain.get(tab)} />
        ) : (
          <p className="muted">No results captured yet for {DOMAINS[tab].label}.</p>
        )}
      </div>
      <div className="divider"></div>
      <div className="row-nowrap" style={{justifyContent:'space-between',alignItems:'center'}}>
        <small className="muted">Suite hash (SHA-256): <span className="kbd">{suiteHash || '...'}</span></small>
        <div className="row-nowrap" style={{gap:8}}>
          <button className="btn" onClick={()=>{
            try{
              const normalized = data.map((r:any)=>({domain:r.domain, payload:r.payload}));
              const payload = { suiteHash, results: normalized };
              const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'gz-full-results.json';
              document.body.appendChild(a); a.click();
              setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
            } catch {}
          }}>Download JSON</button>
          <button className="btn" onClick={onVerify}>Verify hash</button>
          {verifyStatus==='ok' ? <span className="badge high">Verified</span> : null}
          {verifyStatus==='fail' ? <span className="badge low">Mismatch</span> : null}
        </div>
      </div>
    </div>
  );
}

export function ResultsPanel({ payload }:{ payload:any }){
  const d = payload.domain as DomainKey;
  const final = payload.final;
  const A_pct = final.A_pct;
  const bucket = final.bucket;
  const order = final.order as string[];
  const domain_mean_raw = final.domain_mean_raw as number;
  const domain_mean_pct = final.domain_mean_pct as number;
  const facets = canonicalFacets(d);
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    // Auto-expand top 2 facets by default
    const top2 = order.slice(0, 2);
    return Object.fromEntries(top2.map(f => [f, true]));
  });
  const [hover, setHover] = useState<Record<string, boolean>>({});
  function oxford(list: string[]): string {
    if (list.length === 0) return '';
    if (list.length === 1) return list[0];
    if (list.length === 2) return `${list[0]} and ${list[1]}`;
    return `${list.slice(0,-1).join(', ')}, and ${list[list.length-1]}`;
  }
  function firstSentence(text: string): string {
    const idx = text.indexOf('.');
    if (idx === -1) return text;
    return text.slice(0, idx + 1);
  }
  function firstNSentences(text: string, n: number): string {
    const parts = text.split(/(?<=\.)\s+/).filter(Boolean);
    return parts.slice(0, Math.max(1, Math.min(n, parts.length))).join(' ');
  }
  function buildSummary(): JSX.Element {
    const domainName = DOMAINS[d].label.split(' (')[0];
    const lvlKey = (getScoreLevel as any)(domain_mean_raw).replace('neutral','medium') as 'high'|'medium'|'low';
    const levelMeaning: Record<'high'|'medium'|'low', string> = {
      high: 'You can access this trait easily and consistently.',
      medium: 'You can turn this trait on when needed, but it isn’t your default.',
      low: 'This trait stays in the background unless the situation forces it.'
    };
    const highs = facets.filter(f => (bucket as any)[f] === 'High').sort((a,b)=> (payload.phase2.A_raw[b]-payload.phase2.A_raw[a])).slice(0,2);
    const mids = facets.filter(f => (bucket as any)[f] === 'Medium').sort((a,b)=> (Math.abs(3 - payload.phase2.A_raw[a]) - Math.abs(3 - payload.phase2.A_raw[b]))).slice(0,2);
    const lows = facets.filter(f => (bucket as any)[f] === 'Low').sort((a,b)=> (payload.phase2.A_raw[a]-payload.phase2.A_raw[b])).slice(0,2);
    const exampleHigh = highs[0];
    const exampleLow = lows[0];
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
                <li key={name}><b>{name}</b>: {firstSentence((FACET_INTERPRETATIONS as any)[d][name].high)}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {mids.length ? (
          <div style={{marginTop:12}}>
            <div style={{fontWeight:600}}>Workable levers</div>
            <ul style={{margin:'4px 0 0', paddingLeft:18}}>
              {mids.map(name => (
                <li key={name}><b>{name}</b>: {firstSentence((FACET_INTERPRETATIONS as any)[d][name].medium)}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {lows.length ? (
          <div style={{marginTop:12}}>
            <div style={{fontWeight:600}}>Development levers</div>
            <ul style={{margin:'4px 0 0', paddingLeft:18}}>
              {lows.map(name => (
                <li key={name}><b>{name}</b>: {firstSentence((FACET_INTERPRETATIONS as any)[d][name].low)}</li>
              ))}
            </ul>
          </div>
        ) : null}
        
      </div>
    );
  }
  return (
    <div>
      <details style={{marginTop:8}}>
        <summary style={{cursor:'pointer',color:'#a7c8ff',fontSize:12}}>
          About {DOMAINS[d].label}: <span className="muted">{(DOMAIN_DESCRIPTIONS as any)[d].shortDescription}</span>
        </summary>
        <div style={{marginTop:8,fontSize:13,lineHeight:1.5,color:'#b6c2d1'}}>{firstNSentences((DOMAIN_DESCRIPTIONS as any)[d].fullDescription, 4)}</div>
      </details>
      <div className="card mt16">
        <h3>Legend</h3>
        <div className="grid" style={{gap:8}}>
          <div>
            <div style={{fontWeight:600, fontSize:13, color:'#d6e5ff'}}>What the badges mean</div>
            <ul style={{margin:'6px 0', paddingLeft:18, color:'#b6c2d1', fontSize:13, lineHeight:1.5}}>
              <li><b>High</b>: Strong, reliable part of your behavior. Easy to access; others notice it.</li>
              <li><b>Medium</b>: Situational. You can use it when needed but it’s not your default move.</li>
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
          const facetRaw = (payload.phase2.A_raw as any)[f];
          const facetScoreLevel = getFacetScoreLevel(facetRaw);
          const desc = (FACET_DESCRIPTIONS as any)[d][f] || "";
          const interp = (FACET_INTERPRETATIONS as any)[d][f][facetScoreLevel] || "";
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
      

      <div className="card mt16">
        <h3>Your {DOMAINS[d].label} Summary</h3>
        <div style={{background:'#0f141a',border:'1px solid #1a212a',borderRadius:10,padding:16,margin:'12px 0',fontSize:14,lineHeight:1.6,color:'#d6e5ff'}}>
          {buildSummary()}
        </div>
      </div>
    </div>
  );
}


