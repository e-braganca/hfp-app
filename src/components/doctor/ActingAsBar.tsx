"use client";

import { CLINICIANS, clearanceSummary, type Clinician } from "@/lib/doctor/clinicians";

/**
 * Demo control: which prescriber this tab is signed in as, and what that
 * clearance lets them take. In production this is the session — here it's a
 * selector so the shared board can be shown from two sides at once (open a
 * second window and pick a different name; claims are shared, identity isn't).
 */
export function ActingAsBar({
  me,
  onChange,
  holding,
}: {
  me: Clinician;
  onChange: (name: string) => void;
  holding: number;
}) {
  const atLimit = holding >= me.claimLimit;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border border-[var(--divider)] bg-background-paper px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-xs font-bold text-primary-dark">
        {me.initials}
      </span>

      <label className="flex min-w-0 items-center gap-2">
        <span className="sr-only">Signed in as</span>
        <select
          value={me.name}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 max-w-[15rem] rounded-lg border border-[var(--divider)] bg-background-paper px-2.5 text-sm font-bold text-text-primary focus:border-primary focus:outline-none"
        >
          {CLINICIANS.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} — {c.grade}
            </option>
          ))}
        </select>
      </label>

      <p className="min-w-0 flex-1 text-sm text-text-secondary">
        <span className="font-semibold text-text-primary">Cleared for:</span> {clearanceSummary(me)}
      </p>

      <span
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
          atLimit ? "bg-warning-lighter text-warning-darker" : "bg-background-neutral text-text-secondary"
        }`}
      >
        Holding {holding} / {me.claimLimit}
      </span>
    </div>
  );
}
