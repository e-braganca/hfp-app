"use client";

import { useState } from "react";
import { PHARMACIES } from "@/lib/doctor/data";
import { CheckIcon, FilterIcon } from "@/components/ui/icons";

/**
 * The Work Queue's filters, in one control.
 *
 * The pharmacy list and the "available to me" toggle used to sit side by side
 * on the toolbar, which ate the width the two tab groups now need. They are
 * the same question anyway — which slice of the board am I looking at.
 */
export function PharmacyFilter({
  value,
  onChange,
  onlyMine,
  onOnlyMine,
}: {
  value: string | null;
  onChange: (code: string | null) => void;
  /** omitted on tabs where "available to me" makes no sense */
  onlyMine?: boolean;
  onOnlyMine?: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = (value ? 1 : 0) + (onlyMine ? 1 : 0);
  const current = value
    ? PHARMACIES.find((p) => p.code === value)?.name ?? "Pharmacy"
    : "Filters";

  const pick = (code: string | null) => {
    onChange(code);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 items-center gap-2 rounded-lg border border-[var(--divider)] bg-background-paper px-3 text-sm font-semibold text-text-primary hover:bg-background-neutral"
      >
        <FilterIcon width={16} height={16} className="text-text-secondary" />
        {current}
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
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-[var(--divider)] bg-background-paper py-1 shadow-dropdown">
            {onOnlyMine && (
              <>
                <label className="flex cursor-pointer items-start gap-2.5 px-3 py-2 hover:bg-background-neutral">
                  <input
                    type="checkbox"
                    checked={!!onlyMine}
                    onChange={(e) => onOnlyMine(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--divider)] accent-[var(--primary)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-text-primary">Available to me</span>
                    <span className="block text-xs text-text-secondary">Hide cases outside your clearance</span>
                  </span>
                </label>
                <div className="my-1 border-t border-[var(--divider)]" />
              </>
            )}
            <p className="px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Pharmacy
            </p>
            <FilterRow label={`All pharmacies (${PHARMACIES.length})`} active={!value} onClick={() => pick(null)} />
            <div className="my-1 border-t border-[var(--divider)]" />
            {PHARMACIES.map((p) => (
              <FilterRow
                key={p.code}
                label={p.name}
                active={value === p.code}
                onClick={() => pick(p.code)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FilterRow({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-text-primary hover:bg-background-neutral"
    >
      {label}
      {active && <CheckIcon width={16} height={16} className="text-primary" />}
    </button>
  );
}
