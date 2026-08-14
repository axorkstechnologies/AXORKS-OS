// Built-in unique ID generator — no uuid dependency needed
function genId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export interface WorkSession {
  id: string;
  user_id: string;
  login_at: string;
  logout_at: string | null;
  total_hours: number;
  ip_address: string;
  device: string;
}

export interface IdlePeriod {
  id: string;
  user_id: string;
  session_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
}

export interface ScreenRecording {
  id: string;
  user_id: string;
  recorded_at: string;
  duration_seconds: number;
  file_url: string | null;
  title: string;
}

// In-memory store using globalThis for hot reload persistence
const globalStore = globalThis as unknown as {
  _activityStore: {
    sessions: WorkSession[];
    idlePeriods: IdlePeriod[];
    recordings: ScreenRecording[];
    initialized: boolean;
  };
};

if (!globalStore._activityStore) {
  globalStore._activityStore = {
    sessions: [],
    idlePeriods: [],
    recordings: [],
    initialized: false,
  };
}

const store = globalStore._activityStore;

function generateMockData() {
  if (store.initialized) return;

  const users = ['user_founder_01', 'user_emp_02'];
  const today = new Date();
  
  users.forEach((userId) => {
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // Login 9:00 - 9:30 AM
      const loginDate = new Date(date);
      loginDate.setHours(9, Math.floor(Math.random() * 30), 0, 0);
      
      // Logout 5:00 - 6:30 PM
      const logoutDate = new Date(date);
      logoutDate.setHours(17, Math.floor(Math.random() * 90), 0, 0);

      const totalHours = (logoutDate.getTime() - loginDate.getTime()) / (1000 * 60 * 60);

      const session: WorkSession = {
        id: genId(),
        user_id: userId,
        login_at: loginDate.toISOString(),
        logout_at: logoutDate.toISOString(),
        total_hours: Number(totalHours.toFixed(2)),
        ip_address: '192.168.1.100',
        device: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      };
      
      store.sessions.push(session);

      // Add 1-3 idle periods
      const numIdle = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numIdle; j++) {
        const idleStart = new Date(loginDate);
        idleStart.setHours(idleStart.getHours() + j * 2 + 1, Math.floor(Math.random() * 60), 0, 0);
        
        const durationMins = Math.floor(Math.random() * 20) + 10; // 10-30 mins
        const idleEnd = new Date(idleStart.getTime() + durationMins * 60000);
        
        if (idleEnd > logoutDate) continue;

        store.idlePeriods.push({
          id: genId(),
          user_id: userId,
          session_id: session.id,
          started_at: idleStart.toISOString(),
          ended_at: idleEnd.toISOString(),
          duration_seconds: durationMins * 60,
        });
      }

      // Add 1 screen recording sometimes
      if (Math.random() > 0.5) {
        const recStart = new Date(loginDate);
        recStart.setHours(11, 0, 0, 0);
        store.recordings.push({
          id: genId(),
          user_id: userId,
          recorded_at: recStart.toISOString(),
          duration_seconds: 300,
          file_url: 'https://example.com/recording.mp4',
          title: `Screen Recording ${date.toISOString().split('T')[0]}`,
        });
      }
    }
  });

  store.initialized = true;
}

generateMockData();

export function getSessionsForUser(userId: string, startDate?: string, endDate?: string): WorkSession[] {
  let filtered = store.sessions.filter(s => s.user_id === userId);
  
  if (startDate) {
    const start = new Date(startDate).getTime();
    filtered = filtered.filter(s => new Date(s.login_at).getTime() >= start);
  }
  
  if (endDate) {
    const end = new Date(endDate).getTime();
    filtered = filtered.filter(s => new Date(s.login_at).getTime() <= end);
  }
  
  return filtered.sort((a, b) => new Date(b.login_at).getTime() - new Date(a.login_at).getTime());
}

export function getIdlePeriodsForUser(userId: string, startDate?: string, endDate?: string): IdlePeriod[] {
  let filtered = store.idlePeriods.filter(i => i.user_id === userId);
  
  if (startDate) {
    const start = new Date(startDate).getTime();
    filtered = filtered.filter(i => new Date(i.started_at).getTime() >= start);
  }
  
  if (endDate) {
    const end = new Date(endDate).getTime();
    filtered = filtered.filter(i => new Date(i.started_at).getTime() <= end);
  }
  
  return filtered.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}

export function getRecordingsForUser(userId: string, startDate?: string, endDate?: string): ScreenRecording[] {
  let filtered = store.recordings.filter(r => r.user_id === userId);
  
  if (startDate) {
    const start = new Date(startDate).getTime();
    filtered = filtered.filter(r => new Date(r.recorded_at).getTime() >= start);
  }
  
  if (endDate) {
    const end = new Date(endDate).getTime();
    filtered = filtered.filter(r => new Date(r.recorded_at).getTime() <= end);
  }
  
  return filtered.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
}

export function addSession(session: Omit<WorkSession, 'id' | 'total_hours'>): WorkSession {
  const newSession: WorkSession = {
    ...session,
    id: genId(),
    total_hours: 0,
  };
  store.sessions.push(newSession);
  return newSession;
}

export function updateSession(id: string, updates: Partial<WorkSession>): WorkSession | null {
  const idx = store.sessions.findIndex(s => s.id === id);
  if (idx === -1) return null;
  
  const current = store.sessions[idx];
  store.sessions[idx] = { ...current, ...updates };
  
  if (updates.logout_at && store.sessions[idx].login_at) {
    const login = new Date(store.sessions[idx].login_at);
    const logout = new Date(updates.logout_at);
    const totalHours = (logout.getTime() - login.getTime()) / (1000 * 60 * 60);
    store.sessions[idx].total_hours = Number(totalHours.toFixed(2));
  }
  
  return store.sessions[idx];
}

export function addIdlePeriod(idle: Omit<IdlePeriod, 'id'>): IdlePeriod {
  const newIdle: IdlePeriod = {
    ...idle,
    id: genId(),
  };
  store.idlePeriods.push(newIdle);
  return newIdle;
}
