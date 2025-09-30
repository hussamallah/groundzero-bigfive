"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FullResults, { ResultsPanel } from "@/components/assessment/FullResults";
import PsychProfileAI from "@/components/assessment/PsychProfileAI";
import { sha256 } from "@/lib/crypto/sha256";
import { stableStringify } from "@/lib/bigfive/format";
import { DOMAINS } from "@/lib/bigfive/constants";

export default function ResultsPage(){
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [suiteHash, setSuiteHash] = useState<string | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'idle'|'ok'|'fail'>('idle');
  const [single, setSingle] = useState<any|null>(null);
  const [mode, setMode] = useState<'full'|'single'>('full');

  useEffect(()=>{
    try {
      const url = new URL(window.location.href);
      const dh = url.searchParams.get('dh');
      if (dh){
        // Single-domain mode
        const mapRaw = localStorage.getItem('gz_domain_results');
        if (mapRaw){
          const db = JSON.parse(mapRaw);
          if (db[dh]){
            setSingle(db[dh]);
            setMode('single');
          }
        }
        return;
      }
      // Full-run mode
      const raw = localStorage.getItem('gz_full_results');
      const hash = localStorage.getItem('gz_full_hash');
      if (raw){ setData(JSON.parse(raw)); }
      if (hash){ setSuiteHash(hash); }
      setMode('full');
    } catch {}
  }, []);

  return (
    <main className="app">
      {mode==='single' && single ? (
        <div className="card">
          <div className="row-nowrap" style={{justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <h2>Results — {DOMAINS[(single as any)?.domain as keyof typeof DOMAINS]?.label || 'Domain'}</h2>
              <p className="muted">Review and verify the hash for this domain run.</p>
            </div>
          </div>
          <ResultsPanel payload={single} />
          <div className="divider"></div>
          <div className="row-nowrap" style={{justifyContent:'space-between',alignItems:'center'}}>
            <small className="muted">Session hash (SHA-256): <span className="kbd">{(single as any)?.audit?.nonce || '...'}</span></small>
            <div className="row-nowrap" style={{gap:8, alignItems:'center'}}>
              <button className="btn" onClick={async ()=>{
                try{
                  const s:any = single;
                  if (!s) return;
                  const auditPayload = {
                    version: s.version,
                    domain: s.domain,
                    phase1: s.phase1,
                    phase2: s.phase2,
                    phase3: s.phase3,
                    final: s.final
                  };
                  const hash = await sha256(stableStringify(auditPayload));
                  setVerifyStatus(hash === s?.audit?.nonce ? 'ok' : 'fail');
                } catch {}
              }}>Verify hash</button>
              {verifyStatus==='ok' ? <span className="badge high">Verified</span> : null}
              {verifyStatus==='fail' ? <span className="badge low">Mismatch</span> : null}
              <small className="muted">Tie-breaks use canonical facet order.</small>
            </div>
          </div>
          <div className="divider"></div>
          <div className="row-nowrap" style={{justifyContent:'flex-end'}}>
            <button className="btn" onClick={()=> router.push('/who')}>Next: Who You Are →</button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="row-nowrap" style={{justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <h2>Combined Results — All Five</h2>
              <p className="muted">Review and verify the hash of the full run.</p>
            </div>
          </div>
          <FullResults data={data} suiteHash={suiteHash} verifyStatus={verifyStatus} onVerify={async ()=>{
            const normalized = data.map((r:any)=>({domain:r.domain, payload:r.payload}));
            const hash = await sha256(stableStringify(normalized));
            setVerifyStatus(hash === suiteHash ? 'ok' : 'fail');
          }} />
          <div className="divider"></div>
          <div className="row-nowrap" style={{justifyContent:'flex-end'}}>
            <button className="btn" onClick={()=> router.push('/who')}>Next: Who You Are →</button>
          </div>
        </div>
      )}
      {mode==='full' ? (
        <PsychProfileAI />
      ) : null}
    </main>
  );
}


