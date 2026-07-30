"use client";

import type { ReactNode } from "react";
import { NAV_BY_ROLE, type Role } from "@/lib/nav";
import { AppMobileNav } from "./AppMobileNav";
import { AppSidebar } from "./AppSidebar";

/**
 * Role shell: dark sidebar (lg+) / bottom tab bar (below lg) + content area.
 * Layouts (Server Components) pass only a `role` string — the NavConfig (which
 * holds icon components) is resolved here in client-land, so no functions cross
 * the server→client boundary.
 */
export function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  const config = NAV_BY_ROLE[role];
  return (
    <div className="min-h-screen bg-background-neutral">
      <AppSidebar config={config} role={role} />
      <AppMobileNav config={config} />
      <div className="lg:pl-[264px]">
        <div className="pb-20 lg:pb-0">{children}</div>
      </div>
    </div>
  );
}
