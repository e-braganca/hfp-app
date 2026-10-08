"use client";

/**
 * One underlined group of tabs with counts.
 *
 * The prescriber's board and the admin's queue had a copy each, which is how
 * the admin's ended up a different height and sitting inside the table card
 * while the doctor's sat outside it.
 */
export function TabStrip<T extends string>({
  tabs,
  active,
  label,
  count,
  alarming,
  onPick,
}: {
  tabs: readonly T[];
  active: T;
  label: (t: T) => string;
  count: (t: T) => number;
  /** the one tab that turns red when it should be read as an alarm */
  alarming?: (t: T) => boolean;
  onPick: (t: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-[var(--divider)]">
      {tabs.map((t) => {
        const on = active === t;
        const red = alarming?.(t) ?? false;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onPick(t)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-semibold transition-colors ${
              on
                ? red
                  ? "border-error text-text-primary"
                  : "border-primary text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {label(t)}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                on ? "bg-primary-main-16 text-primary-dark" : "bg-grey-200 text-text-secondary"
              }`}
            >
              {count(t)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
