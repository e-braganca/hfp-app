// ============================================================================
// Waiting flags — the attention signal for a case nobody has picked up.
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

/**
 * Why a case is off the board with its clock paused. The patient owes us
 * something in both cases, so the panel is not accountable for the delay.
 */
export type BoardPauseReason = "photos" | "patient-reply";

export const PAUSE_LABEL: Record<BoardPauseReason, string> = {
  photos: "On hold · weight photo & ID",
  "patient-reply": "On hold · awaiting patient reply",
};

/**
 * Hours each case had already spent on the board when the demo data was
 * written, used once to seed the clock. The prototype's source records carry
 * display strings ("10:24 today") rather than timestamps, so there is nothing
 * to subtract from; a real deployment starts every clock at creation and needs
 * none of this.
 */
export const SEED_WAIT_HOURS: Record<string, number> = {
  "PT-4462": 31,
  "PT-3129": 27,
  "PT-4465": 19,
  "PT-2110": 14,
  "PT-3128": 13,
  "PT-4463": 9,
  "PT-4464": 4,
  "PT-3127": 6,
  "PT-2123": 7,
};

/** Cases parked off the board — their clocks stay frozen until they return. */
export const SEED_PAUSED: Record<string, BoardPauseReason> = {
  "PT-4470": "photos",
  "PT-3126": "patient-reply",
};
