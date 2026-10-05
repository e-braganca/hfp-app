// ============================================================================
// Waiting flags — the attention signal for a case the patient is still
// waiting on.
//
// Deliberately NOT a RAG score. The Auto-Score says how risky the case is;
// this says how long it has been ignored. A green case left for two days is
// red here and still green clinically, and the flag never touches the score —
// conflating the two would be a patient-safety problem, not a UI wrinkle,
// because it would let an operational backlog read as a clinical escalation.
// They are kept visually distinct too: RAG pills are filled and round, wait
// flags are outlined, square-ish and carry a clock.
//
// Thresholds come from platform settings, so an admin retunes them without a
// release. See platform-settings.ts for why.
// ============================================================================

import type { PlatformSettings } from "./platform-settings";
import type { BoardPauseReason } from "@/lib/shared/board-clock";

export type WaitFlag = "none" | "amber" | "red";

export function waitFlagFor(hours: number, s: PlatformSettings): WaitFlag {
  if (hours >= s.waitRedHours) return "red";
  if (hours >= s.waitAmberHours) return "amber";
  return "none";
}

/** "14h" / "2d 3h" / "just now" — how long it has been free on the board. */
export function waitedLabel(hours: number): string {
  if (hours < 1) return "under 1h";
  const whole = Math.floor(hours);
  if (whole < 24) return `${whole}h`;
  const d = Math.floor(whole / 24);
  const h = whole % 24;
  return h === 0 ? `${d}d` : `${d}d ${h}h`;
}

/**
 * One chip, three colourways. Every unclaimed case wears the same shape
 * whatever its age — only the colour moves — so a reader tracks one object
 * changing state rather than learning that a new badge has appeared.
 *
 * Outlined, not filled — see the header. The RAG pills in StatusPill.tsx are
 * `rounded-full` with a solid tint; keeping these visually unrelated is the
 * whole point, so don't "harmonise" them later.
 */
export const WAIT_FLAG_CHIP: Record<WaitFlag, string> = {
  none: "border-[var(--divider)] text-text-secondary bg-background-neutral",
  amber: "border-warning text-warning-darker bg-warning-lighter/40",
  red: "border-error text-error-dark bg-error-lighter/40",
};

export const WAIT_FLAG_TEXT: Record<Exclude<WaitFlag, "none">, string> = {
  amber: "text-warning-dark",
  red: "text-error",
};

export const PAUSE_LABEL: Record<BoardPauseReason, string> = {
  photos: "On hold · weight photo & ID",
  "patient-reply": "On hold · awaiting patient reply",
};
