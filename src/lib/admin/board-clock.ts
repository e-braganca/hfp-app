// ============================================================================
// The waiting clock — how long each case has been FREE on the shared board.
//
// This is not "time since the order arrived". It counts only the stretches
// where the case was sitting there claimable and nobody took it, because that
// is the only part the panel is answerable for:
//
//   claimed or reserved  → paused. Someone owns it; the wait is over for now.
//   on hold for photos   → paused. The patient owes us something, not us them.
//   awaiting a reply     → paused, same reason.
//   free on the board    → running.
//
// Accumulated, never reset. A clinician who opens a case, sits on the 60 s
// reservation and lets it lapse hands it back with its history intact — the
// alternative would let a case be kept permanently young by being picked up
// and dropped, which is precisely the failure the flag exists to catch.
//
// Reconciliation (not events): `syncBoardClock` is handed the set of refs that
// are free right now and works out the deltas. Events would need every call
// site that touches a hold to remember to tick the clock too, and the one that
// forgot would silently under-count.
// ============================================================================

export interface BoardTimer {
  /** ms banked from previous free spells */
  waitedMs: number;
  /** epoch ms the current free spell started; null while paused */
  freeSince: number | null;
}

export type BoardTimers = Record<string, BoardTimer>;

const KEY = "hfp-board-clock";
const HOUR_MS = 3_600_000;

let cache: BoardTimers | undefined;
const listeners = new Set<() => void>();

function read(): BoardTimers {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BoardTimers) : {};
  } catch {
    return {};
  }
}

function write(next: BoardTimers) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — memory only for this session */
  }
  listeners.forEach((l) => l());
}

function onStorage(e: StorageEvent) {
  if (e.key !== KEY) return;
  cache = undefined;
  listeners.forEach((l) => l());
}

export function subscribeBoardClock(cb: () => void): () => void {
  listeners.add(cb);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function getBoardClockSnapshot(): BoardTimers {
  if (cache === undefined) cache = read();
  return cache;
}

const EMPTY: BoardTimers = {};
export const getBoardClockServerSnapshot = (): BoardTimers => EMPTY;

/** Total time free on the board, including the spell currently running. */
export function waitedMs(timers: BoardTimers, ref: string, now: number): number {
  const t = timers[ref];
  if (!t) return 0;
  return t.waitedMs + (t.freeSince === null ? 0 : Math.max(0, now - t.freeSince));
}

export const waitedHours = (timers: BoardTimers, ref: string, now: number): number =>
  waitedMs(timers, ref, now) / HOUR_MS;

/** Is the clock currently running for this case? */
export const isWaiting = (timers: BoardTimers, ref: string): boolean =>
  timers[ref]?.freeSince != null;

/**
 * Bring the stored clock in line with who is holding what.
 *
 * `freeRefs` is every case claimable right now. Anything in `allRefs` but not
 * in `freeRefs` is paused — held, reserved, or off the board waiting on the
 * patient. Returns nothing; writes (and notifies) only when something moved,
 * so this is safe to call from a 1 s tick.
 */
export function syncBoardClock(allRefs: string[], freeRefs: Set<string>, now = Date.now()) {
  const current = getBoardClockSnapshot();
  const next: BoardTimers = { ...current };
  let changed = false;

  for (const ref of allRefs) {
    const t = next[ref] ?? { waitedMs: 0, freeSince: null };
    const shouldRun = freeRefs.has(ref);

    if (shouldRun && t.freeSince === null) {
      next[ref] = { ...t, freeSince: now };
      changed = true;
    } else if (!shouldRun && t.freeSince !== null) {
      next[ref] = { waitedMs: t.waitedMs + Math.max(0, now - t.freeSince), freeSince: null };
      changed = true;
    } else if (!next[ref]) {
      next[ref] = t;
      changed = true;
    }
  }

  if (changed) write(next);
}

/**
 * Give cases a history on first run, so the board looks like one that has been
 * open for days rather than one that booted a second ago. Hours are banked as
 * already-waited time; the live spell starts from the next sync.
 *
 * A real deployment has no equivalent — the clock starts when the case is
 * created and there is nothing to seed.
 */
export function seedBoardClockIfEmpty(seedHours: Record<string, number>) {
  if (Object.keys(getBoardClockSnapshot()).length > 0) return;
  write(
    Object.fromEntries(
      Object.entries(seedHours).map(([ref, hours]) => [ref, { waitedMs: hours * HOUR_MS, freeSince: null }]),
    ),
  );
}

/** Admin tool: put one case's clock back to zero, e.g. after a data fix. */
export function resetWait(ref: string) {
  const next = { ...getBoardClockSnapshot() };
  next[ref] = { waitedMs: 0, freeSince: next[ref]?.freeSince ?? null };
  write(next);
}
