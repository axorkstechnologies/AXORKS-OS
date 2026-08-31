/**
 * Axorks OS — Performance & KPIs Repository (100% Neon PostgreSQL Driven)
 *
 * Core engine for Employee Metrics, Email Volume, Social Media Proofs (Google Drive),
 * Time Tracking, and Automated Daily/Monthly Leaderboard Calculations.
 */

import { sql, DATABASE_URL } from "./db";
import { getAllUsersAsync } from "./user-repository";

export interface EmployeeDailyKpi {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  date: string;
  emails_sent: number;
  followups_sent: number;
  instagram_posts: number;
  youtube_posts: number;
  linkedin_posts: number;
  login_minutes: number;
  active_minutes: number;
  total_score: number;
  created_at: string;
  updated_at: string;
}

export interface EmployeeSocialProof {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  platform: "instagram" | "youtube" | "linkedin" | "twitter" | "facebook" | "other";
  post_title: string;
  post_url?: string | null;
  google_drive_url: string;
  submission_notes?: string | null;
  status: "submitted" | "approved" | "rejected";
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  user_email: string;
  role: string;
  avatar_url?: string | null;
  total_score: number;
  emails_sent: number;
  followups_sent: number;
  instagram_posts: number;
  youtube_posts: number;
  linkedin_posts: number;
  total_social_posts: number;
  login_hours: number;
  active_hours: number;
  is_top_daily: boolean;
  is_top_monthly: boolean;
  badge: string;
}

// ─── Scoring Formula ──────────────────────────────────────────────────
// Emails: 2 pts each
// Follow-ups: 3 pts each
// Instagram Post: 10 pts each
// YouTube Video/Post: 20 pts each
// LinkedIn Post: 15 pts each
// Active Working Time: 5 pts per hour (approx 0.0833 pts/minute)

export function calculateScore(m: {
  emails_sent?: number;
  followups_sent?: number;
  instagram_posts?: number;
  youtube_posts?: number;
  linkedin_posts?: number;
  active_minutes?: number;
}): number {
  const emails = Number(m.emails_sent || 0) * 2;
  const followups = Number(m.followups_sent || 0) * 3;
  const ig = Number(m.instagram_posts || 0) * 10;
  const yt = Number(m.youtube_posts || 0) * 20;
  const linkedin = Number(m.linkedin_posts || 0) * 15;
  const activeHours = Number(m.active_minutes || 0) / 60;
  const timeScore = activeHours * 5;

  const score = emails + followups + ig + yt + linkedin + timeScore;
  return Math.round(score * 100) / 100;
}

// ─── Leaderboard Engine ───────────────────────────────────────────────

