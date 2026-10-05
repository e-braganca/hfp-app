"use client";

import { useState } from "react";
import { usePlatformSettings } from "./boardClockHooks";
import { ClockIcon } from "./WaitFlag";
import { resetPlatformSettings, setPlatformSettings } from "@/lib/admin/platform-settings";

/* ============================================================================
   Waiting-flag thresholds.

   Sits on the queue rather than behind a settings page because the person who
   notices the numbers are wrong is the person reading the flags. Writing
   through the platform-settings store means every open tab — and the Oversight
   list — repaints immediately, with no deploy.
   ============================================================================ */

export function ThresholdSettings() {
  const s = usePlatformSettings();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--divider)] px-2.5 py-1.5 text-xs font-bold text-text-secondary hover:bg-background-neutral hover:text-text-primary"
      >
        <ClockIcon />
        Flag after {s.waitAmberHours}h / {s.waitRedHours}h
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close thresholds"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-[var(--divider)] bg-background-paper p-4 shadow-dialog">
            <p className="text-sm font-bold text-text-primary">Waiting-flag thresholds</p>
            <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
              How long a case may sit unclaimed before the board says so. An operational setting — it never affects
              a case&rsquo;s clinical Auto-Score.
            </p>

            <div className="mt-3 space-y-3">
              <Field
                label="Amber after"
                value={s.waitAmberHours}
                onChange={(waitAmberHours) => setPlatformSettings({ waitAmberHours })}
              />
              <Field
                label="Red after"
                value={s.waitRedHours}
                onChange={(waitRedHours) => setPlatformSettings({ waitRedHours })}
              />
            </div>

            <button
              type="button"
              onClick={resetPlatformSettings}
              className="mt-3 text-xs font-bold text-primary hover:underline"
            >
              Reset to 12h / 24h
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm text-text-primary">{label}</span>
      <span className="flex items-center gap-1.5">
        <input
          type="number"
          min={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 rounded-lg border border-[var(--divider)] px-2.5 py-1.5 text-sm font-bold text-text-primary"
        />
        <span className="text-xs text-text-secondary">hours</span>
      </span>
    </label>
  );
}
