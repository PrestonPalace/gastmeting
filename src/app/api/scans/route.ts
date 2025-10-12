import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Scan, ScanRequest, CheckoutRequest } from '@/types/scan';

const DATA_FILE = path.join(process.cwd(), 'data', 'scans.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read scans from file
async function readScans(): Promise<Scan[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Write scans to file
async function writeScans(scans: Scan[]) {
  await ensureDataDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(scans, null, 2), 'utf-8');
}

// GET - Retrieve all scans or a specific scan by ID
export async function GET(request: NextRequest) {
  try {
    const scans = await readScans();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const scan = scans.find((s: Scan) => s.id === id && !s.endTime);
      if (scan) {
        return NextResponse.json(scan);
      }
      return NextResponse.json({ error: 'Active scan not found' }, { status: 404 });
    }

    return NextResponse.json(scans);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read scans' }, { status: 500 });
  }
}

// POST - Create a new scan entry
export async function POST(request: NextRequest) {
  try {
    const body: ScanRequest = await request.json();
    const { id, type, adults, children } = body;

    if (!id || !type || adults === undefined || children === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: id, type, adults, children' },
        { status: 400 }
      );
    }

    const scans = await readScans();

    // Check if there's an active scan (no endTime) for this ID
    const activeScan = scans.find((s: Scan) => s.id === id && !s.endTime);

    if (activeScan) {
      return NextResponse.json(
        { error: 'Active scan already exists for this ID', scan: activeScan },
        { status: 400 }
      );
    }

    const newScan: Scan = {
      id,
      type,
      adults: Number(adults),
      children: Number(children),
      entryTime: new Date().toISOString(),
      endTime: null,
    };

    scans.push(newScan);
    await writeScans(scans);

    return NextResponse.json(newScan, { status: 201 });
  } catch (error) {
    console.error('Error creating scan:', error);
    return NextResponse.json({ error: 'Failed to create scan' }, { status: 500 });
  }
}

// PATCH - Update scan with exit time
export async function PATCH(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 });
    }

    const scans = await readScans();

    // Find the active scan (no endTime) for this ID
    const scanIndex = scans.findIndex((s: Scan) => s.id === id && !s.endTime);

    if (scanIndex === -1) {
      return NextResponse.json(
        { error: 'No active scan found for this ID' },
        { status: 404 }
      );
    }

    scans[scanIndex].endTime = new Date().toISOString();
    await writeScans(scans);

    return NextResponse.json(scans[scanIndex]);
  } catch (error) {
    console.error('Error updating scan:', error);
    return NextResponse.json({ error: 'Failed to update scan' }, { status: 500 });
  }
}
