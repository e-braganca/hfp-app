// ============================================================================
// Outstanding information requests — cases parked on the patient.
//
// A case where the prescriber has asked the patient for something (a readable
// weight photo, an answer about a treatment gap) is not work anyone can do.
// It sat in the ordinary tabs looking claimable, so a clinician would open it,
// find nothing new, and put it back. It has its own tab now.
//
// It is also what stops the admin's waiting clock: once the patient owes us
// something the delay is no longer the panel's, and when they reply the case
// starts its promise over. See lib/admin/board-clock.ts.
//
// localStorage + external store, same pattern as the claim board, so a reply
// recorded in one tab shows up in the other.
// ============================================================================

export interface InfoRequest {
  ref: string;
  /** clinician who asked */
  by: string;
  /** what was asked — the email subject the patient received */
  subject: string;
  /** epoch ms */
  at: number;
}

const KEY = "hfp-info-requests";

let cache: Record<string, InfoRequest> | undefined;
const listeners = new Set<() => void>();

function read(): Record<string, InfoRequest> {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, InfoRequest>) : {};
  } catch {
    return {};
  }
}

function write(next: Record<string, InfoRequest>) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — this session only */
  }
  listeners.forEach((l) => l());
}

function onStorage(e: StorageEvent) {
  if (e.key !== KEY) return;
  cache = undefined;
  listeners.forEach((l) => l());
}

export function subscribeInfoRequests(cb: () => void): () => void {
  listeners.add(cb);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function getInfoRequestsSnapshot(): Record<string, InfoRequest> {
  if (cache === undefined) cache = read();
  return cache;
}

const EMPTY: Record<string, InfoRequest> = {};
export const getInfoRequestsServerSnapshot = (): Record<string, InfoRequest> => EMPTY;

export const infoRequestFor = (map: Record<string, InfoRequest>, ref: string): InfoRequest | null =>
  map[ref] ?? null;

/** Record that the patient has been asked for something. */
export function requestInfo(ref: string, by: string, subject: string) {
  write({ ...read(), [ref]: { ref, by, subject, at: Date.now() } });
}

/** The patient replied (or the request was withdrawn) — back on the board. */
export function clearInfoRequest(ref: string) {
  const next = { ...read() };
  delete next[ref];
  write(next);
}

/** "2 h ago" / "3 d ago" — how long the patient has had the question. */
export function askedAgo(r: InfoRequest, now: number): string {
  const mins = Math.floor((now - r.at) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

/** Demo seed, so the tab isn't empty on a fresh browser. */
export function seedInfoRequestsIfEmpty(seed: InfoRequest[]) {
  if (Object.keys(read()).length > 0) return;
  write(Object.fromEntries(seed.map((r) => [r.ref, r])));
}
