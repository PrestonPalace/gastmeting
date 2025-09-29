import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { GuestData, APIResponse } from '../../../types';

const DATA_FILE = path.join(process.cwd(), 'data', 'guest-entries.json');

async function readGuestData(): Promise<GuestData[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No existing data file, creating new one');
    return [];
  }
}

async function writeGuestData(data: GuestData[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function POST(request: NextRequest): Promise<NextResponse<APIResponse>> {
  try {
    const body = await request.json();
    const { id, action, type, adults, children } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'NFC ID is required'
      }, { status: 400 });
    }

    const guests = await readGuestData();

    if (action === 'checkout') {
      // Find the most recent entry without an endTime
      const activeEntryIndex = guests.findIndex(
        guest => guest.id === id && !guest.endTime
      );

      if (activeEntryIndex === -1) {
        return NextResponse.json({
          success: false,
          error: 'No active entry found for this ID'
        }, { status: 404 });
      }

      // Update the entry with endTime
      guests[activeEntryIndex].endTime = new Date().toISOString();

      await writeGuestData(guests);

      return NextResponse.json({
        success: true,
        message: 'Guest checked out successfully',
        data: guests[activeEntryIndex]
      });

    } else if (action === 'checkin') {
      // Create new entry
      if (!type || adults === undefined || children === undefined) {
        return NextResponse.json({
          success: false,
          error: 'Type, adults, and children count are required for check-in'
        }, { status: 400 });
      }

      const newGuest: GuestData = {
        id,
        type,
        adults,
        children,
        entryTime: new Date().toISOString(),
      };

      guests.push(newGuest);
      await writeGuestData(guests);

      return NextResponse.json({
        success: true,
        message: 'Guest checked in successfully',
        data: newGuest
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "checkin" or "checkout"'
    }, { status: 400 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse<APIResponse>> {
  try {
    const guests = await readGuestData();
    return NextResponse.json({
      success: true,
      data: guests
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}