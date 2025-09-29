import { NextRequest, NextResponse } from 'next/server';
import { GuestData, APIResponse } from '../../../types';
import { getDb } from '../../../lib/mongodb';

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
      const db = await getDb();
      const collection = db.collection<GuestData>('guestEntries');
      // Find the most recent entry without an endTime
      const activeEntry: any = await collection.findOne(
        { id, endTime: { $exists: false } },
        { sort: { entryTime: -1 } }
      );

      if (!activeEntry) {
        return NextResponse.json({
          success: false,
          error: 'No active entry found for this ID'
        }, { status: 404 });
      }

      // Update the entry with endTime
      const endTime = new Date().toISOString();
      await collection.updateOne({ _id: activeEntry._id }, { $set: { endTime } });

      return NextResponse.json({
        success: true,
        message: 'Guest checked out successfully',
        data: { ...activeEntry, endTime }
      });

    } else if (action === 'checkin') {
      // Create new entry
      if (!type || adults === undefined || children === undefined) {
        return NextResponse.json({
          success: false,
          error: 'Type, adults, and children count are required for check-in'
        }, { status: 400 });
      }

      const db = await getDb();
      const collection = db.collection<GuestData>('guestEntries');

      const newGuest: GuestData = {
        id,
        type,
        adults,
        children,
        entryTime: new Date().toISOString(),
      };

      await collection.insertOne(newGuest as any);

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
    const db = await getDb();
    const collection = db.collection<GuestData>('guestEntries');
    const docs = await collection.find({}).sort({ entryTime: -1 }).toArray();
    // Strip _id for API response to align with GuestData type
    const guests: GuestData[] = docs.map((doc: any) => {
      const { _id, ...rest } = doc;
      return rest as GuestData;
    });
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