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
  /**
   * The structured ask. Chasing a patient has to be answerable without
   * re-reading the thread, so what was requested is kept item by item and the
   * reply is recorded against each one.
   */
  items: RfiResponseItem[];
  /** free text for the "Other" item */
  note?: string;
}

import type { RfiResponseItem } from "@/lib/shared/rfi-items";

const KEY = "hfp-info-requests";

let cache: Record<string, InfoRequest> | undefined;
const listeners = new Set<() => void>();

/**
 * Records written before the structured ask existed have no `items`, and this
 * store outlives a deploy: whatever a browser saved months ago is what comes
 * back. Normalising on read is the only place that can be true for every
 * consumer at once — guarding each call site means the next one added is the
 * one that crashes the queue.
 *
 * An old record can't say what is outstanding, so it reads as nothing
 * outstanding and the case returns to its own queue, where a prescriber will
 * see it rather than lose it behind a tab.
 */
function normalise(raw: unknown): Record<string, InfoRequest> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, InfoRequest> = {};
  for (const [ref, v] of Object.entries(raw as Record<string, Partial<InfoRequest>>)) {
    if (!v || typeof v !== "object") continue;
    out[ref] = {
      ref: v.ref ?? ref,
      by: v.by ?? "Unknown",
      subject: v.subject ?? "",
      at: typeof v.at === "number" ? v.at : Date.now(),
      note: v.note,
      items: Array.isArray(v.items) ? v.items.filter((i) => i && typeof i.id === "string") : [],
    };
  }
  return out;
}

function read(): Record<string, InfoRequest> {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? normalise(JSON.parse(raw)) : {};
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
export function requestInfo(ref: string, by: string, subject: string, itemIds: string[], note?: string) {
  write({
    ...read(),
    [ref]: {
      ref,
      by,
      subject,
      at: Date.now(),
      note,
      items: itemIds.map((id) => ({ id, state: "outstanding" as const })),
    },
  });
}

/** Record what the patient sent back for one item. */
export function recordReply(ref: string, itemId: string, reply: Partial<RfiResponseItem>) {
  const map = read();
  const r = map[ref];
  if (!r) return;
  write({
    ...map,
    [ref]: {
      ...r,
      items: r.items.map((i) => (i.id === itemId ? { ...i, ...reply } : i)),
    },
  });
}

/** Everything still waiting on the patient. */
export const outstandingItems = (r: InfoRequest) => (r.items ?? []).filter((i) => i.state === "outstanding");

/**
 * Is the case parked on the patient right now?
 *
 * Having been asked something is not the same as still owing it. A case whose
 * replies have all landed is back to being our problem: it belongs in its own
 * queue, and the waiting clock starts again. Only an outstanding item parks a
 * case — which is also what keeps it out of two tabs at once.
 */
export const isAwaitingPatient = (r: InfoRequest | null | undefined): boolean =>
  !!r && Array.isArray(r.items) && r.items.some((i) => i.state === "outstanding");

/** Refs currently parked on the patient. */
export const awaitingRefs = (map: Record<string, InfoRequest>): Set<string> =>
  new Set(Object.values(map).filter(isAwaitingPatient).map((r) => r.ref));

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
