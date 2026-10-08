// ============================================================================
// The waiting clock — how long a case has been waiting on a decision.
//
// It measures the only thing the patient actually experiences: time between
// asking and being answered. So it keeps running once a clinician claims the
// case. Claiming is not an answer — it moves the case from "nobody is looking"
// to "someone is", and a case sat on for a day by one prescriber has failed
// the patient exactly as badly as one nobody touched. Stopping the clock on
// claim would hide that, and would make the flag gameable by claiming
// everything.
//
// Two things end a wait:
//
//   resolved          the case is decided and leaves the live queue.
//   info requested    the patient is asked for something — photos, an answer.
//                     The clock PAUSES and RESETS: the panel is no longer the
//                     one holding things up, and when the patient replies the
//                     case deserves a fresh promise rather than arriving
//                     pre-flagged for time it did not cost us.
//
// Reconciliation (not events): `syncBoardClock` is handed the set of refs that
// are parked and works out the deltas. Events would need every call site that
// touches a case to remember to tick the clock too, and the one that forgot
// would silently under-count.
// ============================================================================

/**
 * Hours each case has been waiting when a demo board is dealt.
 *
 * Shaped deliberately: most of a working queue is well inside the promise, a
 * handful are the day's actual job, and one or two have gone wrong. A board
 * where everything is red teaches a reader to ignore red. The prototype's source records carry
 * display strings ("10:24 today") rather than timestamps, so there is nothing
 * to subtract from; a real deployment starts every clock at creation and needs
 * none of this.
 */
/**
 * Why a case is parked on the patient. The clock stops AND resets: the delay
 * is no longer ours, and when they reply the case deserves a fresh promise
 * rather than arriving pre-flagged for time it never cost us.
 */
export const SEED_WAIT_HOURS: Record<string, number> = {
  // over the red line — the board should rarely look this bad, and when it
  // does the admin needs to be able to pick them out at a glance
  "PT-4462": 31,
  "PT-3129": 26,

  // between amber and red: the band that should be acted on today
  "PT-4465": 19,
  "PT-2110": 16,
  "PT-3128": 14,
  "PT-4463": 13,

  // the normal state of a queue that is keeping up
  "PT-4471": 0.4,
  "PT-4470": 2,
  "PT-4468": 6,
  "PT-4464": 4,
  "PT-3120": 1,
  "PT-3121": 3,
  "PT-3122": 7,
  "PT-3123": 0.6,
  "PT-3124": 5,
  "PT-3125": 9,
  "PT-3126": 2,
  "PT-3127": 8,
  "PT-2087": 11,
  "PT-2071": 3,
  "PT-2095": 1.5,
  "PT-2123": 7,
};


export interface BoardTimer {
  /** ms banked since the wait last started from zero */
  waitedMs: number;
  /** epoch ms the current spell started; null while parked on the patient */
  freeSince: number | null;
}

export type BoardTimers = Record<string, BoardTimer>;

const KEY = "hfp-board-clock";

/**
 * Demo-only: re-deal the board when it has been left alone this long.
 *
 * The clock counts real elapsed time, which is the whole point — but a demo
 * browser opened on Monday and again on Thursday comes back with every case
 * three days late, and a board where everything is red teaches a reader to
 * ignore red. Inside a session it still accumulates honestly, so claiming,
 * releasing and parking all behave. A deployment has real cases arriving and
 * leaving, and needs none of this.
 */
const STALE_AFTER_MS = 6 * 3_600_000;
const TOUCHED_KEY = "hfp-board-clock-touched";
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

/** Total time waiting on a decision, including the spell currently running. */
export function waitedMs(timers: BoardTimers, ref: string, now: number): number {
  const t = timers[ref];
  if (!t) return 0;
  return t.waitedMs + (t.freeSince === null ? 0 : Math.max(0, now - t.freeSince));
}

export const waitedHours = (timers: BoardTimers, ref: string, now: number): number =>
  waitedMs(timers, ref, now) / HOUR_MS;


/**
 * Bring the stored clock in line with what the queue looks like now.
 *
 * `parkedRefs` is every case waiting on the patient rather than on us.
 * Entering that state zeroes the accumulator, so a case that comes back after
 * an information request starts its promise again from nothing. Everything
 * else runs, claimed or not.
 *
 * Returns nothing; writes (and notifies) only when something moved, so this is
 * safe to call from a 1 s tick.
 */
export function syncBoardClock(
  allRefs: string[],
  parkedRefs: Set<string>,
  seedHours: Record<string, number> = {},
  now = Date.now(),
) {
  if (staleSinceLastVisit(now)) {
    cache = undefined;
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }
  touch(now);

  const current = getBoardClockSnapshot();
  const next: BoardTimers = { ...current };
  let changed = false;

  for (const ref of allRefs) {
    // a ref we've never seen starts with whatever history the demo gives it,
    // so there is no ordering dependency between seeding and syncing
    const t = next[ref] ?? { waitedMs: (seedHours[ref] ?? 0) * HOUR_MS, freeSince: null };
    const parked = parkedRefs.has(ref);

    if (!parked && t.freeSince === null) {
      next[ref] = { ...t, freeSince: now };
      changed = true;
    } else if (parked && t.freeSince !== null) {
      // the wait is ours no longer — bank nothing, start again on return
      next[ref] = { waitedMs: 0, freeSince: null };
      changed = true;
    } else if (!next[ref]) {
      next[ref] = t;
      changed = true;
    }
  }

  if (changed) write(next);
}

/** Has the board been sitting untouched long enough to be worth re-dealing? */
function staleSinceLastVisit(now: number): boolean {
  try {
    const last = Number(window.localStorage.getItem(TOUCHED_KEY));
    return Number.isFinite(last) && last > 0 && now - last > STALE_AFTER_MS;
  } catch {
    return false;
  }
}

function touch(now: number) {
  try {
    window.localStorage.setItem(TOUCHED_KEY, String(now));
  } catch {
    /* ignore */
  }
}

