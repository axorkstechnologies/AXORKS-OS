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
  clients_converted: number;
  revenue_brought: number;
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
  clients_converted: number;
  revenue_brought: number;
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
// Clients Converted: 50 pts each
// Revenue Brought: 5% bonus pts (e.g. $1000 = 50 pts)
// Instagram Post: 10 pts each
// YouTube Video/Post: 20 pts each
// LinkedIn Post: 15 pts each
// Active Working Time: 5 pts per hour (approx 0.0833 pts/minute)

export function calculateScore(m: {
  emails_sent?: number;
  followups_sent?: number;
  clients_converted?: number;
  revenue_brought?: number;
  instagram_posts?: number;
  youtube_posts?: number;
  linkedin_posts?: number;
  active_minutes?: number;
}): number {
  const emails = Number(m.emails_sent || 0) * 2;
  const followups = Number(m.followups_sent || 0) * 3;
  const conversions = Number(m.clients_converted || 0) * 50;
  const revenuePts = Number(m.revenue_brought || 0) * 0.05;
  const ig = Number(m.instagram_posts || 0) * 10;
  const yt = Number(m.youtube_posts || 0) * 20;
  const linkedin = Number(m.linkedin_posts || 0) * 15;
  const activeHours = Number(m.active_minutes || 0) / 60;
  const timeScore = activeHours * 5;

  const score = emails + followups + conversions + revenuePts + ig + yt + linkedin + timeScore;
  return Math.round(score * 100) / 100;
}

// ─── Leaderboard Engine (Multi-Source Live DB Aggregation) ─────────────

