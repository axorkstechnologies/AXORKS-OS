"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { canAccessRoute } from "@/lib/user-repository";
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
} from "lucide-react";

/** Each nav item knows which route prefix it maps to for RBAC checks */
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
        "hidden md:flex h-screen sticky top-0 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl transition-all duration-300 z-30 flex-col justify-between",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      <div>
        {/* Header / Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative w-8 h-8 flex-shrink-0">
              <img
                src="/images/Axorks_Logo_design_only.png"
                alt="Axorks Symbol"
                className="w-8 h-8 object-contain filter drop-shadow-[0_0_8px_rgba(124,58,237,0.4)]"
              />
            </div>
            {!sidebarCollapsed && (
              <div className="relative w-36 h-8 flex items-center">
                <img
                  src="/images/Axorks_Complete_logo.png"
                  alt="Axorks Technologies"
                  className="w-36 h-8 object-contain object-left"
                />
              </div>
            )}
          </Link>

          <button
            onClick={toggleSidebar}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Items — filtered by RBAC */}
        <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition group",
                  isActive
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/20 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100"
                )}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200")} />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Settings */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800">
        <Link
          href="/settings/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100 transition",
            pathname.startsWith("/settings") && "bg-violet-600 text-white font-semibold"
          )}
          title={sidebarCollapsed ? "Settings" : undefined}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          {!sidebarCollapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
