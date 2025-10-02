"use client";
import { useEffect, useMemo, useState } from "react";
import { buildWhoFromFullResults } from "@/lib/bigfive/who";
import PsychProfileAI from "@/components/assessment/PsychProfileAI";
import { buildHandoff } from "@/lib/bigfive/handoff";
import LifeSignals from "@components/who/LifeSignals";
import IdentityMirror from "@components/who/IdentityMirror";
import AuthorityBar from "@components/who/AuthorityBar";
import FiveCardResults from "@components/who/FiveCardResults";
import { useTelemetry } from "@components/who/useTelemetry";
import { canonicalFacets } from "@/lib/bigfive/constants";
import { buildIdentityMirror } from "@/lib/bigfive/identityMirror";

export default function WhoPage(){
  const [who, setWho] = useState<any|null>(null);
  const [error, setError] = useState<string | null>(null);
  const [handoff, setHandoff] = useState<any|null>(null);
  const [fullResults, setFullResults] = useState<any[]>([]);
  const telemetry = useTelemetry(handoff?.hash || '');
  const [mounted, setMounted] = useState(false);
  useEffect(()=> setMounted(true), []);

  // Build deterministic Identity Mirror lines from domain means, facet buckets, and top conflict
  const identityMirrorLines = useMemo(()=>{
    try{
      if (!who || !handoff || !Array.isArray(fullResults) || fullResults.length===0) return [] as string[];
      const domainMeans = who?.derived?.domainMeans as Record<'O'|'C'|'E'|'A'|'N', number>;

      type Bucket = 'High'|'Medium'|'Low';
      const facets: Array<{ domain: 'O'|'C'|'E'|'A'|'N'; facet: string; raw: number; bucket: Bucket }> = [];
      for (const r of fullResults){
        const d = r.domain as 'O'|'C'|'E'|'A'|'N';
        const list = canonicalFacets(d);
        for (const f of list){
          const raw = r?.payload?.phase2?.A_raw?.[f];
          const bucket = r?.payload?.final?.bucket?.[f] as Bucket | undefined;
          facets.push({ domain: d, facet: f, raw: typeof raw==='number'? raw : 3, bucket: (bucket==='High' || bucket==='Medium' || bucket==='Low') ? bucket : 'Medium' });
        }
      }

      // Compute top conflict in catalog order
      const find = (domain: 'O'|'C'|'E'|'A'|'N', facetName: string) => facets.find(x=> x.domain===domain && x.facet===facetName);
      const conflicts: Array<{ left: string; right: string; id: number }> = [];
      // 1. Assertiveness↑ ∧ Anxiety↑
      const c1L = find('E','Assertiveness');
      const c1R = find('N','Anxiety');
      if (c1L?.bucket==='High' && c1R?.bucket==='High') conflicts.push({ left: 'Assertiveness↑', right: 'Anxiety↑', id: 1 });
      // 2. Self-Efficacy↑ ∧ Depression↑
      const c2L = find('C','Self-Efficacy');
      const c2R = find('N','Depression');
      if (!conflicts.length && c2L?.bucket==='High' && c2R?.bucket==='High') conflicts.push({ left: 'Self-Efficacy↑', right: 'Depression↑', id: 2 });
      // 3. Trust↓ ∧ Anger↑
      const c3L = find('A','Trust');
      const c3R = find('N','Anger');
      if (!conflicts.length && c3L?.bucket==='Low' && c3R?.bucket==='High') conflicts.push({ left: 'Trust↓', right: 'Anger↑', id: 3 });
      // 4. Cooperation↓ ∧ Dominance↑ (Assertiveness≈Dominance)
      const c4L = find('A','Cooperation');
      const c4R = find('E','Assertiveness');
      if (!conflicts.length && c4L?.bucket==='Low' && c4R?.bucket==='High') conflicts.push({ left: 'Cooperation↓', right: 'Dominance↑', id: 4 });

      const lines = buildIdentityMirror({ domainMeans, facets, conflicts }, (handoff.hash as string) || '');
      return Array.isArray(lines) ? lines.slice(0,5) : [];
    } catch { return [] as string[]; }
  }, [who, handoff, fullResults]);

  useEffect(()=>{
    async function run(){
      try{
        // Require id
        const url = new URL(window.location.href);
        const idFromUrl = url.searchParams.get('id');
        if (!idFromUrl){
          setError('Missing id. Access Who via your results link.');
          return;
        }
        localStorage.setItem('gz_result_id', idFromUrl);
        let raw = localStorage.getItem('gz_full_results');
        let suiteHash = localStorage.getItem('gz_full_hash');
        const id = idFromUrl;
        if ((!raw || !suiteHash) && id){
          try{
            const res = await fetch(`/api/tests/${encodeURIComponent(id)}`);
            if (res.ok){
              const json = await res.json();
              const answers = Array.isArray(json?.answers) ? json.answers : [];
              raw = JSON.stringify(answers);
              localStorage.setItem('gz_full_results', raw);
              // prefer server suiteHash, otherwise recompute
              suiteHash = (json?.suiteHash as string) || null as any;
              if (!suiteHash){
                const { stableStringify } = await import("@/lib/bigfive/format");
                const { sha256 } = await import("@/lib/crypto/sha256");
                const normalized = answers.map((r:any)=>({domain:r.domain, payload:r.payload}));
                suiteHash = await sha256(stableStringify(normalized));
              }
              localStorage.setItem('gz_full_hash', suiteHash || '');
              // If server provided a prebuilt who view, use it
              if (json?.whoView){ setWho(json.whoView); return; }
            }
          } catch {}
        }
        if (!raw){ setError('No results found. Run the full assessment first.'); return; }
        const data = JSON.parse(raw);
        const payload = await buildWhoFromFullResults(data, suiteHash);
        const ho = await buildHandoff(data, suiteHash||'');
        localStorage.setItem('gz_handoff', JSON.stringify(ho));
        setWho(payload);
        setHandoff(ho);
        setFullResults(data);
      } catch(e:any){ setError(e?.message || 'Failed to build Who profile'); }
    }
    run();
  }, []);
  
  // Fire view_who telemetry on mount
  useEffect(() => {
    if (handoff?.hash) {
      telemetry.send('view_who');
    }
  }, [handoff?.hash, telemetry]);

  if (!mounted) return null;

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      background: '#111', 
      color: '#eee', 
      margin: 0, 
      padding: '20px',
      minHeight: '100vh'
    }}>
      {handoff && <AuthorityBar hash={handoff.hash} />}
      
      <h1 style={{ margin: '20px 0', fontSize: '32px', fontWeight: 'normal' }}>Who You Are</h1>
      <p style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#aaa' }}>Short read. Clear pattern. Next step included.</p>

      {error ? <p style={{color:'#ff7675'}}>{error}</p> : null}
      {!who ? <p style={{color:'#aaa'}}>Building your profile…</p> : (
        <>
          <IdentityMirror 
            lines={identityMirrorLines} 
            onSeen={() => telemetry.send('mirror_seen')}
          />
          <LifeSignals means={who.derived.domainMeans} />
          <FiveCardResults 
            data={fullResults}
            onCardOpen={(cardType) => telemetry.send('preview_card_open', { card_type: cardType })}
            onOfferSeen={(offerType) => telemetry.send(`offer_seen_${offerType}` as any)}
          />
        </>
      )}
      <div style={{marginTop:24, display:'flex', justifyContent:'center'}}>
        <a href={`/result/${encodeURIComponent(localStorage.getItem('gz_result_id')||'')}`} className="btn">View Full Results</a>
      </div>
    </div>
  );
}

