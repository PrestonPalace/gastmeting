import { NextRequest, NextResponse } from 'next/server';
import { GuestData, APIResponse } from '../../../types';
import { loadGuests, rewriteGuests } from '../../../lib/blobStore';

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

    if (action === 'checkout') {
      const guests = await loadGuests();
      // Find the most recent entry without an endTime for this id
      const candidates = guests
        .filter((g) => g.id === id && !g.endTime)
        .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
      const activeEntry = candidates[0];

      if (!activeEntry) {
        return NextResponse.json({
          success: false,
          error: 'No active entry found for this ID'
        }, { status: 404 });
      }

      const endTime = new Date().toISOString();
      const duration = Math.max(0, new Date(endTime).getTime() - new Date(activeEntry.entryTime).getTime());
      const { verified } = await rewriteGuests(
        (current) => current.map((g) => (g.id === id && !g.endTime ? { ...g, endTime, duration } : g)),
        (latest) => latest.some((g) => g.id === id && g.endTime === endTime)
      );

      return NextResponse.json({
        success: true,
        message: 'Guest checked out successfully',
        data: { ...activeEntry, endTime, duration },
        persisted: verified,
        source: 'blob'
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

      const { verified } = await rewriteGuests(
        (current) => {
          const next = current.slice();
          next.push(newGuest);
          return next;
        },
        (latest) => latest.some((g) => g.id === id && g.entryTime === newGuest.entryTime)
      );

      return NextResponse.json({
        success: true,
        message: 'Guest checked in successfully',
        data: newGuest,
        persisted: verified,
        source: 'blob'
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
    const guests = await loadGuests();
    guests.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
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