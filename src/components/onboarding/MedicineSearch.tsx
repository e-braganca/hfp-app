"use client";

import { useState } from "react";
import { searchMedicines, medicineByName, type Medicine } from "@/lib/onboarding/medicines";

/**
 * Type-ahead picker for "what else are you taking". Free text is always
 * accepted — the list will never be complete, and a medicine the patient
 * types badly is still worth more to the prescriber than a blank field.
 */
export function MedicineSearch({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const results = searchMedicines(query, selected);
  const q = query.trim();
  const exactMatch = results.some((r) => r.name.toLowerCase() === q.toLowerCase());
  const canAddFreeText = q.length >= 2 && !exactMatch && !selected.includes(q);

  const add = (name: string) => {
    onChange([...selected, name]);
    setQuery("");
  };
  const remove = (name: string) => onChange(selected.filter((n) => n !== name));

  return (
    <div className="mt-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-text-primary">
          Which medication? Start typing to search
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canAddFreeText) {
              e.preventDefault();
              add(q);
            }
          }}
          placeholder="e.g. Ramipril, Sertraline, Levothyroxine…"
          className="h-12 w-full rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 text-base text-text-primary focus:border-primary focus:outline-none"
        />
      </label>

      {(results.length > 0 || canAddFreeText) && (
        <ul className="mt-2 overflow-hidden rounded-xl border border-[var(--divider)] bg-background-paper">
          {results.map((m) => (
            <li key={m.name}>
              <button
                type="button"
                onClick={() => add(m.name)}
                className="flex w-full items-center justify-between gap-3 border-b border-[var(--divider)] px-4 py-2.5 text-left last:border-0 hover:bg-primary-lighter/40"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-text-primary">{m.name}</span>
                  <span className="block truncate text-xs text-text-secondary">{m.cls}</span>
                </span>
                <span className="shrink-0 text-lg leading-none text-primary">+</span>
              </button>
            </li>
          ))}
          {canAddFreeText && (
            <li>
              <button
                type="button"
                onClick={() => add(q)}
                className="flex w-full items-center justify-between gap-3 border-t border-dashed border-[var(--divider)] px-4 py-2.5 text-left hover:bg-primary-lighter/40"
              >
                <span className="text-sm text-text-secondary">
                  Not listed — add <span className="font-bold text-text-primary">&ldquo;{q}&rdquo;</span>
                </span>
                <span className="shrink-0 text-lg leading-none text-primary">+</span>
              </button>
            </li>
          )}
        </ul>
      )}

      {selected.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
            Your medication ({selected.length})
          </p>
          <ul className="mt-2 space-y-2">
            {selected.map((name) => (
              <SelectedRow key={name} name={name} med={medicineByName(name)} onRemove={() => remove(name)} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SelectedRow({
  name,
  med,
  onRemove,
}: {
  name: string;
  med: Medicine | undefined;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-xl border border-[var(--divider)] bg-background-paper px-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-text-primary">{name}</span>
        <span className="block text-xs text-text-secondary">{med?.cls ?? "Added by you — the prescriber will confirm it"}</span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        className="shrink-0 rounded-md p-1 text-text-disabled hover:bg-background-neutral hover:text-text-primary"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </li>
  );
}
