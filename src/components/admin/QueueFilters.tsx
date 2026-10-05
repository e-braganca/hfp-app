"use client";

import { useState } from "react";
import { usePlatformSettings } from "./boardClockHooks";
import { ClockIcon } from "./WaitFlag";
import { FilterIcon } from "@/components/ui/icons";
import {
  DEFAULT_SETTINGS,
  resetPlatformSettings,
  setPlatformSettings,
} from "@/lib/admin/platform-settings";

/* ============================================================================
   One button for everything that narrows or reorders the board.

   Three controls sitting open on the toolbar cost a whole row of width for
   settings that are changed once and then left alone. Behind a single trigger
   they cost nothing, and the count on the button is what actually matters at a
   glance: whether you are looking at the full queue or a filtered slice of it.

   The flag thresholds live in here too. They are a platform setting rather
   than a filter, but the person who notices the numbers are wrong is the
   person reading the flags, and this is the only toolbar they have.
   ============================================================================ */

export function QueueFilters({
  onlyUnassigned,
  onOnlyUnassigned,
  longestFirst,
  onLongestFirst,
  sortLocked,
}: {
  onlyUnassigned: boolean;
  onOnlyUnassigned: (v: boolean) => void;
  longestFirst: boolean;
  onLongestFirst: (v: boolean) => void;
  /** the Running Late tab sorts itself, so the toggle is fixed on */
  sortLocked: boolean;
}) {
  const s = usePlatformSettings();
  const [open, setOpen] = useState(false);

  const customThresholds =
    s.waitAmberHours !== DEFAULT_SETTINGS.waitAmberHours || s.waitRedHours !== DEFAULT_SETTINGS.waitRedHours;
  const active = [onlyUnassigned, longestFirst && !sortLocked, customThresholds].filter(Boolean).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-2 rounded-lg border border-[var(--divider)] bg-background-paper px-3 text-sm font-semibold text-text-primary hover:bg-background-neutral"
      >
        <FilterIcon width={16} height={16} className="text-text-secondary" />
        Filters
        {active > 0 && (
          <span className="rounded-full bg-primary-main-16 px-1.5 py-0.5 text-[11px] font-bold text-primary-dark">
            {active}
          </span>
        )}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-text-secondary">
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-[var(--divider)] bg-background-paper p-4 shadow-dropdown">
            <Toggle
              label="Unassigned only"
              hint="Hide anything a clinician is already holding"
              checked={onlyUnassigned}
              onChange={onOnlyUnassigned}
            />
            <Toggle
              label="Longest waiting first"
              hint={sortLocked ? "Always on in the Running Late tab" : "Oldest on the board at the top"}
              checked={longestFirst || sortLocked}
              disabled={sortLocked}
              onChange={onLongestFirst}
            />

            <div className="my-3 border-t border-[var(--divider)]" />

            <div className="flex items-center gap-1.5">
              <ClockIcon className="text-text-secondary" />
              <p className="text-sm font-bold text-text-primary">Waiting-flag thresholds</p>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
              How long a case may sit unclaimed before the board says so. Operational — it never affects a
              case&rsquo;s clinical Auto-Score.
            </p>

            <div className="mt-3 space-y-2">
              <Hours
                label="Amber after"
                value={s.waitAmberHours}
                onChange={(waitAmberHours) => setPlatformSettings({ waitAmberHours })}
              />
              <Hours
                label="Red after"
                value={s.waitRedHours}
                onChange={(waitRedHours) => setPlatformSettings({ waitRedHours })}
              />
            </div>

            {customThresholds && (
              <button
                type="button"
                onClick={resetPlatformSettings}
                className="mt-3 text-xs font-bold text-primary hover:underline"
              >
                Reset to {DEFAULT_SETTINGS.waitAmberHours}h / {DEFAULT_SETTINGS.waitRedHours}h
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={`flex gap-2.5 py-1.5 ${disabled ? "cursor-default" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--divider)] accent-[var(--primary)] disabled:opacity-60"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-text-primary">{label}</span>
        <span className="block text-xs text-text-secondary">{hint}</span>
      </span>
    </label>
  );
}

function Hours({
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
