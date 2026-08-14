import { NextRequest, NextResponse } from 'next/server';
import { getRecordingsForUser } from '@/lib/activity-store';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('user_id');
  const startDate = searchParams.get('start_date') || undefined;
  const endDate = searchParams.get('end_date') || undefined;

  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }

  try {
    const recordings = getRecordingsForUser(userId, startDate, endDate);
    return NextResponse.json(recordings);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
