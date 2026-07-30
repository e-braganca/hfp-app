"use client";

import { useState } from "react";
import { PHARMACIES } from "@/lib/doctor/data";
import { CheckIcon, FilterIcon } from "@/components/ui/icons";

/** "All pharmacies (6)" dropdown filter used across the Work Queue tabs. */
export function PharmacyFilter({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (code: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = value
    ? PHARMACIES.find((p) => p.code === value)?.name ?? "Pharmacy"
    : `All pharmacies (${PHARMACIES.length})`;

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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-text-secondary">
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-60 rounded-lg border border-[var(--divider)] bg-background-paper py-1 shadow-dropdown">
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
