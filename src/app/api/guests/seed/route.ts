import { NextRequest, NextResponse } from 'next/server';
import { GuestData } from '../../../../types';
import { promises as fs } from 'fs';
import path from 'path';
import { blobExists, loadGuests, saveGuests } from '../../../../lib/blobStore';

export async function POST(req: NextRequest) {
  try {
    // Simple guard: only allow in development or with ?key=...
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    if (process.env.NODE_ENV !== 'development' && key !== process.env.SEED_KEY) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // If blob already has data, skip
    if (await blobExists()) {
      const current = await loadGuests();
      if (current.length > 0) {
        return NextResponse.json({ success: true, message: 'Store not empty, skipping seed' });
      }
    }

    const dataFile = path.join(process.cwd(), 'data', 'guest-entries.json');
    const file = await fs.readFile(dataFile, 'utf8').catch(() => '[]');
    const items: GuestData[] = JSON.parse(file);
    await saveGuests(items);
    return NextResponse.json({ success: true, message: `Seeded ${items.length} records` });
  } catch (err) {
    console.error('Seed error', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
