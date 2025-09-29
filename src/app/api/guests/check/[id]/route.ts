import { NextRequest, NextResponse } from 'next/server';
import { GuestData, APIResponse } from '../../../../../types';
import { getDb } from '../../../../../lib/mongodb';

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

    const db = await getDb();
    const collection = db.collection<GuestData>('guestEntries');

    // Active entry: most recent with no endTime
    const activeEntry: any = await collection.findOne(
      { id: decodedId, endTime: { $exists: false } },
      { sort: { entryTime: -1 } }
    );

    // Recent checkout within last 5 minutes
    const fiveMinutesAgoIso = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const recentCheckout = await collection.findOne(
      { id: decodedId, endTime: { $gt: fiveMinutesAgoIso } },
      { sort: { endTime: -1 } }
    );

    return NextResponse.json({
      success: true,
      isCheckout: !!activeEntry,
      recentCheckout: !!recentCheckout,
      data: activeEntry ? { ...activeEntry, _id: undefined } : null
    });

  } catch (error) {
    console.error('Check API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}