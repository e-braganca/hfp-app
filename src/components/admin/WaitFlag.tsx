import {
  WAIT_FLAG_CHIP,
  WAIT_FLAG_TEXT,
  waitedLabel,
  type WaitFlag as Flag,
} from "@/lib/admin/queue-sla";

/* ============================================================================
   Waiting-time chips.

   Outlined, square-cornered and clock-led, against the RAG pills' filled
   rounded-full. That contrast is load-bearing: a reader glancing at a row has
   to be able to tell "this has been ignored for a day" from "this is
   clinically red" without reading either label.
   ============================================================================ */

export function ClockIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`h-3.5 w-3.5 shrink-0 ${className}`} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The waiting time for one case. Always rendered for an unclaimed case, in the
 * same chip whatever the age — an admin reading the column should never have
 * to work out whether a quiet row is two hours old or eleven.
 */
export function WaitChip({ hours, flag }: { hours: number; flag: Flag }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-bold ${WAIT_FLAG_CHIP[flag]}`}
      title={
        flag === "none"
          ? "Time free on the shared board"
          : `Unclaimed for ${waitedLabel(hours)} — this is waiting time, not a clinical score`
      }
    >
      <ClockIcon />
      Waiting {waitedLabel(hours)}
    </span>
  );
}

/** Bare coloured waiting time, for dense rows that can't take a chip. */
export function WaitText({ hours, flag }: { hours: number; flag: Flag }) {
  return (
    <span className={`text-xs font-bold ${flag === "none" ? "text-text-secondary" : WAIT_FLAG_TEXT[flag]}`}>
      Waiting {waitedLabel(hours)}
    </span>
  );
}
