"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sha256 } from "@/lib/crypto/sha256";
import { stableStringify } from "@/lib/bigfive/format";

export default function HomePage() {
  const [tab, setTab] = useState<'run'|'results'>('run');
  const [hashInput, setHashInput] = useState("");
  const [domainHashInput, setDomainHashInput] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<'idle'|'ok'|'fail'>('idle');
  const [domainVerifyStatus, setDomainVerifyStatus] = useState<'idle'|'ok'|'fail'>('idle');
  const fileRef = useRef<HTMLInputElement|null>(null);
  const router = useRouter();

  async function handleLoadByHash(){
    try{
      const raw = localStorage.getItem('gz_full_results');
      const stored = localStorage.getItem('gz_full_hash');
      if (!raw || !stored){ setVerifyStatus('fail'); return; }
      if (stored !== hashInput){ setVerifyStatus('fail'); return; }
      setVerifyStatus('ok');
      router.push('/results');
    } catch {
      setVerifyStatus('fail');
    }
  }

  async function handleLoadDomainByHash(){
    try{
      const mapRaw = localStorage.getItem('gz_domain_results');
      if (!mapRaw){ setDomainVerifyStatus('fail'); return; }
      const db = JSON.parse(mapRaw);
      if (!db[domainHashInput]){ setDomainVerifyStatus('fail'); return; }
      setDomainVerifyStatus('ok');
      const url = new URL(window.location.origin + '/results');
      url.searchParams.set('dh', domainHashInput);
      router.push(url.toString());
    } catch {
      setDomainVerifyStatus('fail');
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0];
    if (!f) return;
    try{
      const text = await f.text();
      const parsed = JSON.parse(text);
      const normalized = (Array.isArray(parsed) ? parsed : (parsed.results ? parsed.results : [])).map((r:any)=>({domain:r.domain, payload:r.payload}));
      localStorage.setItem('gz_full_results', JSON.stringify(normalized));
      const hash = await sha256(stableStringify(normalized));
      localStorage.setItem('gz_full_hash', hash);
      setHashInput(hash);
      setVerifyStatus('ok');
      router.push('/results');
    }catch{
      setVerifyStatus('fail');
    }
  }

  return (
    <main className="app">
      <h1>Ground Zero — Per-Domain Assessment</h1>
      <p className="muted">Deterministic. No RNG. Phase 1 → Phase 2 → Phase 3.</p>

      <div className="row mt16">
        <button className={`btn${tab==='run'?' selected':''}`} onClick={()=> setTab('run')}>Run</button>
        <button className={`btn${tab==='results'?' selected':''}`} onClick={()=> setTab('results')}>View results</button>
      </div>

      {tab==='run' ? (
        <div className="card" style={{marginTop: 16}}>
          <p>Select how you want to run the assessment.</p>
          <div className="row" style={{marginTop: 8}}>
            <a className="btn" href="/assessment">Run one domain at a time</a>
            <a className="btn" href="/full">Run full test (all five)</a>
          </div>
        </div>
      ) : (
        <div className="card" style={{marginTop: 16}}>
          <p className="muted">Paste a suite hash or import a saved run to view results.</p>
          <div className="row mt16" style={{alignItems:'center'}}>
            <input value={hashInput} onChange={(e)=>{ setHashInput(e.target.value); setVerifyStatus('idle'); }} placeholder="Paste suite hash here" style={{flex:1, padding:8, borderRadius:8, border:'1px solid var(--border)', background:'#0f141a', color:'var(--text)'}} />
            <button className="btn" onClick={handleLoadByHash}>Load by hash</button>
            {verifyStatus==='ok' ? <span className="badge high">Verified</span> : null}
            {verifyStatus==='fail' ? <span className="badge low">Not found</span> : null}
          </div>
          <div className="row mt16" style={{alignItems:'center'}}>
            <input value={domainHashInput} onChange={(e)=>{ setDomainHashInput(e.target.value); setDomainVerifyStatus('idle'); }} placeholder="Paste single domain hash here" style={{flex:1, padding:8, borderRadius:8, border:'1px solid var(--border)', background:'#0f141a', color:'var(--text)'}} />
            <button className="btn" onClick={handleLoadDomainByHash}>Load domain by hash</button>
            {domainVerifyStatus==='ok' ? <span className="badge high">Found</span> : null}
            {domainVerifyStatus==='fail' ? <span className="badge low">Not found</span> : null}
          </div>
          <div className="row mt16">
            <button className="btn" onClick={()=> fileRef.current?.click()}>Import results JSON</button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
          </div>
        </div>
      )}

      <div className="footer-note">Local, offline. Your data stays in the browser until you export.</div>
    </main>
  );
}