function Header({ who }:{ who:any }){ return null; }

function CTA({ who }:{ who:any }){
  const recId = (who.upsellRec?.id as ('override'|'compare'|'versus'|undefined)) || 'compare';
  const recKey = recId==='override' ? 'OverridePremium' : recId==='versus' ? 'Versus' : 'Compatibility';
  const cards: Array<{key:string; title:string; sub:string; bullets:string[]; cta:string; note:string}> = [
    { key:'Compatibility', title:'Compatibility — 3 cards for $1.50', sub:'You see how two people actually operate together. It flags alignment and friction and tells you what to try next. Verdict is deterministic and you can verify it. Both people need free results.', bullets:[
      'Fit • Mixed • Tense verdict','Shared strengths + friction','3 actions you can try','Domain deltas (O C E A N)','Verification code & hash'
    ], cta:'Compare us', note:'Requires both free results' },
    { key:'Versus', title:'You vs Them — 3 cards for $1.50', sub:'You get a clean side-by-side read of O C E A N. It calls the biggest gap and strongest sync so decisions are fast. Screenshot-ready and verifiable. Both people need free results.', bullets:[
      'Side-by-side bars (O C E A N)','Biggest gap • Strongest sync','Similar • Balanced • Different','Name tags + verification hash'
    ], cta:'See the matchup', note:'Requires both free results' },
    { key:'OverridePremium', title:'Override Premium — $7', sub:'You install behaviors where you are weak or inconsistent. One cue, one action, one quick reset. Repeat for 14 days until the lever holds under load. Locked to your run code and output is verifiable.', bullets:[
      'Rituals: tiny, repeatable behaviors tied to a trigger',
      'Action • builds the lever',
      'Breathing • in-the-moment reset',
      'Mini reset • removes first-step friction',
      '1 per Low/Medium facet + 14-day tracker',
      'Deterministic (locked to your run code)',
      'Includes 1 free Compatibility + 2 free Versus',
      'Verification hash on export'
    ], cta:'Start Override — $7', note:'' }
  ];
  const [open, setOpen] = useState<Record<string, boolean>>(()=> ({
    'Compatibility': false,
    'Versus': false,
    'OverridePremium': false
  }));
  return (
    <div className="card mt16" id="cta-section">
      <h3>Next Moves</h3>
      <div className="row mt8" style={{alignItems:'center'}}>
        <div>Next move — based on what is known we recommend</div>
        <span className="badge" style={{marginLeft:8, background:'#f1c40f', color:'#000'}}>{recKey==='OverridePremium'?'Override':(recKey==='Versus'?'Versus':'Compatibility')}</span>
      </div>
      {/* Recommended card sits on top, expanded */}
      {cards.filter(c=> c.key===recKey).map(c => (
        <div key={`rec-${c.key}`} className="card" style={{
          background:'#0b0f19', border:'1px solid rgba(245,197,24,0.6)', boxShadow:'0 0 40px -10px rgba(245,197,24,.5)', borderRadius:12, padding:16, marginTop:12
        }}>
          <div className="row-nowrap" style={{justifyContent:'space-between', alignItems:'center'}}>
            <div style={{color:'#f1c40f', fontWeight:600, letterSpacing:0.5}}>{c.title}</div>
          </div>
          <p style={{color:'rgba(255, 240, 200, 0.9)', marginTop:4}}>{c.sub}</p>
          <ul style={{
            marginTop:12, color:'rgba(255,255,255,0.9)', fontSize:13, lineHeight:1.5,
            listStyle:'none', paddingLeft:0, columnCount:2 as any, columnGap:16
          }}>
            {c.bullets.map((b,i)=>(<li key={`rb-${i}`} style={{breakInside:'avoid'}}>• {b}</li>))}
          </ul>
          <button className="btn" style={{marginTop:12, background:'#f1c40f', color:'#000'}}> {c.cta} </button>
          {c.note ? <div style={{marginTop:6, fontSize:11, color:'rgba(255, 240, 200, 0.7)'}}>{c.note}</div> : null}
        </div>
      ))}

      {/* Other two cards below in one row, collapsed until clicked */}
      <div className="grid" style={{gap:12, display:'grid', gridTemplateColumns:'repeat(2, 1fr)', marginTop:12}}>
        {cards.filter(c=> c.key!==recKey).map(c => (
          <div key={c.key} className="card" style={{
            background:'#0b0f19', border:'1px solid rgba(245,197,24,0.6)', boxShadow:'0 0 40px -10px rgba(245,197,24,.5)', borderRadius:12, padding:16
          }} onClick={()=> setOpen(o=> ({...o, [c.key]: !o[c.key]}))}>
            <div className="row-nowrap" style={{justifyContent:'space-between', alignItems:'center', cursor:'pointer'}}>
              <div style={{color:'#f1c40f', fontWeight:600, letterSpacing:0.5}}>{c.title}</div>
            </div>
            <p style={{color:'rgba(255, 240, 200, 0.9)', marginTop:4}}>{c.sub}</p>
            {open[c.key] ? (
              <>
                <ul style={{marginTop:12, color:'rgba(255,255,255,0.9)', fontSize:13, lineHeight:1.5, paddingLeft:18}}>
                  {c.bullets.map((b,i)=>(<li key={i}>• {b}</li>))}
                </ul>
                <button className="btn" style={{marginTop:12, background:'#f1c40f', color:'#000'}}> {c.cta} </button>
                {c.note ? <div style={{marginTop:6, fontSize:11, color:'rgba(255, 240, 200, 0.7)'}}>{c.note}</div> : null}
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function Export({ who }:{ who:any }){ return null; }

function Deterministic({ who }:{ who:any }){
  const d = who.deterministic;
  if (!d) return null;
  
  // Extract domain names from paragraphs for subheadings
  const domainNames = ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'];
  const getDomainFromParagraph = (para: string): string | null => {
    for (const domain of domainNames) {
      if (para.toLowerCase().includes(domain.toLowerCase())) {
        return domain;
      }
    }
    return null;
  };

  // Add bold emphasis to key traits and concepts
  const addBoldEmphasis = (text: string): string => {
    // Clean up any existing malformed HTML tags first
    let result = text.replace(/<strong>([^<]*)strong>/g, '<strong>$1</strong>');
    
    // If already has proper HTML tags, return as-is
    if (result.includes('<strong>') && result.includes('</strong>')) {
      return result;
    }
    
    // Define key terms to emphasize
    const keyTerms = [
      // Domain names
      'Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism',
      // Key action phrases
      'You run', 'You keep', 'You impose', 'You move', 'You can', 'You bring', 
      'You under-invest', 'You stay', 'You can feel', 'You actively seek', 
      'You prefer', 'You mix', 'You organize', 'You draw', 'You conserve', 
      'You can engage', 'You lean', 'You prioritize', 'You can cooperate', 
      'You recover', 'You build', 'You avoid', 'You balance', 'You analyze', 
      'You reason', 'You challenge', 'You question', 'You factor',
      // Key concepts
      'literal', 'structure', 'clutter', 'jurisdiction', 'hypotheticals', 
      'distractions', 'autonomy', 'directness', 'reserved', 'self-contained', 
      'succinct', 'balance', 'measured', 'strengths', 'weak points', 
      'under-invest', 'patience', 'composed', 'steady', 'pressure', 
      'destabilized', 'spikes', 'rhythm', 'pronounced', 'actively seek', 
      'novelty', 'ideas', 'change', 'modest', 'proven methods', 'concrete', 
      'workable plans', 'balanced', 'fresh thinking', 'practical judgment', 
      'follow-through', 'reliability', 'central', 'light', 'flexibly', 
      'dislike', 'tight constraints', 'organize', 'room for flow', 
      'draw energy', 'people', 'pace', 'visible momentum', 'conserve energy', 
      'prefer depth', 'crowds', 'focused settings', 'moderate', 
      'engage widely', 'work quietly', 'harmony', 'good faith', 
      'collaborative', 'candor', 'self-direction', 'smoothing edges', 
      'cooperate', 'stance', 'runs high', 'feelings arrive', 'stress', 
      'bite', 'runs low', 'even keel', 'recover quickly', 'mid-range', 
      'emotions register', 'wheel'
    ];
    
    // Sort by length (longest first) to avoid partial matches
    keyTerms.sort((a, b) => b.length - a.length);
    
    // Apply emphasis, avoiding double-wrapping
    for (const term of keyTerms) {
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      result = result.replace(regex, (match) => {
        // Don't wrap if already wrapped
        if (result.includes(`<strong>${match}</strong>`)) {
          return match;
        }
        return `<strong>${match}</strong>`;
      });
    }
    
    return result;
  };

  return (
    <div className="card mt16" style={{maxWidth: '80ch', marginLeft: 'auto', marginRight: 'auto'}}>
      <h3>Your Deterministic Render</h3>
      <p style={{marginTop:8, fontSize:15, lineHeight:1.7, color:'#d6e5ff'}}>{d.headline}</p>
      {Array.isArray(d.cleanParagraphs) && d.cleanParagraphs.length ? (
        <div style={{
          marginTop:16, 
          fontSize:14, 
          lineHeight:1.7, 
          color:'#d6e5ff'
        }}>
          {d.cleanParagraphs.map((para:string, idx:number)=>{
            const domain = getDomainFromParagraph(para);
            const emphasizedText = addBoldEmphasis(para);
            return (
              <div key={`p-${idx}`} style={{marginTop:16}}>
                {domain && (
                  <h4 style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#9aa3ad',
                    margin: '0 0 8px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {domain}
                  </h4>
                )}
                <p 
                  style={{margin:0}} 
                  dangerouslySetInnerHTML={{ __html: emphasizedText }}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          marginTop:16, 
          fontSize:14, 
          lineHeight:1.7, 
          color:'#d6e5ff'
        }}>
          {d.bodyLines.map((line:string, idx:number)=>{
            const emphasizedText = addBoldEmphasis(line);
            return (
              <div 
                key={idx} 
                style={{marginTop:8}}
                dangerouslySetInnerHTML={{ __html: emphasizedText }}
              />
            );
          })}
        </div>
      )}
      {/* verdict and upsell removed per request */}
    </div>
  );
}



