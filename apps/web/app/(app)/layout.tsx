"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { CommandPalette } from "@/components/shell/command-palette";
import { NotificationsPanel } from "@/components/shell/notifications-panel";
import { KeyboardShortcuts } from "@/components/shell/keyboard-shortcuts";
import { PWARegister } from "@/components/shell/pwa-register";
import { MobileNav } from "@/components/shell/mobile-nav";
import { InactivityMonitor } from "@/components/shell/inactivity-monitor";
import { Lock, ShieldAlert } from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, accessToken, logout, _hasHydrated, setHasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Fast-check: if Zustand persist has already hydrated, mark true immediately
    if (useAuthStore.persist?.hasHydrated()) {
      setHasHydrated(true);
    } else {
      const unsub = useAuthStore.persist?.onFinishHydration(() => {
        setHasHydrated(true);
      });
      // Fail-safe timer: ensure hydration lock NEVER hangs past 150ms
      const timer = setTimeout(() => {
        setHasHydrated(true);
      }, 150);

      return () => {
        if (unsub) unsub();
        clearTimeout(timer);
      };
    }
  }, [setHasHydrated]);

  // Immediate redirect check once mounted & hydrated
  useEffect(() => {
    if (mounted && _hasHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [mounted, _hasHydrated, isAuthenticated, router]);

  // Real-Time Account Suspension Check (Polls every 5s for active session verification)
  useEffect(() => {
    if (!mounted || !_hasHydrated || !isAuthenticated || !accessToken) return;

    const checkSuspensionStatus = async () => {
      try {
        const res = await fetch("/api/v1/auth/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.status === 403) {
          const data = await res.json().catch(() => ({}));
          const message = data?.errors?.[0]?.message || "";

          if (message.includes("Restricted by Founder") || data?.status === "suspended") {
            setIsSuspended(true);
            setTimeout(() => {
              logout();
              router.replace("/login?reason=suspended");
            }, 2500);
          }
        }
      } catch (err) {
        // Network error retry on next cycle
      }
    };

    checkSuspensionStatus();
    const interval = setInterval(checkSuspensionStatus, 5000);
    return () => clearInterval(interval);
  }, [mounted, _hasHydrated, isAuthenticated, accessToken, logout, router]);

  // Show loading spinner while verifying session on mount
  if (!mounted || !_hasHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Verifying Axorks OS Authentication...</p>
        </div>
      </div>
    );
  }

  // Full-Screen Instant Force Logout Modal for Suspended Accounts
  if (isSuspended) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass p-8 rounded-3xl border border-rose-500/40 shadow-2xl shadow-rose-950/80 text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 rounded-full bg-rose-500/10 border-2 border-rose-500/40 flex items-center justify-center mx-auto text-rose-500 shadow-xl shadow-rose-500/20">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-rose-500" /> Restricted by Founder
            </h1>
            <p className="text-sm text-slate-300 font-medium">
              Your account access has been suspended immediately by the Founder. Active session terminated.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 font-mono">
            Status: <span className="text-rose-400 font-bold uppercase">SUSPENDED</span> • Logging out...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="flex-1 p-4 md:p-6 relative pb-20 md:pb-6">
          <NotificationsPanel />
          {children}
        </main>
      </div>

      <CommandPalette />
      <KeyboardShortcuts />
      <MobileNav />
      <PWARegister />
      {/* Employee inactivity detection — monitors mouse/keyboard/focus activity */}
      <InactivityMonitor />
    </div>
  );
}
