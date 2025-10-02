"use client";
import { useMemo } from "react";

type Level = 'High'|'Medium'|'Low';

function clamp01(x:number){ return Math.max(0, Math.min(1, x)); }
const z = (x:number)=> clamp01((x-1)/4);

function levelOf(v:number): Level {
  if (v >= 0.67) return 'High';
  if (v >= 0.33 && v <= 0.66) return 'Medium';
  return 'Low';
}

export default function LifeSignalNudge({ domain, domainMeanRaw, onNext, progressIndex, total }:{ domain: 'O'|'C'|'E'|'A'|'N'; domainMeanRaw: number; onNext: ()=>void; progressIndex: number; total: number }){

  // try to read stored domain results to enrich F calculation with E if available
  const ez = useMemo(()=>{
    try{
      const raw = localStorage.getItem('gz_domain_results');
      if (!raw) return null;
      const db = JSON.parse(raw) || {};
      const items = Object.values(db) as any[];
      const e = items.find(x=> x?.domain==='E');
      const eraw = e?.final?.domain_mean_raw;
      return typeof eraw === 'number' ? z(eraw) : null;
    } catch { return null; }
  }, []);

  const { key, value } = useMemo(()=>{
    const dz = z(domainMeanRaw);
    if (domain==='O') return { key:'V', value: dz };
    if (domain==='C') return { key:'R', value: dz };
    if (domain==='E') return { key:'D', value: dz };
    if (domain==='A') {
      const vz = ez!=null ? clamp01(0.7*dz + 0.3*ez) : dz;
      return { key:'F', value: vz };
    }
    // N
    return { key:'T', value: dz };
  }, [domain, domainMeanRaw, ez]);

  const line = useMemo(()=>{
    const lvl = levelOf(value);
    if (key==='T'){
      if (lvl==='High') return 'Threat: Pain avoidance runs hot; you scan for risks first.';
      if (lvl==='Medium') return 'Threat: You notice risk and plan around it when needed.';
      return 'Threat: Signal stays low; you move without much caution.';
    }
    if (key==='D'){
      if (lvl==='High') return 'Dominance/Drive: You push forward and assert control often.';
      if (lvl==='Medium') return 'Dominance/Drive: You can take charge when needed.';
      return 'Dominance/Drive: Low; you rarely push or direct others.';
    }
    if (key==='R'){
      if (lvl==='High') return 'Order/Regulation: Structure and impulse control steady.';
      if (lvl==='Medium') return 'Order/Regulation: You can lock structure when needed.';
      return 'Order/Regulation: Prefer flexibility over rigid plans.';
    }
    if (key==='V'){
      if (lvl==='High') return 'Novelty/Curiosity: You seek new patterns and info.';
      if (lvl==='Medium') return 'Novelty/Curiosity: You open the window when useful.';
      return 'Novelty/Curiosity: You prefer proven frames first.';
    }
    // F
    if (lvl==='High') return 'Belonging/Affiliation: You merge and keep peace often.';
    if (lvl==='Medium') return 'Belonging/Affiliation: Balance candor and harmony.';
    return 'Belonging/Affiliation: Protect clarity over comfort.';
  }, [key, value]);

  const encouragement = useMemo(()=>{
    const i = progressIndex;
    const n = total;
    if (i <= 0) return 'Keep going.';
    if (i === 1) return 'Keep moving.';
    if (i === 2) return 'Not much left.';
    if (i === n - 1) return "You've done it.";
    return 'Almost there.';
  }, [progressIndex, total]);

  return (
    <div className="card" style={{background:'#0f1420', border:'1px solid #25324a', borderRadius:10, padding:16, marginBottom:12}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <div style={{fontSize:12, color:'#9aa3ad'}}>Life Signal</div>
          <div style={{fontSize:14, color:'#d6e5ff'}}>{key} — {line}</div>
          <div style={{fontSize:12, color:'#9aa3ad', marginTop:4}}>{encouragement}</div>
        </div>
        <button className="btn" onClick={onNext} style={{marginLeft:12}}>Keep going</button>
      </div>
      <div style={{height:6, background:'#182236', borderRadius:4, overflow:'hidden', marginTop:10}}>
        <div style={{width:`${Math.round(value*100)}%`, height:'100%', background:'#5aa0ff'}} />
      </div>
    </div>
  );
}