export async function getPerformanceLeaderboardAsync(period: "daily" | "monthly" | "all" = "daily"): Promise<{
  leaderboard: LeaderboardEntry[];
  top_daily_performer: LeaderboardEntry | null;
  top_monthly_performer: LeaderboardEntry | null;
  summary: {
    total_emails_sent: number;
    total_followups_sent: number;
    total_social_proofs: number;
    total_active_hours: number;
  };
}> {
  const users = await getAllUsersAsync();
  const activeUsers = users.filter((u) => u.status === "active" && u.role !== "Viewer");

  if (!DATABASE_URL) {
    return {
      leaderboard: [],
      top_daily_performer: null,
      top_monthly_performer: null,
      summary: { total_emails_sent: 0, total_followups_sent: 0, total_social_proofs: 0, total_active_hours: 0 },
    };
  }

  // 1. Fetch KPI aggregates based on period
  let kpiRows: any[] = [];
  if (period === "daily") {
    kpiRows = await sql`
      SELECT 
        user_id,
        user_name,
        user_email,
        SUM(emails_sent) as emails_sent,
        SUM(followups_sent) as followups_sent,
        SUM(instagram_posts) as instagram_posts,
        SUM(youtube_posts) as youtube_posts,
        SUM(linkedin_posts) as linkedin_posts,
        SUM(login_minutes) as login_minutes,
        SUM(active_minutes) as active_minutes,
        SUM(total_score) as total_score
      FROM employee_daily_kpis
      WHERE date = CURRENT_DATE
      GROUP BY user_id, user_name, user_email;
    `;
  } else if (period === "monthly") {
    kpiRows = await sql`
      SELECT 
        user_id,
        user_name,
        user_email,
        SUM(emails_sent) as emails_sent,
        SUM(followups_sent) as followups_sent,
        SUM(instagram_posts) as instagram_posts,
        SUM(youtube_posts) as youtube_posts,
        SUM(linkedin_posts) as linkedin_posts,
        SUM(login_minutes) as login_minutes,
        SUM(active_minutes) as active_minutes,
        SUM(total_score) as total_score
      FROM employee_daily_kpis
      WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY user_id, user_name, user_email;
    `;
  } else {
    kpiRows = await sql`
      SELECT 
        user_id,
        user_name,
        user_email,
        SUM(emails_sent) as emails_sent,
        SUM(followups_sent) as followups_sent,
        SUM(instagram_posts) as instagram_posts,
        SUM(youtube_posts) as youtube_posts,
        SUM(linkedin_posts) as linkedin_posts,
        SUM(login_minutes) as login_minutes,
        SUM(active_minutes) as active_minutes,
        SUM(total_score) as total_score
      FROM employee_daily_kpis
      GROUP BY user_id, user_name, user_email;
    `;
  }

  // Monthly top query for top monthly spotlight
  const monthlyRows = await sql`
    SELECT 
      user_id,
      SUM(total_score) as month_score
    FROM employee_daily_kpis
    WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY user_id
    ORDER BY month_score DESC
    LIMIT 1;
  `;
  const topMonthlyUserId = monthlyRows?.[0]?.user_id || null;

  // Daily top query
  const dailyRows = await sql`
    SELECT 
      user_id,
      SUM(total_score) as day_score
    FROM employee_daily_kpis
    WHERE date = CURRENT_DATE
    GROUP BY user_id
    ORDER BY day_score DESC
    LIMIT 1;
  `;
  const topDailyUserId = dailyRows?.[0]?.user_id || null;

  const kpiMap = new Map<string, any>();
  kpiRows.forEach((r) => {
    kpiMap.set(r.user_id, r);
    if (r.user_email) kpiMap.set(r.user_email.toLowerCase(), r);
  });

  const entries: LeaderboardEntry[] = activeUsers.map((u) => {
    const kpi = kpiMap.get(u.id) || kpiMap.get(u.email.toLowerCase()) || {};
    const emailsSent = Number(kpi.emails_sent || 0);
    const followupsSent = Number(kpi.followups_sent || 0);
    const igPosts = Number(kpi.instagram_posts || 0);
    const ytPosts = Number(kpi.youtube_posts || 0);
    const liPosts = Number(kpi.linkedin_posts || 0);
    const activeMins = Number(kpi.active_minutes || 0);
    const loginMins = Number(kpi.login_minutes || 0);

    const score = Number(kpi.total_score || 0) || calculateScore({
      emails_sent: emailsSent,
      followups_sent: followupsSent,
      instagram_posts: igPosts,
      youtube_posts: ytPosts,
      linkedin_posts: liPosts,
      active_minutes: activeMins,
    });

    return {
      rank: 0,
      user_id: u.id,
      user_name: `${u.first_name} ${u.last_name || ""}`.trim(),
      user_email: u.email,
      role: u.role,
      avatar_url: u.avatar_url,
      total_score: score,
      emails_sent: emailsSent,
      followups_sent: followupsSent,
      instagram_posts: igPosts,
      youtube_posts: ytPosts,
      linkedin_posts: liPosts,
      total_social_posts: igPosts + ytPosts + liPosts,
      login_hours: Math.round((loginMins / 60) * 10) / 10,
      active_hours: Math.round((activeMins / 60) * 10) / 10,
      is_top_daily: u.id === topDailyUserId,
      is_top_monthly: u.id === topMonthlyUserId,
      badge: "Outreach Contributor",
    };
  });

  // Sort descending by score
  entries.sort((a, b) => b.total_score - a.total_score);

  // Assign ranks & badges
  entries.forEach((e, idx) => {
    e.rank = idx + 1;
    if (idx === 0) e.badge = "🥇 Top Lead Performer";
    else if (idx === 1) e.badge = "🥈 High Performer";
    else if (idx === 2) e.badge = "🥉 Pipeline Driver";
    else e.badge = "Active Contributor";
  });

  const topDaily = entries.find((e) => e.is_top_daily) || entries[0] || null;
  const topMonthly = entries.find((e) => e.is_top_monthly) || entries[0] || null;

  const totalEmails = entries.reduce((s, e) => s + e.emails_sent, 0);
  const totalFollowups = entries.reduce((s, e) => s + e.followups_sent, 0);
  const totalSocial = entries.reduce((s, e) => s + e.total_social_posts, 0);
  const totalActive = entries.reduce((s, e) => s + e.active_hours, 0);

  return {
    leaderboard: entries,
    top_daily_performer: topDaily,
    top_monthly_performer: topMonthly,
    summary: {
      total_emails_sent: totalEmails,
      total_followups_sent: totalFollowups,
      total_social_proofs: totalSocial,
      total_active_hours: Math.round(totalActive * 10) / 10,
    },
  };
}

