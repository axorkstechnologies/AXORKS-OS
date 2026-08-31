/**
 * Axorks OS — RBAC & Route Permission Utilities (Client & Server Safe)
 */

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  Founder: ["*"],
  "Co-Founder": ["*"],
  Admin: ["*"],
  "Marketing & Outreach": [
    "dashboard:read",
    "leads:read",
    "leads:write",
    "leads:delete",
    "marketing:read",
    "marketing:write",
    "email:read",
    "email:write",
    "knowledge:read",
    "settings:read",
    "settings:write:own",
  ],
  "Software Engineer": [
    "dashboard:read",
    "projects:read",
    "projects:write",
    "dev:read",
    "dev:write",
    "knowledge:read",
    "knowledge:write",
    "settings:read",
    "settings:write:own",
  ],
  Viewer: [
    "dashboard:read",
  ],
};

export const ROUTE_PERMISSIONS: Record<string, string> = {
  "/": "dashboard:read",
  "/leads": "leads:read",
  "/crm": "crm:read",
  "/proposals": "proposals:read",
  "/projects": "projects:read",
  "/dev": "dev:read",
  "/email": "email:read",
  "/messages": "dashboard:read",
  "/finance": "finance:read",
  "/hr": "hr:read",
  "/iam": "iam:read",
  "/knowledge": "knowledge:read",
  "/marketing": "marketing:read",
  "/recruitment": "recruitment:read",
  "/analytics": "analytics:read",
  "/automations": "automations:read",
  "/integrations": "integrations:read",
  "/settings": "settings:read",
  "/portal": "portal:read",
};

export function hasPermission(role: string, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

export function canAccessRoute(role: string, pathname: string): boolean {
  if (hasPermission(role, "*")) return true;

  const matchingRoutes = Object.keys(ROUTE_PERMISSIONS)
    .filter((route) => route !== "/" && pathname.startsWith(route))
    .sort((a, b) => b.length - a.length);

  if (matchingRoutes.length > 0) {
    const requiredPerm = ROUTE_PERMISSIONS[matchingRoutes[0]];
    return hasPermission(role, requiredPerm);
  }

  if (pathname === "/") return true;
  return false;
}

export function isFounderOrAdmin(role: string): boolean {
  return ["Founder", "Co-Founder", "Admin"].includes(role);
}
