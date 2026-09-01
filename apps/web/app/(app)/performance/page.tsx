"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  Trophy,
  Crown,
  Medal,
  Award,
  TrendingUp,
  Mail,
  Send,
  Share2,
  Clock,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Plus,
  RefreshCw,
  FolderOpen,
  Video,
  Instagram,
  Linkedin,
  Youtube,
  ShieldCheck,
  Calendar,
  Layers,
  User,
  X,
  Zap,
} from "lucide-react";

export default function PerformanceDashboardPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const isFounderOrCoFounder = Boolean(
    currentUser?.role === "Founder" ||
      currentUser?.role === "Co-Founder" ||
      currentUser?.role === "Admin" ||
      currentUser?.email === "mujahidaryan222149@gmail.com" ||
      currentUser?.email === "heyfarii@gmail.com"
  );

  const [period, setPeriod] = useState<"daily" | "monthly" | "all">("daily");
  const [activeTab, setActiveTab] = useState<"leaderboard" | "proofs" | "time">("leaderboard");

  // Social Proof Submit State
  const [showSubmitProof, setShowSubmitProof] = useState(false);
  const [proofUserId, setProofUserId] = useState(currentUser?.id || "");
  const [proofPlatform, setProofPlatform] = useState<"instagram" | "youtube" | "linkedin" | "twitter">("linkedin");
  const [proofTitle, setProofTitle] = useState("");
  const [proofPostUrl, setProofPostUrl] = useState("");
  const [proofDriveUrl, setProofDriveUrl] = useState("");
  const [proofNotes, setProofNotes] = useState("");

  // Fetch Team Users for proof submission dropdown
  const { data: teamUsersResponse } = useQuery<{ success: boolean; data: any[] } | any[]>({
    queryKey: ["iam-users-performance"],
    queryFn: () => apiClient("/api/v1/iam/users"),
  });
  const teamUsers: any[] = Array.isArray(teamUsersResponse)
    ? teamUsersResponse
    : (teamUsersResponse as any)?.data || [];

  // Fetch Performance Leaderboard
  const { data: leaderboardResponse, isLoading, refetch } = useQuery<{
    success: boolean;
    data: {
      leaderboard: any[];
      top_daily_performer: any | null;
      top_monthly_performer: any | null;
      summary: {
        total_emails_sent: number;
        total_followups_sent: number;
        total_clients_converted: number;
        total_revenue_brought: number;
        total_social_proofs: number;
        total_active_hours: number;
      };
    };
  }>({
    queryKey: ["performance-leaderboard", period],
    queryFn: () => apiClient(`/api/v1/performance/leaderboard?period=${period}`),
  });

  // Fetch Social Proofs
  const { data: socialProofsResponse, refetch: refetchProofs } = useQuery<{
    success: boolean;
    data: any[];
  }>({
    queryKey: ["performance-social-proofs"],
    queryFn: () => apiClient("/api/v1/performance/social-proof"),
  });

  const rawLeaderboard = (leaderboardResponse as any)?.leaderboard
    ? leaderboardResponse
    : (leaderboardResponse as any)?.data?.leaderboard
    ? (leaderboardResponse as any).data
    : null;

  const leaderboardData = rawLeaderboard || {
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

  const socialProofs: any[] = Array.isArray(socialProofsResponse)
    ? socialProofsResponse
    : Array.isArray((socialProofsResponse as any)?.data)
    ? (socialProofsResponse as any).data
    : [];

  // Submit Social Proof Mutation
  const submitProofMutation = useMutation({
    mutationFn: (payload: any) =>
      apiClient("/api/v1/performance/social-proof", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (res) => {
      toast.success(res?.message || "Social campaign proof submitted successfully to Neon DB!");
      queryClient.invalidateQueries({ queryKey: ["performance-leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["performance-social-proofs"] });
      setShowSubmitProof(false);
      setProofTitle("");
      setProofPostUrl("");
      setProofDriveUrl("");
      setProofNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit social proof");
    },
  });

  // Manual Daily Recalculation Mutation
  const recalculateMutation = useMutation({
    mutationFn: () =>
      apiClient("/api/v1/performance/calculate-daily", { method: "POST" }),
    onSuccess: () => {
      toast.success("Daily KPIs and performance scores recalculated in Neon DB!");
      refetch();
    },
  });

  // Send periodic work heartbeat
  useEffect(() => {
    if (!currentUser?.id) return;
    const interval = setInterval(() => {
      apiClient("/api/v1/performance/heartbeat", {
        method: "POST",
        body: JSON.stringify({ userId: currentUser.id, activeMinutes: 5 }),
      }).catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofDriveUrl || !proofDriveUrl.startsWith("http")) {
      toast.error("Please enter a valid Google Drive proof URL");
      return;
    }
    if (!proofTitle.trim()) {
      toast.error("Please enter a title for the post/campaign");
      return;
    }
    const targetUser = teamUsers.find((u) => u.id === proofUserId) || currentUser;

    submitProofMutation.mutate({
      userId: targetUser?.id || proofUserId,
      userName: `${targetUser?.first_name || "Team Member"} ${targetUser?.last_name || ""}`.trim(),
      userEmail: targetUser?.email || "team@axorks.com",
      platform: proofPlatform,
      postTitle: proofTitle.trim(),
      postUrl: proofPostUrl.trim() || undefined,
      googleDriveUrl: proofDriveUrl.trim(),
      submissionNotes: proofNotes.trim() || undefined,
    });
  };

  const topDaily = leaderboardData.top_daily_performer || leaderboardData.leaderboard[0];
  const topMonthly = leaderboardData.top_monthly_performer || leaderboardData.leaderboard[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Employees KPIs &amp; Performance Center</span>
              {isFounderOrCoFounder && <Crown className="w-5 h-5 text-amber-400" />}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
              Live Scoring Engine
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-xs font-medium mt-1">
            Tracking outreach emails, Google Drive verified social media campaigns (IG, YT, LinkedIn), and active work time in Neon DB
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSubmitProof(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-violet-600/30 transition transform active:scale-95 shrink-0"
          >
            <Share2 className="w-4 h-4" /> Submit Social Proof (GDrive)
          </button>

          {isFounderOrCoFounder && (
            <button
              onClick={() => recalculateMutation.mutate()}
              disabled={recalculateMutation.isPending}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition shadow-xs"
              title="Recalculate daily KPI scores in Neon DB"
            >
              <RefreshCw className={`w-4 h-4 ${recalculateMutation.isPending ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* TOP DESERVING EMPLOYEE SPOTLIGHT PODIUM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Top Performer Spotlight */}
        {topDaily && (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-amber-50/40 dark:from-amber-950/30 dark:via-slate-950 dark:to-amber-950/20 border-2 border-amber-300 dark:border-amber-500/50 shadow-lg space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500 animate-bounce" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  Lead / Most Deserving Employee of the Day
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-amber-100 dark:bg-amber-500/30 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-500/40">
                {topDaily.total_score} Points
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-black flex items-center justify-center text-2xl shadow-xl shadow-amber-500/30 shrink-0 border-2 border-amber-300">
                {topDaily.user_name?.[0] || "T"}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{topDaily.user_name}</span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">({topDaily.badge})</span>
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{topDaily.role} • {topDaily.user_email}</p>
                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-bold mt-1.5">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-violet-600" /> {topDaily.emails_sent} Emails</span>
                  <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5 text-emerald-600" /> {topDaily.total_social_posts} Social Proofs</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-cyan-600" /> {topDaily.active_hours}h Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Top Performer Spotlight */}
        {topMonthly && (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-violet-50 via-white to-violet-50/40 dark:from-violet-950/30 dark:via-slate-950 dark:to-violet-950/20 border-2 border-violet-300 dark:border-violet-500/50 shadow-lg space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                <span className="text-xs font-black uppercase tracking-wider text-violet-900 dark:text-violet-300">
                  Monthly Performance Champion
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-violet-100 dark:bg-violet-500/30 text-violet-950 dark:text-violet-200 border border-violet-300 dark:border-violet-500/40">
                {topMonthly.total_score} Points
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black flex items-center justify-center text-2xl shadow-xl shadow-violet-600/30 shrink-0 border-2 border-violet-300">
                {topMonthly.user_name?.[0] || "M"}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{topMonthly.user_name}</span>
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400">({topMonthly.badge})</span>
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{topMonthly.role} • {topMonthly.user_email}</p>
                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-bold mt-1.5">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-violet-600" /> {topMonthly.emails_sent} Emails</span>
                  <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5 text-emerald-600" /> {topMonthly.total_social_posts} Social Proofs</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-cyan-600" /> {topMonthly.active_hours}h Active</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Performance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Emails Sent</span>
            <div className="p-1.5 rounded-xl bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/40">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {leaderboardData.summary.total_emails_sent || 0}
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Outreach emails</p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Follow-Ups</span>
            <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40">
              <Mail className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {leaderboardData.summary.total_followups_sent || 0}
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Nurturing follow-ups</p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Clients Converted</span>
            <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {leaderboardData.summary.total_clients_converted || 0}
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Closed deals</p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Revenue Brought</span>
            <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ${(leaderboardData.summary.total_revenue_brought || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Total business value</p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Social Proofs</span>
            <div className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40">
              <Share2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {leaderboardData.summary.total_social_proofs || 0}
          </div>
          <p className="text-[10px] text-slate-500 font-medium">GDrive verified posts</p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Hours</span>
            <div className="p-1.5 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/40">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {leaderboardData.summary.total_active_hours || 0}h
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Session work time</p>
        </div>
      </div>

      {/* Tabs Switcher: Leaderboard vs Social Proofs vs Time Logs */}
      <div className="bg-white dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`px-3.5 py-2 rounded-xl text-xs transition border ${
              activeTab === "leaderboard"
                ? "bg-violet-600 text-white font-bold border-violet-600 shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-transparent"
            }`}
          >
            🏆 Leaderboard Rankings
          </button>
          <button
            onClick={() => setActiveTab("proofs")}
            className={`px-3.5 py-2 rounded-xl text-xs transition border ${
              activeTab === "proofs"
                ? "bg-violet-600 text-white font-bold border-violet-600 shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-transparent"
            }`}
          >
            📸 Social Proofs (GDrive) ({socialProofs.length})
          </button>
          <button
            onClick={() => setActiveTab("time")}
            className={`px-3.5 py-2 rounded-xl text-xs transition border ${
              activeTab === "time"
                ? "bg-violet-600 text-white font-bold border-violet-600 shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-transparent"
            }`}
          >
            ⏱️ Work Time Tracking
          </button>
        </div>

        {activeTab === "leaderboard" && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-end sm:self-auto">
            <button
              onClick={() => setPeriod("daily")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                period === "daily" ? "bg-violet-600 text-white shadow-xs" : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriod("monthly")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                period === "monthly" ? "bg-violet-600 text-white shadow-xs" : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriod("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                period === "all" ? "bg-violet-600 text-white shadow-xs" : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All Time
            </button>
          </div>
        )}
      </div>

      {/* LEADERBOARD TABLE TAB */}
      {activeTab === "leaderboard" && (
        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-violet-600 dark:text-violet-400" /> Composite Employee Performance Table
            </h3>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium hidden sm:inline">
              Scoring: 2pts/Email • 3pts/Followup • 50pts/Client Converted • 5% Rev Pts • 10pts/IG • 20pts/YT • 15pts/LinkedIn • 5pts/Hour Active
            </span>
          </div>

          <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            <table className="w-full min-w-[1100px] text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10">
                <tr>
                  <th className="p-4 whitespace-nowrap min-w-[220px]">Rank &amp; Employee</th>
                  <th className="p-4 whitespace-nowrap min-w-[140px]">Role</th>
                  <th className="p-4 whitespace-nowrap min-w-[120px]">Total Score</th>
                  <th className="p-4 whitespace-nowrap min-w-[100px]">Emails Sent</th>
                  <th className="p-4 whitespace-nowrap min-w-[100px]">Follow-ups</th>
                  <th className="p-4 whitespace-nowrap min-w-[120px]">Converted</th>
                  <th className="p-4 whitespace-nowrap min-w-[120px]">Revenue</th>
                  <th className="p-4 whitespace-nowrap min-w-[180px]">Social Proofs</th>
                  <th className="p-4 whitespace-nowrap min-w-[100px]">Active Time</th>
                  <th className="p-4 whitespace-nowrap text-right min-w-[160px]">Performance Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {leaderboardData.leaderboard.map((emp: any, i: number) => (
                  <tr
                    key={emp.user_id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-900/60 transition ${
                      i === 0 ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                    }`}
                  >
                    <td className="p-4 whitespace-nowrap font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      <span className="w-6 font-mono font-black text-slate-700 dark:text-slate-300 text-sm">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-600/30 text-violet-800 dark:text-violet-300 font-black flex items-center justify-center text-xs border border-violet-300 dark:border-violet-500/30 shrink-0">
                        {emp.user_name?.[0] || "E"}
                      </div>
                      <div>
                        <span className="block font-black text-slate-900 dark:text-white">{emp.user_name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{emp.user_email}</span>
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">{emp.role}</td>

                    <td className="p-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-violet-100 dark:bg-violet-500/20 text-violet-900 dark:text-violet-300 border border-violet-300 dark:border-violet-500/40">
                        {emp.total_score || 0} pts
                      </span>
                    </td>

                    <td className="p-4 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">{emp.emails_sent || 0}</td>
                    <td className="p-4 whitespace-nowrap font-mono font-bold text-emerald-700 dark:text-emerald-400">{emp.followups_sent || 0}</td>
                    <td className="p-4 whitespace-nowrap font-mono font-bold text-amber-600 dark:text-amber-400">{emp.clients_converted || 0}</td>
                    <td className="p-4 whitespace-nowrap font-mono font-bold text-emerald-600 dark:text-emerald-400">${(emp.revenue_brought || 0).toLocaleString()}</td>

                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono">
                        <span title="Instagram Posts" className="px-1.5 py-0.5 rounded bg-pink-100 dark:bg-pink-500/20 text-pink-800 dark:text-pink-300 font-bold border border-pink-300 dark:border-pink-500/30">
                          IG: {emp.instagram_posts || 0}
                        </span>
                        <span title="YouTube Videos" className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-500/30">
                          YT: {emp.youtube_posts || 0}
                        </span>
                        <span title="LinkedIn Posts" className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 font-bold border border-blue-300 dark:border-blue-500/30">
                          LI: {emp.linkedin_posts || 0}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap font-mono font-bold text-cyan-700 dark:text-cyan-400">{emp.active_hours || 0} hrs</td>

                    <td className="p-4 whitespace-nowrap text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        i === 0
                          ? "bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/40"
                          : i === 1
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700"
                          : "bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-300 border-violet-300 dark:border-violet-500/30"
                      }`}>
                        {emp.badge}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VERIFIED SOCIAL PROOFS TAB */}
      {activeTab === "proofs" && (
        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm space-y-4">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Submitted Social Media Campaign Proofs
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Verified with shared Google Drive asset folders for Instagram, YouTube, and LinkedIn campaigns
              </p>
            </div>
            <button
              onClick={() => setShowSubmitProof(true)}
              className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Submit New Proof
            </button>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {socialProofs.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                No social proofs submitted yet. Click &quot;Submit New Proof&quot; to log campaign assets.
              </div>
            ) : (
              socialProofs.map((proof) => (
                <div
                  key={proof.id}
                  className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                        {proof.platform === "instagram" ? (
                          <Instagram className="w-3 h-3 text-pink-500" />
                        ) : proof.platform === "youtube" ? (
                          <Youtube className="w-3 h-3 text-rose-500" />
                        ) : (
                          <Linkedin className="w-3 h-3 text-blue-500" />
                        )}
                        <span>{proof.platform}</span>
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                        {proof.status || "approved"}
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-slate-900 dark:text-white line-clamp-1">{proof.post_title}</h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 font-medium">
                      {proof.submission_notes || "Verified company campaign proof."}
                    </p>

                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                      Submitted by: <strong className="text-slate-900 dark:text-white font-sans">{proof.user_name}</strong>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <a
                      href={proof.google_drive_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-violet-600 dark:hover:text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-emerald-600" /> Google Drive Folder
                    </a>

                    {proof.post_url && (
                      <a
                        href={proof.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        title="Open Live Post"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUBMIT SOCIAL PROOF MODAL (Google Drive Required) */}
      {showSubmitProof && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Submit Social Media Campaign Proof</h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Shared Google Drive URL submission for points calculation</p>
                </div>
              </div>
              <button
                onClick={() => setShowSubmitProof(false)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitProof} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Team Member *</label>
                  <select
                    value={proofUserId}
                    onChange={(e) => setProofUserId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  >
                    {teamUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.first_name} {u.last_name || ""} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Social Platform *</label>
                  <select
                    value={proofPlatform}
                    onChange={(e) => setProofPlatform(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  >
                    <option value="linkedin">LinkedIn Post (+15 pts)</option>
                    <option value="youtube">YouTube Video (+20 pts)</option>
                    <option value="instagram">Instagram Reel/Post (+10 pts)</option>
                    <option value="twitter">X / Twitter (+10 pts)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">Post / Campaign Title *</label>
                <input
                  required
                  type="text"
                  value={proofTitle}
                  onChange={(e) => setProofTitle(e.target.value)}
                  placeholder="e.g. Enterprise Outreach Sprint B2B Demo"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <FolderOpen className="w-3.5 h-3.5" /> Shared Google Drive Proof URL * (Required)
                </label>
                <input
                  required
                  type="url"
                  value={proofDriveUrl}
                  onChange={(e) => setProofDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/your_campaign_folder"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">Live Post Link (Optional)</label>
                <input
                  type="url"
                  value={proofPostUrl}
                  onChange={(e) => setProofPostUrl(e.target.value)}
                  placeholder="https://linkedin.com/posts/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">Campaign Notes / Reach</label>
                <textarea
                  rows={3}
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  placeholder="Describe engagement results, impressions, or client interactions..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSubmitProof(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitProofMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black shadow-md shadow-violet-600/30 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submitProofMutation.isPending ? "Submitting..." : "Submit Proof & Log Points"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
