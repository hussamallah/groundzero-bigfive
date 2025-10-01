import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/server/mongo';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hash = (searchParams.get('hash') || '').trim();
    if (!hash) return NextResponse.json({ error: 'Missing hash' }, { status: 400 });
    const db = await getDb();
    const doc = await db.collection('results').findOne(
      { suiteHash: hash },
      { projection: { _id: 1 } }
    );
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ id: String(doc._id) });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}


