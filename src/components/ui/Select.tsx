"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/* ============================================================================
   Platform select — a real popover instead of the browser's native menu.

   The native control can't show an avatar, a presence dot or the reason an
   option is unavailable, and it can't be searched. With a hundred clinicians
   on the panel, "scroll a grey OS list" stops being a workable way to route a
   case, which is what this replaces.
   ============================================================================ */

export interface SelectOption {
  value: string;
  label: string;
  /** second line — the clearance, the reason it's disabled, anything */
  hint?: string;
  disabled?: boolean;
  /** avatar, dot, swatch — rendered before the label */
  leading?: ReactNode;
  /** optional section header to sort under */
  group?: string;
  /** extra text matched by the search box beyond the label */
  keywords?: string;
}

export function Select({
  value,
  options,
  placeholder = "Select…",
  searchable = false,
  searchPlaceholder = "Search…",
  disabled = false,
  align = "left",
  className = "",
  buttonClassName = "",
  onChange,
}: {
  value: string;
  options: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  align?: "left" | "right";
  className?: string;
  buttonClassName?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // flip up when the trigger sits near the bottom — this control lives in
  // drawer footers and table rows, where "always downwards" opens offscreen
  const [dropUp, setDropUp] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  // click-away and Esc — a popover that traps you is worse than a native menu
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) close();
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

  const selected = options.find((o) => o.value === value);
  const q = query.trim().toLowerCase();
  const matches = q
    ? options.filter((o) => `${o.label} ${o.hint ?? ""} ${o.keywords ?? ""}`.toLowerCase().includes(q))
    : options;

  // keep declared group order; ungrouped options come first
  const groups: { name: string | null; items: SelectOption[] }[] = [];
  for (const o of matches) {
    const name = o.group ?? null;
    const bucket = groups.find((g) => g.name === name);
    if (bucket) bucket.items.push(o);
    else groups.push({ name, items: [o] });
  }

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => {
          if (open) {
            close();
            return;
          }
          const box = root.current?.getBoundingClientRect();
          setDropUp(!!box && window.innerHeight - box.bottom < 320 && box.top > 320);
          setOpen(true);
        }}
        className={`flex w-full items-center gap-2 rounded-lg border border-[var(--divider)] bg-background-paper px-3 text-left text-sm font-semibold text-text-primary transition-colors hover:border-text-disabled focus:border-primary focus:outline-none disabled:opacity-50 ${buttonClassName || "h-9"}`}
      >
        {selected?.leading}
        <span className={`min-w-0 flex-1 truncate ${selected ? "" : "text-text-secondary"}`}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={`shrink-0 text-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          className={`absolute z-50 max-h-80 w-full min-w-[16rem] overflow-hidden rounded-lg border border-[var(--divider)] bg-background-paper shadow-dialog ${
            align === "right" ? "right-0" : "left-0"
          } ${dropUp ? "bottom-full mb-1" : "mt-1"}`}
        >
          {searchable && (
            <div className="border-b border-[var(--divider)] p-2">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-md border border-[var(--divider)] px-2.5 text-sm font-normal focus:border-primary focus:outline-none"
              />
            </div>
          )}

          <div className="max-h-64 overflow-y-auto py-1">
            {matches.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-text-secondary">No matches.</p>
            )}

            {groups.map((g) => (
              <div key={g.name ?? "_"}>
                {g.name && (
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-text-disabled">
                    {g.name}
                  </p>
                )}
                {g.items.map((o) => {
                  const active = o.value === value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="option"
                      aria-selected={active}
                      disabled={o.disabled}
                      onClick={() => {
                        onChange(o.value);
                        close();
                      }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                        o.disabled
                          ? "cursor-not-allowed opacity-45"
                          : active
                            ? "bg-primary-lighter"
                            : "hover:bg-background-neutral"
                      }`}
                    >
                      {o.leading}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-text-primary">{o.label}</span>
                        {o.hint && <span className="block truncate text-xs text-text-secondary">{o.hint}</span>}
                      </span>
                      {active && (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0 text-primary">
                          <path d="m5 12 5 5L20 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
