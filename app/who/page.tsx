"use client";
import { useEffect, useMemo, useState } from "react";
import { buildWhoFromFullResults, WHO_ENGINE_VERSION } from "@/lib/bigfive/who";

export default function WhoPage(){
  const [who, setWho] = useState<any|null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(()=>{
    async function run(){
      try{
        const raw = localStorage.getItem('gz_full_results');
        const suiteHash = localStorage.getItem('gz_full_hash');
        if (!raw){ setError('No results found. Run the full assessment first.'); return; }
        const data = JSON.parse(raw);
        const payload = await buildWhoFromFullResults(data, suiteHash);
        setWho(payload);
      } catch(e:any){ setError(e?.message || 'Failed to build Who profile'); }
    }
    run();
  }, []);

  

  return (
    <main className="app">
      <div className="card">
        <div className="row-nowrap" style={{justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h2>Who You Are</h2>
            <p className="muted">Deterministic synthesis from your Big Five answers.</p>
          </div>
          <div>
            <span className="pill">Engine {WHO_ENGINE_VERSION}</span>
            {who?.audit?.checksum ? <span className="pill" style={{marginLeft:8}}>Audit {String(who.audit.checksum).slice(0,8)}…</span> : null}
          </div>
        </div>

        {error ? <p className="muted" style={{color:'#ff7675'}}>{error}</p> : null}
        {!who ? <p className="muted">Building your profile…</p> : (
          <div>
            <Header who={who} />
            <Narrative who={who} />
            
            <CTA who={who} />
            <Export who={who} />
          </div>
        )}
      </div>
    </main>
  );
}

function Header({ who }:{ who:any }){
  return (
    <div className="row mt8" style={{justifyContent:'space-between', alignItems:'center'}}>
      <div className="grid" style={{gap:6}}>
        <div><b>Run ID</b>: <span className="kbd">{who.runId || 'n/a'}</span></div>
        <div><b>Engine</b>: <span className="kbd">{who.version}</span></div>
        <div><b>Audit</b>: <span className="kbd">{who.audit.checksum}</span></div>
      </div>
    </div>
  );
}

function Narrative({ who }:{ who:any }){
  const sentences: string[] = who.narrative || [];
  const stressIdx = sentences.findIndex(s => /^Under stress\b/.test(s));
  const overviewEnd = stressIdx >= 0 ? stressIdx + 1 : Math.min(2, sentences.length);
  const overview = sentences.slice(0, overviewEnd);
  const remainder = sentences.slice(overviewEnd);
  const domainLines = remainder.filter(s => /^Your\s+(Openness|Conscientiousness|Extraversion|Agreeableness|Neuroticism)\b/.test(s));
  const otherLines = remainder.filter(s => !domainLines.includes(s));
  return (
    <div className="card mt16">
      <h3>Profile</h3>
      {overview.length ? (
        <p style={{marginTop:8, fontSize:15, lineHeight:1.7, color:'#d6e5ff'}}>{overview.join(' ')}</p>
      ) : null}
      {domainLines.length ? (
        <div className="mt8">
          <ul style={{marginTop:4, paddingLeft:18}}>
            {domainLines.map((s, i)=> (<li key={`d-${i}`}>{s}</li>))}
          </ul>
        </div>
      ) : null}
      {otherLines.length ? (
        <div className="mt8">
          <ul style={{marginTop:4, paddingLeft:18}}>
            {otherLines.map((s, i)=> (<li key={`o-${i}`}>{s}</li>))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function CTA({ who }:{ who:any }){
  const choice = who.chosen?.card as 'Overwrite'|'Compatibility'|'Versus';
  const reasons = who.chosen?.reasons as string[];
  const cards: Array<{key:'Overwrite'|'Compatibility'|'Versus'; title:string; body:string}> = [
    { key:'Overwrite', title:'Overwrite', body:'Rebuild key habits and scripts. Start fresh where needed.' },
    { key:'Compatibility', title:'Compatibility', body:'Lean into fits with others; minimize friction points.' },
    { key:'Versus', title:'Versus', body:'Understand and navigate tensions you often face.' }
  ];
  return (
    <div className="card mt16">
      <h3>Next Moves</h3>
      <div className="grid cols-3" style={{gap:12}}>
        {cards.map(c => (
          <div key={c.key} className={`card ${choice===c.key?'selected':''}`} style={{borderColor: choice===c.key? '#2d5eff' : undefined}}>
            <div className="row-nowrap" style={{justifyContent:'space-between', alignItems:'center'}}>
              <b>{c.title}</b>
              {choice===c.key ? <span className="badge">Chosen</span> : null}
            </div>
            <p className="muted" style={{marginTop:6}}>{c.body}</p>
          </div>
        ))}
      </div>
      <div className="row mt12">
        <div className="muted">Reason: <span className="kbd">{reasons?.join(', ')}</span></div>
      </div>
    </div>
  );
}

function Export({ who }:{ who:any }){
  return (
    <div className="card mt16">
      <h3>Export</h3>
      <div className="row-nowrap" style={{justifyContent:'space-between', alignItems:'center'}}>
        <div className="muted">Canonical JSON contains facet states, domain means, derived metrics, chosen card, version, and audit checksum.</div>
        <button className="ghost" onClick={()=>{
          const blob = new Blob([JSON.stringify(who)], {type:'application/json'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `gz-who.json`;
          document.body.appendChild(a); a.click();
          setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
        }}>Download JSON</button>
      </div>
    </div>
  );
}


