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
  const [sessionVerified, setSessionVerified] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (useAuthStore.persist?.hasHydrated()) {
      setHasHydrated(true);
    } else {
      const unsub = useAuthStore.persist?.onFinishHydration(() => {
        setHasHydrated(true);
      });
      const timer = setTimeout(() => {
        setHasHydrated(true);
      }, 100);

      return () => {
        if (unsub) unsub();
        clearTimeout(timer);
      };
    }
  }, [setHasHydrated]);

  // Server-side cryptographic token verification on mount
  useEffect(() => {
    if (!mounted || !_hasHydrated) return;

    if (!isAuthenticated || !accessToken) {
      router.replace("/login");
      return;
    }

    let isCancelled = false;

    const verifyServerSession = async () => {
      try {
        const res = await fetch("/api/v1/auth/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.status === 401) {
          // Token is forged, old format, or invalid
          if (!isCancelled) {
            logout();
            router.replace("/login?reason=session_expired");
          }
          return;
        }

        if (res.status === 403) {
          // Account suspended by Founder
          if (!isCancelled) {
            setIsSuspended(true);
            setTimeout(() => {
              logout();
              router.replace("/login?reason=suspended");
            }, 2500);
          }
          return;
        }

        if (res.ok) {
          if (!isCancelled) {
            setSessionVerified(true);
          }
        }
      } catch (err) {
        // Network error retry or fallback
        if (!isCancelled) {
          setSessionVerified(true);
        }
      }
    };

    verifyServerSession();

    // Poll every 5 seconds for real-time instant suspension enforcement
    const interval = setInterval(verifyServerSession, 5000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [mounted, _hasHydrated, isAuthenticated, accessToken, logout, router]);

  // Show loading spinner while verifying cryptographic session with Neon DB
  if (!mounted || !_hasHydrated || !isAuthenticated || !sessionVerified) {
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Verifying Axorks OS Authentication...</p>
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
      <InactivityMonitor />
    </div>
  );
}
