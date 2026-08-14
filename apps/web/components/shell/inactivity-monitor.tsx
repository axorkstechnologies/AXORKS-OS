"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Employee Inactivity Monitor
 *
 * Monitors mouse, keyboard, scroll, touch, and page visibility events.
 * Internal idle threshold is 5 minutes — this value is NEVER revealed to employees.
 *
 * When idle is detected, shows a warning modal with the exact specified message.
 * Logs idle periods to the activity tracking backend.
 */
const IDLE_THRESHOLD_MS = 300000; // Internal only — never expose to UI
const CHECK_INTERVAL_MS = 10000;

export function InactivityMonitor() {
  const user = useAuthStore((s) => s.user);
  const [isIdle, setIsIdle] = useState(false);
  const lastActivity = useRef<number>(Date.now());
  const idleStartTime = useRef<number | null>(null);
  const monitorInterval = useRef<NodeJS.Timeout | null>(null);

  // Record login session on mount, logout on page close
  useEffect(() => {
    if (!user) return;

    fetch("/api/v1/activity/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "login", user_id: user.id }),
    }).catch(() => {});

    const handleBeforeUnload = () => {
      const data = JSON.stringify({ event: "logout", user_id: user.id });
      navigator.sendBeacon(
        "/api/v1/activity/sessions",
        new Blob([data], { type: "application/json" })
      );
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user]);

  // Activity monitoring loop
  useEffect(() => {
    if (!user) return;

    const logIdlePeriod = () => {
      if (idleStartTime.current) {
        const duration = Math.floor((Date.now() - idleStartTime.current) / 1000);
        fetch("/api/v1/activity/idle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            started_at: new Date(idleStartTime.current).toISOString(),
            duration_seconds: duration,
          }),
        }).catch(() => {});
        idleStartTime.current = null;
      }
    };

    const handleActivity = () => {
      lastActivity.current = Date.now();
      if (isIdle) {
        setIsIdle(false);
        logIdlePeriod();
      }
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "focus",
      "visibilitychange",
    ];
    events.forEach((evt) => window.addEventListener(evt, handleActivity));

    monitorInterval.current = setInterval(() => {
      if (!isIdle && Date.now() - lastActivity.current >= IDLE_THRESHOLD_MS) {
        setIsIdle(true);
        idleStartTime.current = lastActivity.current;
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      if (monitorInterval.current) clearInterval(monitorInterval.current);
    };
  }, [user, isIdle]);

  // Don't render anything unless idle is detected
  if (!isIdle) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="glass p-8 rounded-2xl border border-amber-500/30 shadow-2xl shadow-amber-900/20 max-w-md w-full flex flex-col items-center text-center mx-4">
        {/* Warning Icon */}
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>

        <h2 className="text-lg font-bold text-slate-100 mb-4">Inactivity Detected</h2>

        {/* EXACT message — do not modify */}
        <p className="text-sm text-slate-300 leading-relaxed mb-8">
          You have been inactive for a while. Continued inactivity will affect
          your performance. Note: Your screen is being recorded and your
          performance is being measured by KPIs.
        </p>

        <button
          onClick={() => {
            lastActivity.current = Date.now();
            setIsIdle(false);
            if (idleStartTime.current) {
              const duration = Math.floor(
                (Date.now() - idleStartTime.current) / 1000
              );
              fetch("/api/v1/activity/idle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  user_id: user?.id,
                  started_at: new Date(idleStartTime.current).toISOString(),
                  duration_seconds: duration,
                }),
              }).catch(() => {});
              idleStartTime.current = null;
            }
          }}
          className="w-full py-3 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-600/30 transition"
        >
          I&apos;m Back
        </button>
      </div>
    </div>
  );
}
