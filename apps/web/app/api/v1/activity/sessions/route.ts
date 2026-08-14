import { NextRequest, NextResponse } from 'next/server';
import { getSessionsForUser, addSession, updateSession } from '@/lib/activity-store';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('user_id');
  const startDate = searchParams.get('start_date') || undefined;
  const endDate = searchParams.get('end_date') || undefined;

  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }

  try {
    const sessions = getSessionsForUser(userId, startDate, endDate);
    return NextResponse.json(sessions);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, user_id } = body;

    if (!user_id || !event) {
      return NextResponse.json({ error: 'user_id and event are required' }, { status: 400 });
    }

    if (event === 'login') {
      const session = addSession({
        user_id,
        login_at: new Date().toISOString(),
        logout_at: null,
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
        device: request.headers.get('user-agent') || 'unknown',
      });
      return NextResponse.json(session);
    } else if (event === 'logout') {
      // Find latest active session to logout
      const sessions = getSessionsForUser(user_id);
      const activeSession = sessions.find(s => s.logout_at === null);
      
      if (activeSession) {
        const updated = updateSession(activeSession.id, {
          logout_at: new Date().toISOString(),
        });
        return NextResponse.json(updated);
      }
      return NextResponse.json({ message: 'No active session found' });
    }

    return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
