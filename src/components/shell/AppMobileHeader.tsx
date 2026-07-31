"use client";

import Link from "next/link";
import type { NavConfig, Role } from "@/lib/nav";
import { ProfileMenu } from "./ProfileMenu";

/**
 * Mobile top bar (below lg): logo left, account menu right. Deliberately not
 * sticky — it scrolls away so each page's own sticky PageHeader takes the top.
 * Pairs with AppMobileNav (bottom tabs); the desktop rail replaces both.
 */
export function AppMobileHeader({ config, role }: { config: NavConfig; role: Role }) {
  return (
    <header className="flex h-14 items-center justify-between bg-primary-dark px-4 lg:hidden">
      <Link href={ROLE_HOME[role]} aria-label="Home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-white.svg" alt={config.brand} className="h-4 w-auto" />
      </Link>
      <ProfileMenu config={config} role={role} variant="topbar" />
    </header>
  );
}

const ROLE_HOME: Record<Role, string> = {
  patient: "/patient",
  doctor: "/doctor/queue",
  admin: "/admin/overview",
  pharmacy: "/pharmacy",
};
