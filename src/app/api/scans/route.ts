import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Scan, ScanRequest, CheckoutRequest } from '@/types/scan';

// Use /app/data in production (Docker) or local data folder in development
const DATA_DIR = process.env.NODE_ENV === 'production' 
  ? '/app/data' 
  : path.join(process.cwd(), 'data');

const DATA_FILE = path.join(DATA_DIR, 'scans.json');

console.log('Environment:', process.env.NODE_ENV);
console.log('Data directory:', DATA_DIR);
console.log('Data file path:', DATA_FILE);

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
    console.log('Data directory exists:', DATA_DIR);
  } catch {
    console.log('Creating data directory:', DATA_DIR);
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log('Data directory created successfully');
  }
}

// Read scans from file
async function readScans(): Promise<Scan[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const scans = JSON.parse(data);
    
    // Ensure we always return an array
    if (!Array.isArray(scans)) {
      console.warn('Scans file contains invalid data (not an array), returning empty array');
      return [];
    }
    
    console.log(`Read ${scans.length} scans from file`);
    return scans;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('Scans file does not exist yet, returning empty array');
      return [];
    }
    console.error('Error reading scans file:', error);
    return [];
  }
}

// Write scans to file
async function writeScans(scans: Scan[]) {
  try {
    await ensureDataDir();
    await fs.writeFile(DATA_FILE, JSON.stringify(scans, null, 2), 'utf-8');
    console.log(`Successfully wrote ${scans.length} scans to file:`, DATA_FILE);
    
    // Verify the write
    const stats = await fs.stat(DATA_FILE);
    console.log(`File size: ${stats.size} bytes, modified: ${stats.mtime}`);
  } catch (error) {
    console.error('Error writing scans file:', error);
    throw error;
  }
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

    // Return scans in expected format for sync manager
    return NextResponse.json({ scans });
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

// DELETE - Clear all scans (admin function)
export async function DELETE() {
  try {
    await ensureDataDir();
    await writeScans([]);
    console.log('All scans cleared');
    return NextResponse.json({ success: true, message: 'All scans cleared' });
  } catch (error) {
    console.error('Error clearing scans:', error);
    return NextResponse.json({ error: 'Failed to clear scans' }, { status: 500 });
  }
}
