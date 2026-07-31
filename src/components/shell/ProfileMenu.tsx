"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { NAV_BY_ROLE, type NavConfig, type Role } from "@/lib/nav";

const ROLE_HOME: Record<Role, string> = {
  patient: "/patient",
  doctor: "/doctor/queue",
  admin: "/admin/overview",
  pharmacy: "/pharmacy",
};
const ROLE_LABEL: Record<Role, string> = {
  patient: "Patient",
  doctor: "Doctor",
  admin: "Admin",
  pharmacy: "Pharmacy",
};

/**
 * Identity trigger + profile pop-up (switch profile, profile, settings,
 * logout). Two variants of the same menu:
 *  - "sidebar": full-width identity box in the desktop rail, panel opens up
 *  - "topbar": compact avatar in the mobile header, panel opens down-right
 */
export function ProfileMenu({
  config,
  role,
  variant,
}: {
  config: NavConfig;
  role: Role;
  variant: "sidebar" | "topbar";
}) {
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

  const panel = (
    <div
      className={`absolute z-50 w-60 rounded-xl bg-background-paper py-2 text-text-primary shadow-dropdown ${
        variant === "sidebar" ? "bottom-full left-0 mb-2" : "right-0 top-full mt-2"
      }`}
    >
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
  );

  return (
    <div ref={rootRef} className={variant === "sidebar" ? "relative m-3" : "relative"}>
      {open && panel}
      {variant === "sidebar" ? (
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
      ) : (
        <button
          type="button"
          onClick={() => (open ? close() : setOpen(true))}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account menu"
          className={`flex items-center gap-1.5 rounded-full p-1 transition-colors ${open ? "bg-white/20" : "hover:bg-white/10"}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-light/30 text-[11px] font-bold text-white">
            {config.identity.initials}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="mr-0.5 text-white/60">
            <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
