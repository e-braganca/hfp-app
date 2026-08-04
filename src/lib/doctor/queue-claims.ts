// ============================================================================
// Shared work queue — who is holding what.
//
// Two states per case:
//   reserved — a clinician opened it. Holds for RESERVE_SECONDS, then it drops
//              back to the board on its own. Nobody else can open it meanwhile,
//              so two people can never read the same case at once.
//   claimed  — they pressed Claim (or took it in a bulk pull). Theirs until
//              decided or released.
//
// localStorage + the `storage` event, so two browser windows behave like two
// clinicians on the same board: claim in one, watch it grey out in the other.
// Demo-only — a real deployment needs this arbitrated server-side, where the
// first write wins and the loser is handed the next case instead.
// ============================================================================

export const RESERVE_SECONDS = 60;

export type HoldKind = "reserved" | "claimed";

export interface Hold {
  ref: string;
  by: string;
  initials: string;
  kind: HoldKind;
  /** epoch ms — when the hold started */
  at: number;
  /** epoch ms — reservations only; claims never expire on their own */
  expiresAt: number | null;
}

const KEY = "hfp-queue-claims";

let cache: Record<string, Hold> | undefined;
const listeners = new Set<() => void>();

function read(): Record<string, Hold> {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, Hold>) : {};
  } catch {
    return {};
  }
}

function write(next: Record<string, Hold>) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — hold it in memory for this session */
  }
  listeners.forEach((l) => l());
}

/** Drop reservations whose 60 s ran out. Returns the surviving map. */
function sweep(map: Record<string, Hold>): Record<string, Hold> {
  const now = Date.now();
  const live = Object.fromEntries(
    Object.entries(map).filter(([, h]) => h.kind === "claimed" || (h.expiresAt ?? 0) > now),
  );
  return Object.keys(live).length === Object.keys(map).length ? map : live;
}

export function subscribeClaims(cb: () => void): () => void {
  listeners.add(cb);
  if (listeners.size === 1) {
    // another tab (another clinician) changed the board
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function onStorage(e: StorageEvent) {
  if (e.key !== KEY) return;
  cache = undefined;
  listeners.forEach((l) => l());
}

export function getClaimsSnapshot(): Record<string, Hold> {
  if (cache === undefined) cache = read();
  const swept = sweep(cache);
  if (swept !== cache) cache = swept; // expired locally; the write happens on the next action
  return cache;
}

const EMPTY: Record<string, Hold> = {};
export const getClaimsServerSnapshot = (): Record<string, Hold> => EMPTY;

/**
 * Expire anything stale and tell subscribers — driven by the queue's 1 s tick.
 * Compares against what's actually in storage, not the in-memory cache: the
 * cache is swept on every read, so comparing to it would filter lapsed holds
 * from view while leaving them written down.
 */
export function sweepExpired() {
  const raw = read();
  const swept = sweep(raw);
  if (swept !== raw) write(swept);
  else listeners.forEach((l) => l());
}

export function holdFor(map: Record<string, Hold>, ref: string): Hold | null {
  const h = map[ref];
  if (!h) return null;
  if (h.kind === "reserved" && (h.expiresAt ?? 0) <= Date.now()) return null;
  return h;
}

export function heldBy(map: Record<string, Hold>, name: string): Hold[] {
  return Object.values(map).filter((h) => h.by === name && holdFor(map, h.ref));
}

/**
 * Take the reservation on open. Refuses if someone else already holds it —
 * the caller sends the clinician back to the board with the reason.
 */
export function reserve(ref: string, by: string, initials: string): boolean {
  const map = { ...sweep(read()) };
  const existing = map[ref];
  if (existing && existing.by !== by) return false;
  if (existing?.kind === "claimed") return existing.by === by;
  map[ref] = { ref, by, initials, kind: "reserved", at: Date.now(), expiresAt: Date.now() + RESERVE_SECONDS * 1000 };
  write(map);
  return true;
}

/** Promote a reservation to a claim — the 60 s clock stops. */
export function claim(ref: string, by: string, initials: string): boolean {
  const map = { ...sweep(read()) };
  const existing = map[ref];
  if (existing && existing.by !== by) return false;
  map[ref] = { ref, by, initials, kind: "claimed", at: Date.now(), expiresAt: null };
  write(map);
  return true;
}

/** Bulk pull — claims every ref given, skipping any already held by someone else. */
export function claimMany(refs: string[], by: string, initials: string): string[] {
  const map = { ...sweep(read()) };
  const taken: string[] = [];
  for (const ref of refs) {
    const existing = map[ref];
    if (existing && existing.by !== by) continue;
    map[ref] = { ref, by, initials, kind: "claimed", at: Date.now(), expiresAt: null };
    taken.push(ref);
  }
  if (taken.length) write(map);
  return taken;
}

export function release(ref: string, by: string) {
  const map = { ...sweep(read()) };
  if (map[ref] && map[ref].by !== by) return;
  delete map[ref];
  write(map);
}

/** Demo helper — seed a few holds so a single browser still shows a busy board. */
export function seedIfEmpty(seed: Hold[]) {
  const map = sweep(read());
  if (Object.keys(map).length > 0) return;
  write(Object.fromEntries(seed.map((h) => [h.ref, h])));
}

/** "4 min" / "just now" — how long a hold has been open. */
export function heldFor(h: Hold, now: number): string {
  const mins = Math.floor((now - h.at) / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return hrs === 1 ? "1 h" : `${hrs} h`;
}
