import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongodb';
import { GuestData } from '../../../../types';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    // Simple guard: only allow in development or with ?key=...
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    if (process.env.NODE_ENV !== 'development' && key !== process.env.SEED_KEY) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const db = await getDb();
    const collection = db.collection<GuestData>('guestEntries');
    const count = await collection.countDocuments();
    if (count > 0) {
      return NextResponse.json({ success: true, message: 'Collection not empty, skipping seed' });
    }

    const dataFile = path.join(process.cwd(), 'data', 'guest-entries.json');
    const file = await fs.readFile(dataFile, 'utf8').catch(() => '[]');
    const items: GuestData[] = JSON.parse(file);
    if (items.length) {
      await collection.insertMany(items as any[]);
    }
    return NextResponse.json({ success: true, message: `Seeded ${items.length} documents` });
  } catch (err) {
    console.error('Seed error', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
