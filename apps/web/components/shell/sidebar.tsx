"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { canAccessRoute } from "@/lib/rbac";
import { logout } from "@/lib/auth";
import {
  LayoutDashboard,
  Target,
  Users,
  FileText,
  FolderKanban,
  Code2,
  Receipt,
  BookOpen,
  Megaphone,
  UserCheck,
  Building2,
  Zap,
  BarChart3,
  Plug,
  Mail,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LogOut,
  Sparkles,
} from "lucide-react";

/** Navigation items mapping to system domains with RBAC permissions */
const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, routePrefix: "/" },
  { name: "User Management & IAM", href: "/iam", icon: ShieldCheck, routePrefix: "/iam" },
  { name: "Leads", href: "/leads", icon: Target, routePrefix: "/leads" },
  {
    name: "CRM",
    href: "/crm/companies",
    icon: Users,
    routePrefix: "/crm",
    children: [
      { name: "Companies", href: "/crm/companies", icon: Building2 },
      { name: "Contacts", href: "/crm/contacts", icon: UserCheck },
      { name: "Deals", href: "/crm/deals", icon: Receipt },
    ],
  },
  { name: "Email Center", href: "/email", icon: Mail, routePrefix: "/email" },
  { name: "Proposals", href: "/proposals", icon: FileText, routePrefix: "/proposals" },
  { name: "Projects", href: "/projects", icon: FolderKanban, routePrefix: "/projects" },
  { name: "Dev Hub", href: "/dev", icon: Code2, routePrefix: "/dev" },
  { name: "Finance", href: "/finance", icon: Receipt, routePrefix: "/finance" },
  { name: "Knowledge", href: "/knowledge", icon: BookOpen, routePrefix: "/knowledge" },
  { name: "Marketing", href: "/marketing", icon: Megaphone, routePrefix: "/marketing" },
  { name: "Recruitment", href: "/recruitment", icon: UserCheck, routePrefix: "/recruitment" },
  { name: "HR", href: "/hr", icon: Building2, routePrefix: "/hr" },
  { name: "Automations", href: "/automations", icon: Zap, routePrefix: "/automations" },
  { name: "Analytics", href: "/analytics", icon: BarChart3, routePrefix: "/analytics" },
  { name: "Integrations", href: "/integrations", icon: Plug, routePrefix: "/integrations" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role || "Viewer";

  // Filter nav items based on user's role permissions
  const visibleItems = NAV_ITEMS.filter((item) =>
    canAccessRoute(userRole, item.routePrefix)
  );

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen sticky top-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl transition-all duration-300 z-30 flex-col justify-between select-none shadow-sm",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex flex-col h-full min-h-0">
        {/* Header / Single Brand Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
          <Link href="/" className="flex items-center overflow-hidden group">
            {sidebarCollapsed ? (
              <div className="relative w-9 h-9 flex-shrink-0 mx-auto transition-transform duration-200 group-hover:scale-105">
                <img
                  src="/images/Axorks_Logo_design_only.png"
                  alt="Axorks Symbol"
                  className="w-9 h-9 object-contain filter drop-shadow-[0_0_10px_rgba(124,58,237,0.5)]"
                />
              </div>
            ) : (
              <div className="relative w-40 h-9 flex items-center transition-opacity duration-200">
                <img
                  src="/images/Axorks_Complete_logo.png"
                  alt="Axorks Technologies"
                  className="w-40 h-9 object-contain object-left filter drop-shadow-[0_0_8px_rgba(124,58,237,0.3)]"
                />
              </div>
            )}
          </Link>

          <button
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Items — filtered by RBAC */}
        <nav className="p-2.5 space-y-1 overflow-y-auto flex-1 custom-scroll">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 relative group",
                  isActive
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/90 dark:hover:bg-slate-900/90 hover:text-slate-900 dark:hover:text-slate-100"
                )}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-violet-500 dark:group-hover:text-violet-400"
                  )}
                />
                {!sidebarCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
                {isActive && !sidebarCollapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Settings & Explicit Logout */}
      <div className="p-2.5 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1 shrink-0 bg-slate-50/50 dark:bg-slate-950/50">
        <Link
          href="/settings/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100 transition",
            pathname.startsWith("/settings") && "bg-violet-600 text-white font-semibold shadow-md shadow-violet-600/20"
          )}
          title={sidebarCollapsed ? "Settings" : undefined}
        >
          <Settings className="w-4 h-4 text-slate-400 shrink-0" />
          {!sidebarCollapsed && <span className="font-medium">Settings</span>}
        </Link>

        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition"
          title={sidebarCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
          {!sidebarCollapsed && <span className="font-semibold text-rose-600 dark:text-rose-400">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
