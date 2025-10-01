import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/server/mongo';
import { stableStringify } from '@/lib/bigfive/format';
import { sha256 } from '@/lib/crypto/sha256';
import { VERSION } from '@/lib/bigfive/constants';
import { buildWhoFromFullResults } from '@/lib/bigfive/who';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const answers = Array.isArray(body?.answers) ? body.answers : null;
    const lang = typeof body?.lang === 'string' ? body.lang : 'en';
    const timeElapsed = typeof body?.timeElapsed === 'number' ? body.timeElapsed : null;
    if (!answers) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    const db = await getDb();
    const normalized = answers.map((r:any)=>({domain:r.domain, payload:r.payload}));
    let suiteHash: string | null = null;
    try { suiteHash = await sha256(stableStringify(normalized)); } catch {}
    let whoView: any = null;
    try { whoView = await buildWhoFromFullResults(answers, suiteHash); } catch {}
    const doc = {
      lang,
      invalid: false,
      timeElapsed,
      dateStamp: new Date().toISOString(),
      appVersion: VERSION,
      suiteHash,
      answers,
      whoView,
      aiProfile: null
    } as any;
    const res = await db.collection('results').insertOne(doc as any);
    return NextResponse.json({ id: String(res.insertedId) });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}


