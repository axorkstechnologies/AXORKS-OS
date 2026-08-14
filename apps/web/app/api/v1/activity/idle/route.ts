import { NextRequest, NextResponse } from 'next/server';
import { getIdlePeriodsForUser, addIdlePeriod } from '@/lib/activity-store';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('user_id');
  const startDate = searchParams.get('start_date') || undefined;
  const endDate = searchParams.get('end_date') || undefined;

  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }

  try {
    const periods = getIdlePeriodsForUser(userId, startDate, endDate);
    return NextResponse.json(periods);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, started_at, duration_seconds } = body;

    if (!user_id || !started_at || typeof duration_seconds !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const idle = addIdlePeriod({
      user_id,
      session_id: 'current-session-id', // Simplified for fallback
      started_at,
      ended_at: new Date(new Date(started_at).getTime() + duration_seconds * 1000).toISOString(),
      duration_seconds,
    });

    return NextResponse.json(idle);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
