// ============================================================================
// What to work next.
//
// Longest wait first, so the queue drains in the order patients actually
// joined it. That is the same clock the admin flags against, deliberately: a
// prescriber working top-down is working the exact list the admin is being
// held to, rather than an order that happens to match the arrays.
//
// The pool is narrower than the board. Skipped straight past are cases that
// are not a decision anyone can make right now:
//
//   held by someone else   not ours to open
//   awaiting a reply       the patient owes us something
//   outside my clearance   I am not allowed to decide it
//   escalated              with a senior; the doctor's screen for it is
//                          read-only, so there is no decision to land on
//   no review screen       nothing to open
// ============================================================================

import { blockedReason, type Clinician } from "./clinicians";
import { holdFor, type Hold } from "./queue-claims";
import { isAwaitingPatient, type InfoRequest } from "./info-requests";
import { liveCases, type LiveCase } from "@/lib/shared/live-cases";
import { waitedMs, type BoardTimers } from "@/lib/shared/board-clock";

/**
 * Cases passed over in this sitting.
 *
 * Without it, skipping the oldest case lands on the second oldest, and
 * skipping that one lands straight back on the first — a two-case loop with no
 * way through the queue. Skipped cases go to the back of the order rather than
 * out of it, so they still come round once the rest is worked.
 *
 * Deliberately in memory: it describes one sitting, not the case, and a reload
 * should give the clinician a clean list.
 */
const skipped = new Set<string>();

export function markSkipped(ref: string) {
  skipped.add(ref);
}

export function clearSkipped() {
  skipped.clear();
}

export interface NextCaseContext {
  timers: BoardTimers;
  now: number;
  claims: Record<string, Hold>;
  infoRequests: Record<string, InfoRequest>;
  me: Clinician;
}

/** Cases this clinician could open right now, longest wait first. */
function workableCases(ctx: NextCaseContext): LiveCase[] {
  return liveCases()
    .filter((c) => {
      if (!c.href) return false;
      if (c.category === "escalated") return false;
      if (isAwaitingPatient(ctx.infoRequests[c.ref])) return false;
      if (blockedReason(ctx.me, c.category, c.rag)) return false;
      const hold = holdFor(ctx.claims, c.ref);
      if (hold && hold.by !== ctx.me.name) return false;
      return true;
    })
    .sort((a, b) => {
      const passed = Number(skipped.has(a.ref)) - Number(skipped.has(b.ref));
      if (passed !== 0) return passed;
      return waitedMs(ctx.timers, b.ref, ctx.now) - waitedMs(ctx.timers, a.ref, ctx.now);
    });
}

/**
 * The case to land on after skipping or finishing `afterRef`.
 *
 * Wraps around rather than stopping at the end: a clinician who skips the
 * oldest case should still be handed the rest of the list, and the only way
 * out is the queue link.
 */
export function nextCase(afterRef: string, ctx: NextCaseContext): LiveCase | null {
  const pool = workableCases(ctx).filter((c) => c.ref !== afterRef);
  return pool[0] ?? null;
}
