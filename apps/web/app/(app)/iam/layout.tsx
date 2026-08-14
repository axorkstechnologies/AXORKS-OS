"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  KeyRound,
  Building2,
  Video,
  FileCheck2,
  Crown,
  Activity,
} from "lucide-react";

const IAM_TABS = [
  { name: "Overview", href: "/iam", icon: LayoutDashboard },
  { name: "Employees", href: "/iam/users", icon: Users },
  { name: "Roles & Permissions", href: "/iam/roles", icon: KeyRound },
  { name: "Departments", href: "/iam/departments", icon: Building2 },
  { name: "Activity Monitor", href: "/iam/activity", icon: Activity },
  { name: "Screen & Call Studio", href: "/iam/recordings", icon: Video },
  { name: "Audit Logs", href: "/iam/audit", icon: FileCheck2 },
];

export default function IAMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top IAM Header Banner */}
      <div className="glass p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-bold tracking-tight">
                Enterprise IAM & Governance
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Crown className="w-3 h-3 text-amber-500" /> Founder Supreme
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Identity, access controls, employee profiles, screen recordings & audit logs
            </p>
          </div>
        </div>
      </div>

      {/* Touch-Friendly Mobile Horizontal Scroll Bar */}
      <div className="overflow-x-auto pb-1 no-scrollbar border-b border-slate-200 dark:border-slate-800">
        <nav className="flex items-center gap-1.5 min-w-max">
          {IAM_TABS.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href !== "/iam" && pathname.startsWith(tab.href));
            const Icon = tab.icon;

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/20 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab Page Content */}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