export async function getPerformanceLeaderboardAsync(period: "daily" | "monthly" | "all" = "daily"): Promise<{
  leaderboard: LeaderboardEntry[];
  top_daily_performer: LeaderboardEntry | null;
  top_monthly_performer: LeaderboardEntry | null;
  summary: {
    total_emails_sent: number;
    total_followups_sent: number;
    total_clients_converted: number;
    total_revenue_brought: number;
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
      summary: {
        total_emails_sent: 0,
        total_followups_sent: 0,
        total_clients_converted: 0,
        total_revenue_brought: 0,
        total_social_proofs: 0,
        total_active_hours: 0,
      },
    };
  }

  // 1. Fetch live email counts from workspace_emails table
  let emailRows: any[] = [];
  try {
    if (period === "daily") {
      emailRows = await sql`
        SELECT 
          sent_by_user_id,
          sent_by_user_name,
          sender_email,
          COUNT(*)::int as emails_sent,
          COUNT(*) FILTER (WHERE is_followup = TRUE)::int as followups_sent,
          COUNT(*) FILTER (WHERE converted_to_client = TRUE)::int as conversions
        FROM workspace_emails
        WHERE direction = 'outbound'
          AND (created_at >= CURRENT_DATE - INTERVAL '1 day' OR sent_at >= CURRENT_DATE - INTERVAL '1 day')
        GROUP BY sent_by_user_id, sent_by_user_name, sender_email;
      `;
    } else if (period === "monthly") {
      emailRows = await sql`
        SELECT 
          sent_by_user_id,
          sent_by_user_name,
          sender_email,
          COUNT(*)::int as emails_sent,
          COUNT(*) FILTER (WHERE is_followup = TRUE)::int as followups_sent,
          COUNT(*) FILTER (WHERE converted_to_client = TRUE)::int as conversions
        FROM workspace_emails
        WHERE direction = 'outbound'
          AND (created_at >= DATE_TRUNC('month', CURRENT_DATE) OR sent_at >= DATE_TRUNC('month', CURRENT_DATE))
        GROUP BY sent_by_user_id, sent_by_user_name, sender_email;
      `;
    } else {
      emailRows = await sql`
        SELECT 
          sent_by_user_id,
          sent_by_user_name,
          sender_email,
          COUNT(*)::int as emails_sent,
          COUNT(*) FILTER (WHERE is_followup = TRUE)::int as followups_sent,
          COUNT(*) FILTER (WHERE converted_to_client = TRUE)::int as conversions
        FROM workspace_emails
        WHERE direction = 'outbound'
        GROUP BY sent_by_user_id, sent_by_user_name, sender_email;
      `;
    }
  } catch (err) {
    console.error("Error aggregating workspace_emails:", err);
  }

  // 2. Fetch KPI aggregate logs from employee_daily_kpis table
  let kpiRows: any[] = [];
  try {
    if (period === "daily") {
      kpiRows = await sql`
        SELECT 
          user_id,
          user_name,
          user_email,
          COALESCE(SUM(emails_sent), 0)::int as emails_sent,
          COALESCE(SUM(followups_sent), 0)::int as followups_sent,
          COALESCE(SUM(clients_converted), 0)::int as clients_converted,
          COALESCE(SUM(revenue_brought), 0)::numeric as revenue_brought,
          COALESCE(SUM(instagram_posts), 0)::int as instagram_posts,
          COALESCE(SUM(youtube_posts), 0)::int as youtube_posts,
          COALESCE(SUM(linkedin_posts), 0)::int as linkedin_posts,
          COALESCE(SUM(login_minutes), 0)::int as login_minutes,
          COALESCE(SUM(active_minutes), 0)::int as active_minutes,
          COALESCE(SUM(total_score), 0)::numeric as total_score
        FROM employee_daily_kpis
        WHERE date >= CURRENT_DATE - INTERVAL '1 day'
        GROUP BY user_id, user_name, user_email;
      `;
    } else if (period === "monthly") {
      kpiRows = await sql`
        SELECT 
          user_id,
          user_name,
          user_email,
          COALESCE(SUM(emails_sent), 0)::int as emails_sent,
          COALESCE(SUM(followups_sent), 0)::int as followups_sent,
          COALESCE(SUM(clients_converted), 0)::int as clients_converted,
          COALESCE(SUM(revenue_brought), 0)::numeric as revenue_brought,
          COALESCE(SUM(instagram_posts), 0)::int as instagram_posts,
          COALESCE(SUM(youtube_posts), 0)::int as youtube_posts,
          COALESCE(SUM(linkedin_posts), 0)::int as linkedin_posts,
          COALESCE(SUM(login_minutes), 0)::int as login_minutes,
          COALESCE(SUM(active_minutes), 0)::int as active_minutes,
          COALESCE(SUM(total_score), 0)::numeric as total_score
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
          COALESCE(SUM(emails_sent), 0)::int as emails_sent,
          COALESCE(SUM(followups_sent), 0)::int as followups_sent,
          COALESCE(SUM(clients_converted), 0)::int as clients_converted,
          COALESCE(SUM(revenue_brought), 0)::numeric as revenue_brought,
          COALESCE(SUM(instagram_posts), 0)::int as instagram_posts,
          COALESCE(SUM(youtube_posts), 0)::int as youtube_posts,
          COALESCE(SUM(linkedin_posts), 0)::int as linkedin_posts,
          COALESCE(SUM(login_minutes), 0)::int as login_minutes,
          COALESCE(SUM(active_minutes), 0)::int as active_minutes,
          COALESCE(SUM(total_score), 0)::numeric as total_score
        FROM employee_daily_kpis
        GROUP BY user_id, user_name, user_email;
      `;
    }
  } catch (err) {
    console.error("Error aggregating employee_daily_kpis:", err);
  }

  // 3. Fetch approved social proof posts from employee_social_proofs
  let socialRows: any[] = [];
  try {
    socialRows = await sql`
      SELECT 
        user_id,
        user_email,
        COUNT(*) FILTER (WHERE platform = 'instagram')::int as ig_count,
        COUNT(*) FILTER (WHERE platform = 'youtube')::int as yt_count,
        COUNT(*) FILTER (WHERE platform = 'linkedin')::int as li_count,
        COUNT(*)::int as total_social
      FROM employee_social_proofs
      WHERE status = 'approved' OR status = 'submitted'
      GROUP BY user_id, user_email;
    `;
  } catch (err) {
    console.error("Error aggregating employee_social_proofs:", err);
  }

  // 4. Fetch converted leads from leads table
  let leadRows: any[] = [];
  try {
    leadRows = await sql`
      SELECT 
        first_contacted_by as user_id,
        COUNT(*)::int as converted_count
      FROM leads
      WHERE status IN ('converted', 'won', 'closed_won') AND first_contacted_by IS NOT NULL
      GROUP BY first_contacted_by;
    `;
  } catch (err) {
    console.error("Error aggregating leads:", err);
  }

  // Helper matching functions
  const findEmailMetric = (userId: string, email: string, firstName: string) => {
    let sent = 0;
    let follow = 0;
    let conv = 0;
    for (const r of emailRows) {
      const matchId = r.sent_by_user_id && String(r.sent_by_user_id) === String(userId);
      const matchEmail = r.sender_email && r.sender_email.toLowerCase() === email.toLowerCase();
      const matchName = r.sent_by_user_name && firstName && r.sent_by_user_name.toLowerCase().includes(firstName.toLowerCase());

      if (matchId || matchEmail || matchName) {
        sent += Number(r.emails_sent || 0);
        follow += Number(r.followups_sent || 0);
        conv += Number(r.conversions || 0);
      }
    }
    return { sent, follow, conv };
  };

  const findKpiMetric = (userId: string, email: string) => {
    for (const r of kpiRows) {
      if (String(r.user_id) === String(userId) || (r.user_email && r.user_email.toLowerCase() === email.toLowerCase())) {
        return r;
      }
    }
    return null;
  };

  const findSocialMetric = (userId: string, email: string) => {
    for (const r of socialRows) {
      if (String(r.user_id) === String(userId) || (r.user_email && r.user_email.toLowerCase() === email.toLowerCase())) {
        return r;
      }
    }
    return null;
  };

  const findLeadMetric = (userId: string) => {
    for (const r of leadRows) {
      if (String(r.user_id) === String(userId)) {
        return Number(r.converted_count || 0);
      }
    }
    return 0;
  };

  const entries: LeaderboardEntry[] = activeUsers.map((u) => {
    const kpi = findKpiMetric(u.id, u.email);
    const emailMeta = findEmailMetric(u.id, u.email, u.first_name);
    const socialMeta = findSocialMetric(u.id, u.email);
    const leadConversions = findLeadMetric(u.id);

    // Multi-source live consolidation
    const emailsSent = Math.max(Number(kpi?.emails_sent || 0), emailMeta.sent);
    const followupsSent = Math.max(Number(kpi?.followups_sent || 0), emailMeta.follow);
    const clientsConverted = Math.max(Number(kpi?.clients_converted || 0), leadConversions, emailMeta.conv);
    const revenueBrought = Number(kpi?.revenue_brought || 0);
    const igPosts = Math.max(Number(kpi?.instagram_posts || 0), Number(socialMeta?.ig_count || 0));
    const ytPosts = Math.max(Number(kpi?.youtube_posts || 0), Number(socialMeta?.yt_count || 0));
    const liPosts = Math.max(Number(kpi?.linkedin_posts || 0), Number(socialMeta?.li_count || 0));
    const activeMins = Number(kpi?.active_minutes || 0);
    const loginMins = Number(kpi?.login_minutes || 0);

    const score = calculateScore({
      emails_sent: emailsSent,
      followups_sent: followupsSent,
      clients_converted: clientsConverted,
      revenue_brought: revenueBrought,
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
      clients_converted: clientsConverted,
      revenue_brought: revenueBrought,
      instagram_posts: igPosts,
      youtube_posts: ytPosts,
      linkedin_posts: liPosts,
      total_social_posts: igPosts + ytPosts + liPosts,
      login_hours: Math.round((loginMins / 60) * 10) / 10,
      active_hours: Math.round((activeMins / 60) * 10) / 10,
      is_top_daily: false,
      is_top_monthly: false,
      badge: "Outreach Contributor",
    };
  });

  // Sort descending by total score
  entries.sort((a, b) => b.total_score - a.total_score);

  // Assign ranks & badges
  entries.forEach((e, idx) => {
    e.rank = idx + 1;
    if (idx === 0) e.badge = "🥇 Top Lead Performer";
    else if (idx === 1) e.badge = "🥈 High Performer";
    else if (idx === 2) e.badge = "🥉 Pipeline Driver";
    else e.badge = "Active Contributor";
  });

  const topDaily = entries[0] || null;
  const topMonthly = entries[0] || null;

  if (topDaily) topDaily.is_top_daily = true;
  if (topMonthly) topMonthly.is_top_monthly = true;

  const totalEmails = entries.reduce((s, e) => s + e.emails_sent, 0);
  const totalFollowups = entries.reduce((s, e) => s + e.followups_sent, 0);
  const totalConversions = entries.reduce((s, e) => s + e.clients_converted, 0);
  const totalRevenue = entries.reduce((s, e) => s + e.revenue_brought, 0);
  const totalSocial = entries.reduce((s, e) => s + e.total_social_posts, 0);
  const totalActive = entries.reduce((s, e) => s + e.active_hours, 0);

  return {
    leaderboard: entries,
    top_daily_performer: topDaily,
    top_monthly_performer: topMonthly,
    summary: {
      total_emails_sent: totalEmails,
      total_followups_sent: totalFollowups,
      total_clients_converted: totalConversions,
      total_revenue_brought: Math.round(totalRevenue * 100) / 100,
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

// ─── Real-Time Email KPI Sync (called on every email send) ────────────
// This is the critical function that makes email metrics REAL.
// It is called from /api/email/send after a successful dispatch.

export async function syncEmailKpiAsync(
  userId: string,
  userName: string,
  userEmail: string,
  isFollowup: boolean = false
) {
  if (!DATABASE_URL) return;

  const emailPts = 2; // 2 points per email
  const followupPts = isFollowup ? 3 : 0; // 3 bonus points per follow-up
  const totalPts = emailPts + followupPts;

  await sql`
    INSERT INTO employee_daily_kpis (
      user_id, user_name, user_email, date,
      emails_sent, followups_sent, total_score, updated_at
    ) VALUES (
      ${userId}, ${userName}, ${userEmail}, CURRENT_DATE,
      1, ${isFollowup ? 1 : 0}, ${totalPts}, NOW()
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
      emails_sent = employee_daily_kpis.emails_sent + 1,
      followups_sent = employee_daily_kpis.followups_sent + ${isFollowup ? 1 : 0},
      total_score = employee_daily_kpis.total_score + ${totalPts},
      updated_at = NOW();
  `;
}

// ─── Real-Time Lead Conversion Sync (called on client conversion) ─────
// This function increments clients_converted and revenue_brought in employee_daily_kpis.

export async function syncLeadConversionAsync(
  userId: string,
  userName: string,
  userEmail: string,
  revenueAmount: number = 0
) {
  if (!DATABASE_URL) return;

  const convPts = 50; // 50 points per closed/converted client
  const revPts = Math.round(revenueAmount * 0.05); // 5% bonus points on deal value
  const totalPts = convPts + revPts;

  await sql`
    INSERT INTO employee_daily_kpis (
      user_id, user_name, user_email, date,
      clients_converted, revenue_brought, total_score, updated_at
    ) VALUES (
      ${userId}, ${userName}, ${userEmail}, CURRENT_DATE,
      1, ${revenueAmount}, ${totalPts}, NOW()
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
      clients_converted = COALESCE(employee_daily_kpis.clients_converted, 0) + 1,
      revenue_brought = COALESCE(employee_daily_kpis.revenue_brought, 0) + ${revenueAmount},
      total_score = employee_daily_kpis.total_score + ${totalPts},
      updated_at = NOW();
  `;
}

