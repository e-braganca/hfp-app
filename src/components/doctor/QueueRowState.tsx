"use client";

import type { Clinician, QueueCategory } from "@/lib/doctor/clinicians";
import { blockedReason } from "@/lib/doctor/clinicians";
import { heldFor, type Hold } from "@/lib/doctor/queue-claims";
import type { Rag } from "@/lib/doctor/types";

/* ============================================================================
   How one row of the shared board looks to the clinician reading it: theirs,
   somebody else's, out of their clearance, or free to take.
   ============================================================================ */

export type RowState =
  | { kind: "mine"; hold: Hold }
  | { kind: "reserved-by-me"; hold: Hold; secondsLeft: number }
  | { kind: "held"; hold: Hold }
  | { kind: "blocked"; reason: string }
  | { kind: "free" };

export function rowState(
  hold: Hold | null,
  me: Clinician,
  category: QueueCategory,
  rag: Rag,
  now: number,
): RowState {
  if (hold && hold.by === me.name) {
    return hold.kind === "claimed"
      ? { kind: "mine", hold }
      : { kind: "reserved-by-me", hold, secondsLeft: Math.max(0, Math.ceil(((hold.expiresAt ?? 0) - now) / 1000)) };
  }
  if (hold) return { kind: "held", hold };
  const reason = blockedReason(me, category, rag);
  return reason ? { kind: "blocked", reason } : { kind: "free" };
}

/** Row tint. Held and blocked rows stay on the board but read as unavailable. */
export function rowTone(s: RowState): string {
  switch (s.kind) {
    case "mine":
      return "bg-primary-lighter/40";
    case "reserved-by-me":
      return "bg-warning-lighter/50";
    case "held":
    case "blocked":
      return "opacity-55";
    default:
      return "hover:bg-grey-100";
  }
}

export function ClaimCell({
  state,
  now,
  onClaim,
  onOpen,
  onRelease,
}: {
  state: RowState;
  now: number;
  onClaim: () => void;
  onOpen?: () => void;
  onRelease: () => void;
}) {
  if (state.kind === "held") {
    const h = state.hold;
    return (
      <span className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-grey-200 text-[10px] font-bold text-text-secondary">
          {h.initials}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-bold text-text-primary">{h.by.replace("Dr. ", "Dr ")}</span>
          <span className="block text-[11px] text-text-secondary">
            {h.kind === "reserved" ? "reviewing now" : `holding · ${heldFor(h, now)}`}
          </span>
        </span>
      </span>
    );
  }

  if (state.kind === "blocked") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-grey-200 px-2 py-1 text-[11px] font-bold text-text-secondary">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2.5" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2.5" />
        </svg>
        {state.reason}
      </span>
    );
  }

  if (state.kind === "mine") {
    return (
      <span className="flex flex-wrap items-center gap-2">
        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-dark"
          >
            Open
          </button>
        )}
        <button
          type="button"
          onClick={onRelease}
          className="text-xs font-bold text-text-secondary underline hover:text-text-primary"
        >
          Release
        </button>
      </span>
    );
  }

  if (state.kind === "reserved-by-me") {
    return (
      <span className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onClaim}
          className="rounded-lg bg-warning-dark px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
        >
          Claim · {state.secondsLeft}s
        </button>
      </span>
    );
  }

  // free: take it outright, or open it — which reserves it while you look
  return (
    <span className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onClaim}
        className="rounded-lg border border-primary px-3 py-1.5 text-xs font-bold text-primary-dark hover:bg-primary-lighter"
      >
        Claim
      </button>
      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          className="text-xs font-bold text-text-secondary underline hover:text-text-primary"
        >
          Open
        </button>
      )}
    </span>
  );
}
