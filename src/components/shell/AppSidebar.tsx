"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BellIcon, NAV_BY_ROLE, type NavConfig, type NavItem, type Role } from "@/lib/nav";

/**
 * Config-driven desktop sidebar (lg+). Shared by every role — pass the role's
 * NavConfig. Dark sage rail with grouped nav, optional therapy-area list,
 * notifications, and an identity footer that opens the profile menu.
 */
export function AppSidebar({ config, role }: { config: NavConfig; role: Role }) {
  const pathname = usePathname();
  const isActive = (item: NavItem) =>
    pathname === item.href ||
    pathname.startsWith(item.href + "/") ||
    (item.match?.some((m) => pathname.startsWith(m)) ?? false);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col bg-primary-dark text-white lg:flex">
      <div className="px-6 pb-4 pt-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-white.svg" alt={config.brand} className="h-5 w-auto" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {config.groups.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? "mt-6" : ""}>
            <GroupLabel>{group.label}</GroupLabel>
            {group.items.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-white/15 font-semibold text-white"
                      : "font-medium text-grey-500 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        active ? "bg-white/25 text-white" : "bg-white/15 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {config.therapyAreas && (
          <div className="mt-6">
            <GroupLabel>Therapy areas</GroupLabel>
            {config.therapyAreas.map((t) => (
              <div
                key={t.label}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                  t.live ? "text-white/90" : "text-white/35"
                }`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${t.live ? "bg-secondary-light" : "bg-white/25"}`} />
                <span className="flex-1 truncate">{t.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    t.live ? "bg-secondary-light/20 text-secondary-light" : "bg-white/10 text-white/40"
                  }`}
                >
                  {t.live ? "Live" : "Soon"}
                </span>
              </div>
            ))}
          </div>
        )}
      </nav>

      {config.notificationsBadge && (
        <button
          type="button"
          className="mx-3 mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-grey-500 transition-colors hover:bg-white/5 hover:text-white"
        >
          <BellIcon />
          <span className="flex-1 text-left">Notifications</span>
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold">
            {config.notificationsBadge}
          </span>
        </button>
      )}

      <ProfileMenu config={config} role={role} />
    </aside>
  );
}

const ROLE_HOME: Record<Role, string> = {
  patient: "/patient",
  doctor: "/doctor/queue",
  admin: "/admin/overview",
};
const ROLE_LABEL: Record<Role, string> = {
  patient: "Patient",
  doctor: "Doctor",
  admin: "Admin",
};

/** Identity footer + the pop-up it opens (profile, switch profile, logout). */
function ProfileMenu({ config, role }: { config: NavConfig; role: Role }) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // closing always collapses the switch-profile submenu too
  const close = () => {
    setOpen(false);
    setSwitching(false);
  };

  // click-outside / Escape close
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemCls =
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-text-primary hover:bg-background-neutral";

  return (
    <div ref={rootRef} className="relative m-3">
      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-60 rounded-xl bg-background-paper py-2 text-text-primary shadow-dropdown">
          {/* header */}
          <div className="flex items-center gap-3 px-4 pb-3 pt-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-xs font-bold text-primary-dark">
              {config.identity.initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{config.identity.name}</span>
              <span className="block truncate text-xs text-text-secondary">{config.identity.role}</span>
            </span>
          </div>

          {/* switch profile */}
          <div className="border-y border-[var(--divider)] px-2 py-1.5">
            <button type="button" onClick={() => setSwitching((v) => !v)} className={itemCls}>
              <span className="flex-1">Switch Profile</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className={`text-text-disabled transition-transform ${switching ? "rotate-90" : ""}`}
              >
                <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {switching &&
              (Object.keys(NAV_BY_ROLE) as Role[]).map((r) => (
                <Link
                  key={r}
                  href={ROLE_HOME[r]}
                  onClick={close}
                  className={`${itemCls} ${r === role ? "pointer-events-none opacity-50" : ""} pl-6`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background-neutral text-[10px] font-bold text-text-secondary">
                    {NAV_BY_ROLE[r].identity.initials}
                  </span>
                  <span className="flex-1 truncate">{ROLE_LABEL[r]} · {NAV_BY_ROLE[r].identity.name}</span>
                  {r === role && <span className="text-[10px] font-bold uppercase text-text-disabled">now</span>}
                </Link>
              ))}
          </div>

          {/* profile / settings */}
          <div className="px-2 py-1.5">
            <button type="button" className={itemCls}>Profile</button>
            <button type="button" className={itemCls}>Settings</button>
          </div>

          {/* logout */}
          <div className="border-t border-[var(--divider)] px-2 pt-1.5">
            <Link
              href={config.identity.signOutHref}
              onClick={close}
              className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-bold text-error hover:bg-error-lighter"
            >
              Logout
            </Link>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
          open ? "bg-white/20" : "bg-white/10 hover:bg-white/15"
        }`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-light/30 text-xs font-bold text-white">
          {config.identity.initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{config.identity.name}</span>
          <span className="block truncate text-[11px] text-white/60">{config.identity.role}</span>
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-white/50">
          <path d="m7 14 5-5 5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
      {children}
    </p>
  );
}
