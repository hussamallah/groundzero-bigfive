"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FullResults from "@/components/assessment/FullResults";
import { sha256 } from "@/lib/crypto/sha256";
import { stableStringify } from "@/lib/bigfive/format";

export default function ResultPage({ params }: { params: { id: string } }){
  const { id } = params;
  const router = useRouter();
  const [data, setData] = useState<Array<{domain:any; payload:any}>>([]);
  const [suiteHash, setSuiteHash] = useState<string | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'idle'|'ok'|'fail'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(()=>{
    async function run(){
      try{
        const res = await fetch(`/api/tests/${encodeURIComponent(id)}`);
        if (!res.ok){ setError('Not found'); return; }
        const json = await res.json();
        const answers = Array.isArray(json?.answers) ? json.answers : [];
        // answers are array of { domain, payload } we recompute suite hash deterministically
        setData(answers);
        // hydrate local cache for Who/AI
        try {
          localStorage.setItem('gz_result_id', id);
          localStorage.setItem('gz_full_results', JSON.stringify(answers));
        } catch {}
        // prefer suiteHash from server if present
        let hash: string | null = (json?.suiteHash as string) || null;
        if (!hash){
          const normalized = answers.map((r:any)=>({domain:r.domain, payload:r.payload}));
          hash = await sha256(stableStringify(normalized));
        }
        setSuiteHash(hash);
        try { if (hash) localStorage.setItem('gz_full_hash', hash); } catch {}
        // cache who/ai if present
        try {
          if (json?.whoView){ localStorage.setItem('gz_who_view', JSON.stringify(json.whoView)); }
          if (json?.aiProfile){ localStorage.setItem('gz_ai_profile', JSON.stringify(json.aiProfile)); }
        } catch {}
        setVerifyStatus('idle');
      } catch { setError('Failed to load'); }
    }
    run();
  }, [id]);

  if (error) return <main className="app"><div className="card"><p className="muted">{error}</p></div></main>;
  return (
    <main className="app">
      <div className="card">
        <FullResults data={data as any} suiteHash={suiteHash} verifyStatus={verifyStatus} onVerify={async ()=>{
          const normalized = data.map(r=>({domain:r.domain, payload:r.payload}));
          const hash = await sha256(stableStringify(normalized));
          setVerifyStatus(hash === suiteHash ? 'ok' : 'fail');
        }} />
        <div className="divider"></div>
        <div className="row-nowrap" style={{justifyContent:'flex-end'}}>
          <button className="btn" onClick={()=> router.push(`/who?id=${encodeURIComponent(id)}`)}>Next: Who You Are →</button>
        </div>
      </div>
    </main>
  );
}


