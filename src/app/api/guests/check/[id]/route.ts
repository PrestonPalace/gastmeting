import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { GuestData, APIResponse } from '../../../../../types';

const DATA_FILE = path.join(process.cwd(), 'data', 'guest-entries.json');

async function readGuestData(): Promise<GuestData[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No existing data file');
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<APIResponse>> {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);

    if (!decodedId) {
      return NextResponse.json({
        success: false,
        error: 'NFC ID is required'
      }, { status: 400 });
    }

    const guests = await readGuestData();

    // Check if there's an active entry (without endTime) for this ID
    const activeEntry = guests.find(
      guest => guest.id === decodedId && !guest.endTime
    );

    // Check if there was a recent checkout (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentCheckout = guests.find(
      guest => guest.id === decodedId && 
      guest.endTime && 
      new Date(guest.endTime) > fiveMinutesAgo
    );

    return NextResponse.json({
      success: true,
      isCheckout: !!activeEntry,
      recentCheckout: !!recentCheckout,
      data: activeEntry || null
    });

  } catch (error) {
    console.error('Check API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}