// ─── Social Media Proof Submissions (Google Drive Backed) ─────────────

export async function submitSocialProofAsync(data: {
  userId: string;
  userName: string;
  userEmail: string;
  platform: "instagram" | "youtube" | "linkedin" | "twitter" | "facebook" | "other";
  postTitle: string;
  postUrl?: string;
  googleDriveUrl: string;
  submissionNotes?: string;
}): Promise<EmployeeSocialProof> {
  if (!data.googleDriveUrl || !data.googleDriveUrl.startsWith("http")) {
    throw new Error("A valid shared Google Drive proof URL is required");
  }

  const rows = await sql`
    INSERT INTO employee_social_proofs (
      user_id, user_name, user_email, platform, post_title,
      post_url, google_drive_url, submission_notes, status, created_at, updated_at
    ) VALUES (
      ${data.userId}, ${data.userName}, ${data.userEmail}, ${data.platform}, ${data.postTitle},
      ${data.postUrl || null}, ${data.googleDriveUrl}, ${data.submissionNotes || null}, 'approved', NOW(), NOW()
    ) RETURNING *;
  `;

  const proof = rows[0] as EmployeeSocialProof;

  // Automatically update daily KPI counts for today
  await syncDailyKpiFromSocialProof(data.userId, data.userName, data.userEmail, data.platform);

  return proof;
}

export async function getSocialProofsAsync(filter?: { userId?: string; platform?: string; status?: string }): Promise<EmployeeSocialProof[]> {
  if (!DATABASE_URL) return [];
  let rows: any[] = [];
  if (filter?.userId) {
    rows = await sql`SELECT * FROM employee_social_proofs WHERE user_id = ${filter.userId} ORDER BY created_at DESC LIMIT 100;`;
  } else {
    rows = await sql`SELECT * FROM employee_social_proofs ORDER BY created_at DESC LIMIT 100;`;
  }
  return rows as EmployeeSocialProof[];
}

export async function reviewSocialProofAsync(
  proofId: string,
  status: "approved" | "rejected",
  reviewerName: string
): Promise<boolean> {
  await sql`
    UPDATE employee_social_proofs
    SET status = ${status}, reviewed_by = ${reviewerName}, reviewed_at = NOW(), updated_at = NOW()
    WHERE id::text = ${proofId};
  `;
  return true;
}

// ─── Daily KPI Auto-Calculations ──────────────────────────────────────

