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

/**
 * The cases that start the demo parked on the patient.
 *
 * There were two seeds doing this before and each side of the platform saw a
 * different set: the admin read a SEED_PAUSED map over in the board clock, the
 * prescriber's queue page seeded this store on mount, and neither knew about
 * the other — so a case the admin had filed under Awaiting info was still
 * sitting claimable on the prescriber's New Orders with a stopped clock.
 *
 * One seed, in the store itself, so both sides read the same board however
 * they arrive at it.
 */
const SEED: (InfoRequest & { hoursAgo: number })[] = [
  {
    ref: "PT-4468",
    by: "Dr. Raymond Okafor",
    subject: "Weight photo unreadable — please retake",
    at: 0,
    hoursAgo: 26,
    // partly answered, so the review screen has both states to show
    items: [
      { id: "body-photos", state: "supplied", attachment: "weight-2026-10-04.jpg", at: "4 Oct 2026 · 19:12" },
      { id: "weight-height", state: "supplied", reply: "112.4 kg, 1.74 m — measured this morning", at: "4 Oct 2026 · 19:14" },
      { id: "photo-id", state: "outstanding" },
    ],
  },
  {
    ref: "PT-2110",
    by: "Dr. Sofia Patel",
    subject: "Tell us more about the GI side effects",
    at: 0,
    hoursAgo: 5,
    items: [
      { id: "side-effects", state: "outstanding" },
      { id: "medication-list", state: "outstanding" },
    ],
  },
  {
    ref: "PT-3126",
    by: "Dr. Eleanor Hart",
    subject: "Confirm your current medication list",
    at: 0,
    hoursAgo: 9,
    items: [{ id: "medication-list", state: "outstanding" }],
  },
];

const seeded = (): Record<string, InfoRequest> =>
  Object.fromEntries(
    SEED.map(({ hoursAgo, ...r }) => [r.ref, { ...r, at: Date.now() - hoursAgo * 3_600_000 }]),
  );

function read(): Record<string, InfoRequest> {
  try {
    const raw = window.localStorage.getItem(KEY);
    // no key at all means a first visit, not an emptied board — seeding on
    // "falsy" instead would resurrect requests the user had just cleared
    if (raw === null) {
      const first = seeded();
      window.localStorage.setItem(KEY, JSON.stringify(first));
      return first;
    }
    return normalise(JSON.parse(raw));
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

