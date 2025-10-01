import { NextRequest, NextResponse } from "next/server";
import { getRun, saveRun } from "@/lib/services/runsStore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hash = (searchParams.get('hash') || '').trim();
    if (!hash) return NextResponse.json({ error: 'Missing hash' }, { status: 400 });
    const run = await getRun(hash);
    if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ results: run });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const hash = (body?.hash || '').trim();
    const results = Array.isArray(body?.results) ? body.results : null;
    if (!hash || !results) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    await saveRun(hash, results);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}


