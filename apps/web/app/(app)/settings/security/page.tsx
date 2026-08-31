"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  Plus,
  Clock,
  Ban,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function SecuritySettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isFounder = user?.role === "Founder" || user?.email === "mujahidaryan222149@gmail.com";

  const [newIpToBlock, setNewIpToBlock] = useState("");

  const { data: blockedIpsResponse, isLoading, refetch } = useQuery<{
    success: boolean;
    data: any[];
  }>({
    queryKey: ["blocked-ips"],
    queryFn: () => apiClient("/api/v1/iam/security/blocked-ips"),
    enabled: isFounder,
  });

  const blockedIps = blockedIpsResponse?.data || [];

  const unblockMutation = useMutation({
    mutationFn: (ip: string) =>
      apiClient("/api/v1/iam/security/blocked-ips", {
        method: "POST",
        body: JSON.stringify({ ip, action: "unblock" }),
      }),
    onSuccess: (res) => {
      toast.success(res?.message || "IP unblocked successfully");
      queryClient.invalidateQueries({ queryKey: ["blocked-ips"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to unblock IP");
    },
  });

  const blockMutation = useMutation({
    mutationFn: (ip: string) =>
      apiClient("/api/v1/iam/security/blocked-ips", {
        method: "POST",
        body: JSON.stringify({ ip, action: "block" }),
      }),
    onSuccess: (res) => {
      toast.success(res?.message || "IP blocked successfully");
      setNewIpToBlock("");
      queryClient.invalidateQueries({ queryKey: ["blocked-ips"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to block IP");
    },
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-500" /> Security & Access Sentinel
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Automated IP brute-force protection, lockout enforcement, session security, and access control
        </p>
      </div>

      {/* Sentinel Rules Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
            <Clock className="w-4 h-4" /> Tier 1: 10-Min Lockout
          </div>
          <p className="text-xs text-slate-300">
            Triggered automatically after <strong>3 failed login attempts</strong> from the same IP.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-2">
          <div className="flex items-center gap-2 text-orange-500 font-bold text-xs">
            <AlertTriangle className="w-4 h-4" /> Tier 2: 45-Min Lockout
          </div>
          <p className="text-xs text-slate-300">
            Triggered automatically after <strong>6 failed login attempts</strong> from the same IP.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
            <Ban className="w-4 h-4" /> Tier 3: Permanent Block
          </div>
          <p className="text-xs text-slate-300">
            Triggered after <strong>9+ failures</strong>. Locked permanently until manually unblocked by Founder.
          </p>
        </div>
      </div>

      {/* Founder Blocked IPs Management Console */}
      {isFounder ? (
        <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-4 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-violet-400" /> Blocked & Locked IP Addresses
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review suspicious IPs locked by the Sentinel or permanently blocked
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
          </div>

          {/* Add IP Block Manually */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="Enter IP to block permanently (e.g. 203.0.113.42)..."
              value={newIpToBlock}
              onChange={(e) => setNewIpToBlock(e.target.value)}
              className="w-full sm:w-80 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition font-mono"
            />
            <button
              onClick={() => {
                if (newIpToBlock.trim()) {
                  blockMutation.mutate(newIpToBlock.trim());
                }
              }}
              disabled={!newIpToBlock.trim() || blockMutation.isPending}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Ban className="w-3.5 h-3.5" /> Block IP
            </button>
          </div>

          {/* Blocked IPs Table */}
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-violet-500" /> Loading security records...
            </div>
          ) : blockedIps.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-200">No Blocked or Locked IP Addresses</p>
              <p className="text-slate-500 text-[11px]">All incoming traffic is within normal security parameters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Failed Attempts</th>
                    <th className="p-3">Status / Lockout</th>
                    <th className="p-3">Targeted Account</th>
                    <th className="p-3">Last Failed Time</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {blockedIps.map((record: any) => {
                    const isPermanent = record.is_permanent;
                    const isLocked = record.locked_until && new Date(record.locked_until) > new Date();

                    return (
                      <tr key={record.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-mono font-bold text-slate-200">
                          {record.ip_address}
                        </td>
                        <td className="p-3 font-mono text-rose-400 font-bold">
                          {record.failed_attempts}
                        </td>
                        <td className="p-3">
                          {isPermanent ? (
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                              Permanent Block
                            </span>
                          ) : isLocked ? (
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Locked until {new Date(record.locked_until).toLocaleTimeString()}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-700/30 text-slate-400 border border-slate-700">
                              Suspicious Activity ({record.failed_attempts} fails)
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-300">
                          {record.last_attempted_identifier || "—"}
                        </td>
                        <td className="p-3 text-slate-400 text-[11px]">
                          {record.last_failed_at ? new Date(record.last_failed_at).toLocaleString() : "—"}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => unblockMutation.mutate(record.ip_address)}
                            disabled={unblockMutation.isPending}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition disabled:opacity-50 inline-flex items-center gap-1.5"
                          >
                            <Unlock className="w-3 h-3" /> Unblock IP
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
          <p className="font-semibold text-slate-200">Security Sentinel Active</p>
          <p className="mt-1">
            IP brute-force protection and account access monitoring are enforced automatically by the server.
          </p>
        </div>
      )}
    </div>
  );
}
