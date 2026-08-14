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

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated, setHasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

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
