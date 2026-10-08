// ============================================================================
// A message that outlives the navigation that caused it.
//
// Skip acts on the case you are leaving and then takes you somewhere else, so
// the screen that could report it is gone before it can. The message is left
// here and picked up by whichever screen lands next.
//
// Deliberately in memory and read-once: it describes a thing that just
// happened, not a state. A reload should not replay it.
// ============================================================================

let pending: string | null = null;

export function setFlash(message: string) {
  pending = message;
}

/** Reads and clears — a flash shows once, on the first screen to ask. */
export function takeFlash(): string | null {
  const m = pending;
  pending = null;
  return m;
}
