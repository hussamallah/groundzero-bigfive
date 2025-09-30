"use client";
import { useEffect, useMemo, useState } from "react";
import Assessment from "@/components/assessment/Assessment";
import { useRouter } from "next/navigation";
import { DOMAINS, VERSION, canonicalFacets, FACET_DESCRIPTIONS, FACET_INTERPRETATIONS, DOMAIN_DESCRIPTIONS } from "@/lib/bigfive/constants";
import { stableStringify, getScoreLevel, getFacetScoreLevel } from "@/lib/bigfive/format";
import { sha256 } from "@/lib/crypto/sha256";

type DomainKey = keyof typeof DOMAINS;

export default function FullAssessment(){
  const domainOrder: DomainKey[] = ['O','C','E','A','N'];
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<Array<{domain:DomainKey; payload:any}>>([]);
  const done = idx >= domainOrder.length;
  const [suiteHash, setSuiteHash] = useState<string | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'idle'|'ok'|'fail'>('idle');
  const router = useRouter();

  useEffect(()=>{
    // Auto-compute hash when all domains are completed
    async function compute(){
      const normalized = results.map(r=>({domain:r.domain, payload:r.payload}));
      const hash = await sha256(stableStringify(normalized));
      setSuiteHash(hash);
      setVerifyStatus('idle');
      localStorage.setItem('gz_full_results', JSON.stringify(results));
      localStorage.setItem('gz_full_hash', hash);
      router.replace('/results');
    }
    if (done && results.length === domainOrder.length){ compute(); }
  }, [done, results, domainOrder.length, router]);

  return (
    <div className="card">
      <div className="row-nowrap" style={{justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h2>Full Test — All Five Domains</h2>
          <p className="muted">Runs O → C → E → A → N, one after another.</p>
        </div>
        <div className="pill">Progress {Math.min(idx,5)} / 5</div>
      </div>

      {!done ? (
        <DomainRunner domain={domainOrder[idx]} onComplete={(payload)=>{
          setResults(prev => prev.concat({domain: domainOrder[idx], payload}));
          setIdx(idx+1);
        }} />
      ) : (
        <AllResults results={results} suiteHash={suiteHash} verifyStatus={verifyStatus} onVerify={async ()=>{
          const normalized = results.map(r=>({domain:r.domain, payload:r.payload}));
          const hash = await sha256(stableStringify(normalized));
          setVerifyStatus(hash === suiteHash ? 'ok' : 'fail');
        }} />
      )}
    </div>
  );
}

function DomainRunner({ domain, onComplete }:{ domain: DomainKey; onComplete:(payload:any)=>void }){
  // We re-use the Assessment UI but intercept export to pass the payload up.
  // To avoid forking Assessment, we display instructions and ask user to hit Export when done.
  return (
    <div>
      <Assessment key={domain} initialDomain={domain} silentOnComplete onComplete={onComplete} />
    </div>
  );
}

function CaptureExport({ onPayload }:{ onPayload:(payload:any)=>void }){
  // Lightweight wrapper: taps the #payload element when "Show full payload" is toggled.
  // Simpler approach: monkey-patch URL.createObjectURL to intercept JSON (avoid risky). We use a small button instead.
  const [captured, setCaptured] = useState<any>(null);
  useEffect(()=>{
    const h = (e: any)=>{
      if (e.detail && e.detail.kind === 'gz-export'){
        setCaptured(e.detail.payload);
      }
    };
    window.addEventListener('gz:export', h as any);
    return ()=> window.removeEventListener('gz:export', h as any);
  }, []);
  return (
    <div className="row mt16">
      <button className="primary" onClick={()=>{
        const el = document.getElementById('payload');
        if (!el || !el.textContent) return;
        try { onPayload(JSON.parse(el.textContent)); } catch {}
      }}>Continue to next domain</button>
      {captured ? <span className="pill">Captured</span> : null}
    </div>
  );
}

function AllResults({ results, suiteHash, verifyStatus, onVerify }:{ results: Array<{domain:DomainKey; payload:any}>, suiteHash: string | null, verifyStatus:'idle'|'ok'|'fail', onVerify: ()=>void }){
  const [tab, setTab] = useState<DomainKey>('O');
  const order: DomainKey[] = ['O','C','E','A','N'];
  const byDomain = useMemo(()=>{
    const m = new Map<DomainKey, any>();
    for (const r of results){ m.set(r.domain, r.payload); }
    return m;
  }, [results]);

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
          <button className="btn" onClick={onVerify}>Verify hash</button>
          {verifyStatus==='ok' ? <span className="badge high">Verified</span> : null}
          {verifyStatus==='fail' ? <span className="badge low">Mismatch</span> : null}
        </div>
      </div>
    </div>
  );
}

function ResultsPanel({ payload }:{ payload:any }){
  const d = payload.domain as DomainKey;
  const final = payload.final;
  const A_pct = final.A_pct;
  const bucket = final.bucket;
  const order = final.order as string[];
  const domain_mean_raw = final.domain_mean_raw as number;
  const domain_mean_pct = final.domain_mean_pct as number;
  const facets = canonicalFacets(d);
  return (
    <div>
      <div className="row-nowrap" style={{justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h3>Results — {DOMAINS[d].label}</h3>
          <p className="muted">Phase 1 → Phase 2 → {payload.phase3.asked?.length? 'Phase 3 confirmers applied' : 'no Phase 3 needed'}.</p>
        </div>
        <div className="row-nowrap" style={{gap:8}}>
          <span className="pill">Domain mean {domain_mean_raw.toFixed(2)} ({domain_mean_pct}%)</span>
          <span className="pill">Audit hash ready</span>
        </div>
      </div>

      <div className="grid cols-2 mt16">
        <div className="card">
          <h3>Ordered facets</h3>
          {order.map(f=>{
            const b = (bucket as any)[f] as 'High'|'Medium'|'Low';
            const cls = b.toLowerCase();
            const pctVal = (A_pct as any)[f];
            const facetRaw = (payload.phase2.A_raw as any)[f];
            const facetScoreLevel = getFacetScoreLevel(facetRaw);
            const desc = (FACET_DESCRIPTIONS as any)[d][f] || "";
            const interp = (FACET_INTERPRETATIONS as any)[d][f][facetScoreLevel] || "";
            return (
              <div key={f} style={{margin:'10px 0'}}>
                <div className="row-nowrap" style={{justifyContent:'space-between',alignItems:'center'}}>
                  <div><b>{f}</b></div>
                  <div className={`badge ${cls}`}>{b}</div>
                </div>
                <div className="bar mt8"><span style={{width:`${pctVal}%`}}></span></div>
                <div className="row-nowrap" style={{justifyContent:'space-between'}}><small className="muted">{pctVal}%</small><small className="muted">A_raw {facetRaw.toFixed(2)} • P {(payload.phase1.P as any)[f]}</small></div>
                {desc ? <div style={{marginTop:8,fontSize:12,color:'#b6c2d1',lineHeight:1.4}}><strong>What this measures:</strong> {desc}</div> : null}
                {interp ? <div style={{marginTop:6,fontSize:12,color:'#d6e5ff',lineHeight:1.4,fontStyle:'italic'}}><strong>Your result:</strong> {interp}</div> : null}
              </div>
            );
          })}
        </div>

        <div className="card">
          <h3>Your {DOMAINS[d].label} Profile</h3>
          <div style={{background:'#0f141a',border:'1px solid #1a212a',borderRadius:10,padding:16,margin:'12px 0'}}>
            <div style={{fontSize:16,lineHeight:1.5,color:'#d6e5ff'}}>{(DOMAIN_DESCRIPTIONS as any)[d].results[getScoreLevel(domain_mean_raw)]}</div>
          </div>
          
          <div className="divider"></div>
          <h3>About {DOMAINS[d].label}</h3>
          <p style={{fontSize:14,lineHeight:1.5,color:'#b6c2d1',margin:'8px 0'}}>{(DOMAIN_DESCRIPTIONS as any)[d].shortDescription}</p>
          <details style={{margin:'12px 0'}}>
            <summary style={{cursor:'pointer',color:'#a7c8ff',fontSize:13}}>Read full description</summary>
            <div style={{marginTop:12,fontSize:13,lineHeight:1.5,color:'#b6c2d1'}}>{(DOMAIN_DESCRIPTIONS as any)[d].fullDescription}</div>
          </details>

          <div className="divider"></div>
          <h3>Context markers</h3>
          <p className="muted">Phase-1 markers: first-reach (Q1) and first-drop (Q2). Not strength, just priority context.</p>
          <div className="grid">
            {facets.map(f=> (
              <div key={f} className="row-nowrap" style={{justifyContent:'space-between'}}>
                <span>{f}</span>
                <span>
                  {(payload.phase1.p as any)[f] ? <span className="badge">first-reach</span> : null}
                  {(payload.phase1.m as any)[f] ? <span className="badge" style={{marginLeft:6}}>first-drop</span> : null}
                </span>
              </div>
            ))}
          </div>
          <div className="divider"></div>
          <h3>Export</h3>
          <div className="row">
            <button className="ghost" onClick={()=>{
              const blob = new Blob([stableStringify(payload)], {type:'application/json'});
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `gz-${d}-results.json`;
              document.body.appendChild(a); a.click();
              setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
            }}>Download {DOMAINS[d].label} JSON</button>
          </div>
        </div>
      </div>
    </div>
  );
}