export async function syncDailyKpiFromSocialProof(
  userId: string,
  userName: string,
  userEmail: string,
  platform: string
) {
  const isIg = platform === "instagram" ? 1 : 0;
  const isYt = platform === "youtube" ? 1 : 0;
  const isLi = platform === "linkedin" ? 1 : 0;

  await sql`
    INSERT INTO employee_daily_kpis (
      user_id, user_name, user_email, date,
      instagram_posts, youtube_posts, linkedin_posts, total_score, updated_at
    ) VALUES (
      ${userId}, ${userName}, ${userEmail}, CURRENT_DATE,
      ${isIg}, ${isYt}, ${isLi}, ${calculateScore({ instagram_posts: isIg, youtube_posts: isYt, linkedin_posts: isLi })}, NOW()
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
      instagram_posts = employee_daily_kpis.instagram_posts + ${isIg},
      youtube_posts = employee_daily_kpis.youtube_posts + ${isYt},
      linkedin_posts = employee_daily_kpis.linkedin_posts + ${isLi},
      total_score = employee_daily_kpis.total_score + ${isIg * 10 + isYt * 20 + isLi * 15},
      updated_at = NOW();
  `;
}

export async function recordHeartbeatAsync(
  userId: string,
  userName: string,
  userEmail: string,
  activeMinutes: number = 5,
  ip: string = "127.0.0.1",
  device: string = "Desktop"
) {
  if (!DATABASE_URL) return;

  const scoreIncrement = (activeMinutes / 60) * 5;

  await sql`
    INSERT INTO employee_daily_kpis (
      user_id, user_name, user_email, date,
      login_minutes, active_minutes, total_score, updated_at
    ) VALUES (
      ${userId}, ${userName}, ${userEmail}, CURRENT_DATE,
      ${activeMinutes}, ${activeMinutes}, ${scoreIncrement}, NOW()
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
      login_minutes = employee_daily_kpis.login_minutes + ${activeMinutes},
      active_minutes = employee_daily_kpis.active_minutes + ${activeMinutes},
      total_score = employee_daily_kpis.total_score + ${scoreIncrement},
      updated_at = NOW();
  `;

  await sql`
    INSERT INTO employee_work_sessions (
      user_id, user_name, user_email, session_start, session_end,
      duration_minutes, active_minutes, ip_address, device, updated_at
    ) VALUES (
      ${userId}, ${userName}, ${userEmail}, NOW() - INTERVAL '5 minutes', NOW(),
      ${activeMinutes}, ${activeMinutes}, ${ip}, ${device}, NOW()
    );
  `;
}

export async function recalculateDailyKpiAsync(dateStr?: string) {
  if (!DATABASE_URL) return;
  const targetDate = dateStr || "CURRENT_DATE";

  // Re-aggregate and ensure score reflects emails + followups + social proofs + active time
  await sql`
    UPDATE employee_daily_kpis
    SET total_score = (
      (emails_sent * 2) +
      (followups_sent * 3) +
      (instagram_posts * 10) +
      (youtube_posts * 20) +
      (linkedin_posts * 15) +
      ((active_minutes::numeric / 60.0) * 5.0)
    ),
    updated_at = NOW()
    WHERE date = ${dateStr ? dateStr : sql`CURRENT_DATE`};
  `;
}

export async function getDailyKpiLogsAsync(userId?: string): Promise<EmployeeDailyKpi[]> {
  if (!DATABASE_URL) return [];
  let rows: any[] = [];
  if (userId) {
    rows = await sql`
      SELECT * FROM employee_daily_kpis 
      WHERE user_id = ${userId} 
      ORDER BY date DESC 
      LIMIT 60;
    `;
  } else {
    rows = await sql`
      SELECT * FROM employee_daily_kpis 
      ORDER BY date DESC, total_score DESC 
      LIMIT 100;
    `;
  }
  return rows as EmployeeDailyKpi[];
}
