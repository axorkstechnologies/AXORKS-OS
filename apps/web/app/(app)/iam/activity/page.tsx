"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Clock, Users, Calendar, AlertTriangle, Activity } from "lucide-react";

interface WorkSession {
  id: string;
  user_id: string;
  login_at: string;
  logout_at: string | null;
  total_hours: number;
}

interface IdlePeriod {
  id: string;
  user_id: string;
  started_at: string;
  duration_seconds: number;
}

interface ScreenRecording {
  id: string;
  user_id: string;
  recorded_at: string;
  duration_seconds: number;
  file_url: string | null;
  title: string;
}

const ALL_USERS = [
  { id: "user_founder_01", name: "Muhammad Mujahid", role: "Founder" },
  { id: "user_cofounder_02", name: "Farhana Bakht", role: "Co-Founder" },
  { id: "user_emp_03", name: "Amna Khan", role: "Marketing & Outreach" },
];

export default function ActivityAdminPage() {
  const [selectedUserId, setSelectedUserId] = useState(ALL_USERS[1].id);

  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const selectedUser = ALL_USERS.find((u) => u.id === selectedUserId) || ALL_USERS[0];

  const { data: sessions = [] } = useQuery<WorkSession[]>({
    queryKey: ["activity-sessions", selectedUserId],
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/activity/sessions?user_id=${selectedUserId}&start_date=${startDate}&end_date=${endDate}`
      );
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
  });

  const { data: idlePeriods = [] } = useQuery<IdlePeriod[]>({
    queryKey: ["activity-idle", selectedUserId],
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/activity/idle?user_id=${selectedUserId}&start_date=${startDate}&end_date=${endDate}`
      );
      if (!res.ok) throw new Error("Failed to fetch idle periods");
      return res.json();
    },
  });

  const { data: recordings = [] } = useQuery<ScreenRecording[]>({
    queryKey: ["activity-recordings", selectedUserId],
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/activity/recordings?user_id=${selectedUserId}&start_date=${startDate}&end_date=${endDate}`
      );
      if (!res.ok) throw new Error("Failed to fetch recordings");
      return res.json();
    },
  });

  // ─── Calculate Stats ─────────────────────────────────────────
  const totalHours = sessions.reduce((sum, s) => sum + (s.total_hours || 0), 0);
  const activeDaysCount = new Set(sessions.map((s) => s.login_at.split("T")[0])).size;
  const avgDailyHours = activeDaysCount > 0 ? totalHours / activeDaysCount : 0;
  const totalIdleSeconds = idlePeriods.reduce((sum, i) => sum + (i.duration_seconds || 0), 0);
  const totalIdleHours = totalIdleSeconds / 3600;

  // ─── Group by Day ────────────────────────────────────────────
  const dailyDataMap = new Map<
    string,
    {
      date: string;
      login: string;
      logout: string;
      hours: number;
      idleSeconds: number;
      hasRecording: boolean;
    }
  >();

  sessions.forEach((s) => {
    const date = s.login_at.split("T")[0];
    if (!dailyDataMap.has(date)) {
      dailyDataMap.set(date, {
        date,
        login: s.login_at,
        logout: s.logout_at || "",
        hours: 0,
        idleSeconds: 0,
        hasRecording: false,
      });
    }
    const day = dailyDataMap.get(date)!;
    day.hours += s.total_hours;
    if (new Date(s.login_at) < new Date(day.login)) day.login = s.login_at;
    if (s.logout_at && (!day.logout || new Date(s.logout_at) > new Date(day.logout)))
      day.logout = s.logout_at;
  });

  idlePeriods.forEach((i) => {
    const date = i.started_at.split("T")[0];
    if (dailyDataMap.has(date)) {
      dailyDataMap.get(date)!.idleSeconds += i.duration_seconds;
    }
  });

  recordings.forEach((r) => {
    const date = r.recorded_at.split("T")[0];
    if (dailyDataMap.has(date)) {
      dailyDataMap.get(date)!.hasRecording = true;
    }
  });

  const dailyData = Array.from(dailyDataMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // ─── Activity Heatmap (30 days) ──────────────────────────────
  const heatmapDays: { date: string; hours: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    const dayData = dailyDataMap.get(dateStr);
    heatmapDays.push({ date: dateStr, hours: dayData?.hours || 0 });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-400" />
            Employee Activity Monitor
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Track working hours, idle time, and screen recordings
          </p>
        </div>

        {/* Employee Selector */}
        <div className="flex items-center gap-3 glass p-2 px-4 rounded-xl border border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {selectedUser.name.charAt(0)}
          </div>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
          >
            {ALL_USERS.map((u) => (
              <option key={u.id} value={u.id} className="bg-slate-900">
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Hours (30d)"
          value={`${totalHours.toFixed(1)}h`}
          icon={<Clock className="w-4 h-4" />}
          color="violet"
        />
        <StatCard
          title="Avg Daily Hours"
          value={`${avgDailyHours.toFixed(1)}h`}
          icon={<Calendar className="w-4 h-4" />}
          color="cyan"
        />
        <StatCard
          title="Total Idle Time"
          value={`${totalIdleHours.toFixed(1)}h`}
          icon={<AlertTriangle className="w-4 h-4" />}
          color={totalIdleHours > 10 ? "rose" : "amber"}
        />
        <StatCard
          title="Active Days"
          value={activeDaysCount.toString()}
          icon={<Users className="w-4 h-4" />}
          color="emerald"
        />
      </div>

      {/* Activity Heatmap */}
      <div className="glass p-4 rounded-xl border border-slate-800">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          30-Day Activity Heatmap
        </h3>
        <div className="flex gap-1 flex-wrap">
          {heatmapDays.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.hours.toFixed(1)}h`}
              className={`w-6 h-6 rounded-sm border border-slate-800 ${
                day.hours >= 8
                  ? "bg-emerald-500/60"
                  : day.hours >= 4
                  ? "bg-amber-500/50"
                  : day.hours > 0
                  ? "bg-rose-500/40"
                  : "bg-slate-900"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-slate-900 border border-slate-800" /> 0h</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-rose-500/40" /> &lt;4h</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500/50" /> 4-8h</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500/60" /> 8h+</span>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="glass rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-sm font-bold">Daily Activity Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] text-slate-500 uppercase tracking-wider bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Login Time</th>
                <th className="px-4 py-3 font-semibold">Logout Time</th>
                <th className="px-4 py-3 font-semibold">Hours Worked</th>
                <th className="px-4 py-3 font-semibold">Idle Time</th>
                <th className="px-4 py-3 font-semibold">Recordings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {dailyData.map((day) => (
                <tr key={day.date} className="hover:bg-slate-900/50 transition">
                  <td className="px-4 py-3 font-medium text-slate-200">
                    {new Date(day.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(day.login).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {day.logout
                      ? new Date(day.logout).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Active"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        day.hours >= 8
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : day.hours >= 4
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {day.hours.toFixed(1)}h
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {(day.idleSeconds / 60).toFixed(0)}m
                  </td>
                  <td className="px-4 py-3">
                    {day.hasRecording ? (
                      <button
                        className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition"
                        title="Play Recording"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {dailyData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No activity data found for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  return (
    <div className="glass p-4 rounded-xl border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-slate-500">{title}</h3>
        <div className={`p-1.5 rounded-lg border ${colorMap[color] || colorMap.violet}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight text-slate-100">{value}</p>
    </div>
  );
}
