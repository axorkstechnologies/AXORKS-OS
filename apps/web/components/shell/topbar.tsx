"use client";

import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { Search, Bell, Crown, LogOut } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Breadcrumbs } from "./breadcrumbs";
import Link from "next/link";
import { logout } from "@/lib/auth";

export function Topbar() {
  const { setCommandPaletteOpen, toggleNotifications } = useUIStore();
  const user = useAuthStore((s) => s.user);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Action icons, Search & User profile */}
      <div className="flex items-center gap-3">
        {/* Cmd+K trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search or command...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-500">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={toggleNotifications}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500" />
        </button>

        {/* Dark/Light mode toggle */}
        <ThemeToggle />

        {/* Active User Profile Pill */}
        {user && (
          <div className="pl-2 border-l border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <Link href="/settings/profile" className="flex items-center gap-2 group">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.first_name}
                  className="w-8 h-8 rounded-full object-cover border border-violet-500/40 shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {user.first_name?.[0] || "A"}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px] flex items-center gap-1">
                  {user.first_name} {user.last_name}
                  {user.role === "Founder" && <Crown className="w-3 h-3 text-amber-400" />}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{user.role}</div>
              </div>
            </Link>

            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
