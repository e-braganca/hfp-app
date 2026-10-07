import { WAIT_FLAG_CHIP, waitedLabel, type WaitFlag as Flag } from "@/lib/admin/queue-sla";

/* ============================================================================
   Waiting-time chip.

   Shaped like the Auto-Score pill and sat beside it, so the two numbers a
   reader weighs against each other are read in one glance instead of two.
   The clock is what keeps them apart: how long the patient has waited is not
   a clinical grade, and a green case can be red here.
   ============================================================================ */

export function ClockIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`h-3.5 w-3.5 shrink-0 ${className}`} aria-hidden>
      <circle cx="12" cy="12" r="9.5" fill="currentColor" />
      <path
        d="M12 6.75V12l3.4 2"
        stroke="var(--background-paper)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The waiting time for one case. Always rendered for a case still waiting on a
 * decision, not only a flagged one — an admin reading the column should never
 * have to work out whether a quiet row is two hours old or eleven.
 */
export function WaitChip({ hours, flag }: { hours: number; flag: Flag }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${WAIT_FLAG_CHIP[flag]}`}
      title={
        flag === "none"
          ? "Time waiting on a decision"
          : `Waiting ${waitedLabel(hours)} — this is waiting time, not a clinical score`
      }
    >
      <ClockIcon />
      {waitedLabel(hours)}
    </span>
  );
}
