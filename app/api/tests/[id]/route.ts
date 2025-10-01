import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/server/mongo';
import { ObjectId } from 'mongodb';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = (params?.id || '').trim();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const db = await getDb();
    let _id: ObjectId;
    try { _id = new ObjectId(id); } catch { return NextResponse.json({ error: 'Bad id' }, { status: 400 }); }
    const doc = await db.collection('results').findOne({ _id }, { projection: { answers: 1, lang: 1, timeElapsed: 1, dateStamp: 1, suiteHash: 1, appVersion: 1, whoView: 1, aiProfile: 1 } });
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ id, lang: doc.lang, timeElapsed: doc.timeElapsed, dateStamp: doc.dateStamp, suiteHash: doc.suiteHash || null, appVersion: doc.appVersion || null, whoView: doc.whoView || null, aiProfile: doc.aiProfile || null, answers: doc.answers });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}


