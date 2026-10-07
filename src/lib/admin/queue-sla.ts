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

/** "14h" / "2d 3h" — short enough to sit in a chip beside the score. */
export function waitedLabel(hours: number): string {
  if (hours < 1) return "< 1h";
  const whole = Math.floor(hours);
  if (whole < 24) return `${whole}h`;
  const d = Math.floor(whole / 24);
  const h = whole % 24;
  return h === 0 ? `${d}d` : `${d}d ${h}h`;
}

/**
 * One chip, three colourways. Every case wears the same shape whatever its
 * age — only the colour moves — so a reader tracks one object changing state
 * rather than learning that a new badge has appeared.
 *
 * Same shape and fill as the RAG pills it sits beside: the two numbers are
 * compared against each other constantly, and two visual languages made that
 * a two-step read. The clock icon is what tells them apart, so keep it.
 */
export const WAIT_FLAG_CHIP: Record<WaitFlag, string> = {
  none: "bg-grey-200 text-text-secondary",
  amber: "bg-warning-lighter text-warning-darker",
  red: "bg-error-lighter text-error-darker",
};

export const WAIT_FLAG_TEXT: Record<Exclude<WaitFlag, "none">, string> = {
  amber: "text-warning-dark",
  red: "text-error",
};

export const PAUSE_LABEL: Record<BoardPauseReason, string> = {
  photos: "On hold · weight photo & ID",
  "patient-reply": "On hold · awaiting patient reply",
};
