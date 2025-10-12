import { NextRequest, NextResponse } from 'next/server';
import { GuestData, APIResponse } from '../../../../../types';
import { loadGuests } from '../../../../../lib/blobStore';

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

  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === '1';
  const guests = await loadGuests({ bust: force });
    // Active entry: most recent with no endTime
    const activeEntry = guests
      .filter((g) => g.id === decodedId && !g.endTime)
      .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())[0];

    // Recent checkout within last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentCheckout = guests
      .filter((g) => g.id === decodedId && g.endTime && new Date(g.endTime).getTime() > fiveMinutesAgo)
      .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime())[0];

    return NextResponse.json({
      success: true,
      isCheckout: !!activeEntry,
      recentCheckout: !!recentCheckout,
      data: activeEntry ?? null,
      source: 'blob'
    });

  } catch (error) {
    console.error('Check API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}