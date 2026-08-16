"use client";

import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { Search, Bell, Crown, LogOut, Sparkles, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Breadcrumbs } from "./breadcrumbs";
import Link from "next/link";
import { logout } from "@/lib/auth";

export function Topbar() {
  const { setCommandPaletteOpen, toggleNotifications } = useUIStore();
  const user = useAuthStore((s) => s.user);

  return (
    <header className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-slate-950/75 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Action icons, Search & User profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Live System Indicator */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 status-pulse" />
          <span>Neon DB Live</span>
        </div>

        {/* Cmd+K Search trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-violet-500/40 dark:hover:border-violet-500/40 transition-all duration-150 shadow-2xs"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search or command...</span>
          <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-[10px] font-mono font-semibold text-slate-500">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={toggleNotifications}
          aria-label="Notifications"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500 ring-2 ring-white dark:ring-slate-950" />
        </button>

        {/* Dark/Light mode toggle */}
        <ThemeToggle />

        {/* Active User Profile Pill */}
        {user && (
          <div className="pl-2 border-l border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Link
              href="/settings/profile"
              className="flex items-center gap-2.5 p-1 pr-2.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-900/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all group"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.first_name}
                  className="w-8 h-8 rounded-lg object-cover border border-violet-500/40 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user.first_name?.[0] || "A"}
                </div>
              )}
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[130px] flex items-center gap-1">
                  <span>{user.first_name} {user.last_name}</span>
                  {user.role === "Founder" && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[120px]">{user.role}</div>
              </div>
            </Link>

            <button
              onClick={() => logout()}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
