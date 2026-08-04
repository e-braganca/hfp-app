"use client";

import { useState } from "react";
import type { TimelineEvent } from "@/lib/doctor/types";

const TL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "15 Mar 2026" / "3 Jun 2026 · today" -> Date; flag rows carry no date. */
function parseEventDate(s: string): Date | null {
  const m = s.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (!m) return null;
  const month = TL_MONTHS.indexOf(m[2]);
  return month < 0 ? null : new Date(Date.UTC(Number(m[3]), month, Number(m[1])));
}

/**
 * Medication history. Long records are noise on a repeat decision, so the
 * timeline collapses what the reviewer doesn't need in front of them:
 *   · anything older than 6 months (measured from the case's own latest
 *     event, not the wall clock — these records are fixed stories);
 *   · on a treatment-gap case, everything before the gap, however recent —
 *     the gap node itself states the dates it spans, so nothing is lost.
 * No internal scroller: both hosts (the review page's left rail and the
 * escalation drawer) already scroll, and nesting one inside the other traps
 * the wheel over the card.
 *
 * Shared by the doctor's complex-repeat review and the admin escalation drawer.
 */
export function MedicationTimeline({ events }: { events: TimelineEvent[] }) {
  const [expanded, setExpanded] = useState(false);

  const dates = events.map((e) => parseEventDate(e.date));
  const latest = dates.reduce<Date | null>((a, d) => (d && (!a || d > a) ? d : a), null);
  const cutoff = latest ? new Date(Date.UTC(latest.getUTCFullYear(), latest.getUTCMonth() - 6, latest.getUTCDate())) : null;
  const gapIndex = events.findIndex((e) => e.gap);

  const isCollapsed = (i: number) => {
    if (gapIndex !== -1 && i < gapIndex) return true;
    const d = dates[i];
    return !!(cutoff && d && d < cutoff);
  };

  const hiddenCount = events.filter((_, i) => isCollapsed(i)).length;
  const shown = events.map((e, i) => ({ e, i })).filter(({ i }) => expanded || !isCollapsed(i));

  return (
    <div className="mt-3">
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mb-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-[var(--divider)] px-3 py-2 text-xs font-bold text-text-secondary transition-colors hover:border-primary-light hover:text-text-primary"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            className={`transition-transform ${expanded ? "rotate-90" : ""}`}
          >
            <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {expanded ? `Hide ${hiddenCount} earlier ${hiddenCount === 1 ? "entry" : "entries"}` : `Show ${hiddenCount} earlier ${hiddenCount === 1 ? "entry" : "entries"}`}
          {!expanded && gapIndex !== -1 && (
            <span className="ml-auto font-normal text-text-disabled">before the gap</span>
          )}
        </button>
      )}

      <ol className="space-y-0">
        {shown.map(({ e, i }, idx) => {
          const last = idx === shown.length - 1;
          const dimmed = expanded && isCollapsed(i);
          return (
            <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
              {!last && (
                <span
                  className={`absolute left-[7px] top-4 h-full w-px ${e.flag ? "bg-error/40" : "bg-[var(--divider)]"}`}
                />
              )}
              <span
                className={`relative z-10 mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 ${
                  e.flag ? "border-error bg-error-lighter" : "border-grey-400 bg-background-paper"
                }`}
              >
                {e.flag && <span className="h-1.5 w-1.5 rounded-full bg-error" />}
              </span>
              <div className={`min-w-0 ${dimmed ? "opacity-60" : ""}`}>
                {e.flag ? (
                  <span className="inline-block rounded-full bg-error-lighter px-2.5 py-0.5 text-xs font-bold text-error-dark">
                    {e.label}
                  </span>
                ) : (
                  <p className="text-sm font-semibold text-text-primary">{e.label}</p>
                )}
                {e.date && <p className="text-xs text-text-secondary">{e.date}</p>}
                {e.detail && <p className="mt-0.5 text-xs text-error-dark">{e.detail}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
