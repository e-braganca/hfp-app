"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { Role } from "@/lib/nav";

/* ============================================================================
   Notifications, as a drawer rather than a page — they're a glance, not a
   destination, and every one of them ends by sending you somewhere else.
   Seeded per role: a prescriber hears about their own cases, an admin about
   the panel and the pharmacies.
   ============================================================================ */

type Tone = "urgent" | "action" | "info";

interface Notification {
  id: string;
  tone: Tone;
  title: string;
  body: string;
  when: string;
  href: string;
}

const BY_ROLE: Record<Role, Notification[]> = {
  doctor: [
    { id: "d1", tone: "urgent", title: "PT-4465 scored Red", body: "BMI 26.1 — below the Rule 1.1 floor with no qualifying comorbidity.", when: "8 min ago", href: "/doctor/queue" },
    { id: "d2", tone: "action", title: "Senior review returned PT-2087", body: "Dr. Eleanor Hart sent guidance on the 7-week gap — back in your queue.", when: "1 h ago", href: "/doctor/queue" },
    { id: "d3", tone: "action", title: "Patient replied — PT-4455", body: "Tom Bright uploaded a new live weight photo after your request.", when: "3 h ago", href: "/doctor/requests" },
    { id: "d4", tone: "info", title: "Willowbrook SOP updated to v3.2", body: "Rule 4.3 re-titration threshold unchanged; Rule 2.2 wording clarified.", when: "Yesterday", href: "/doctor/pharmacies" },
    { id: "d5", tone: "info", title: "Your SOP compliance is 99%", body: "Above the 90% target for the sixth month running.", when: "2 days ago", href: "/doctor/compliance" },
  ],
  admin: [
    { id: "a1", tone: "urgent", title: "4 escalations waiting", body: "Longest has been open 1 day — PT-2043, no weight loss at 6 months.", when: "Now", href: "/admin/escalations" },
    { id: "a2", tone: "urgent", title: "CarePoint Online at 83% compliance", body: "Below the 90% target — review overrides with the pharmacy.", when: "2 h ago", href: "/admin/pharmacies" },
    { id: "a3", tone: "action", title: "New pharmacy application", body: "A partner submitted their SOP for review.", when: "5 h ago", href: "/admin/pharmacies" },
    { id: "a4", tone: "action", title: "Dr. Hannah Cole finished onboarding", body: "Awaiting the certification exam before her queue opens.", when: "Yesterday", href: "/admin/doctors" },
    { id: "a5", tone: "info", title: "16 requests decided this week", body: "56% approved, 3 declined on clinical grounds.", when: "Yesterday", href: "/admin/requests" },
  ],
  patient: [],
  pharmacy: [],
};

const TONE: Record<Tone, { dot: string; label: string }> = {
  urgent: { dot: "bg-error", label: "Needs attention" },
  action: { dot: "bg-warning", label: "For you" },
  info: { dot: "bg-grey-400", label: "Update" },
};

export function NotificationsDrawer({
  open,
  role,
  onClose,
}: {
  open: boolean;
  role: Role;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const items = BY_ROLE[role];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close notifications"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-primary-darker/40"
      />

      <aside
        role="dialog"
        aria-label="Notifications"
        className="relative flex h-full w-full max-w-[min(100vw,420px)] flex-col bg-background-neutral shadow-dialog"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 bg-gradient-to-r from-primary-darker via-primary-dark to-primary px-5 py-4 text-white">
          <div>
            <h2 className="text-base font-bold">Notifications</h2>
            <p className="text-xs text-white/70">{items.length} in the last few days</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="px-2 py-10 text-center text-sm text-text-secondary">Nothing new right now.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    onClick={onClose}
                    className="block rounded-lg bg-background-paper p-4 shadow-card transition-shadow hover:shadow-dialog"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${TONE[n.tone].dot}`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                        {TONE[n.tone].label}
                      </span>
                      <span className="ml-auto text-[11px] text-text-disabled">{n.when}</span>
                    </span>
                    <span className="mt-1.5 block text-sm font-bold text-text-primary">{n.title}</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-text-secondary">{n.body}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="shrink-0 border-t border-[var(--divider)] bg-background-paper px-5 py-3">
          <p className="text-xs text-text-secondary">
            Clinical alerts also reach you by email — this list never replaces the queue.
          </p>
        </footer>
      </aside>
    </div>
  );
}
