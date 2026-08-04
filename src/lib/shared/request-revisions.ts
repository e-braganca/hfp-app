// ============================================================================
// Decision revisions — a clinician or admin overturning a past decision
// (approving something that was declined, or pulling back an approval).
// The original PastRequest is never rewritten: a revision is appended, and the
// UI derives the effective outcome. Same localStorage external-store pattern
// as verification / pharmacy-applications, so React reads it with
// useSyncExternalStore. Demo-only — same browser, no backend.
// ============================================================================

import type { PastRequest, RequestOutcome } from "./request-history";

export interface Revision {
  ref: string;
  from: RequestOutcome;
  to: RequestOutcome;
  /** why — mandatory, this is the audit record */
  reason: string;
  by: string;
  on: string; // "4 Aug 2026 · 14:02"
}

const KEY = "hfp-request-revisions";

let cache: Revision[] | undefined; // undefined = not read yet
const listeners = new Set<() => void>();

function read(): Revision[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Revision[]) : [];
  } catch {
    return [];
  }
}

export function subscribeRevisions(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getRevisionsSnapshot(): Revision[] {
  if (cache === undefined) cache = read();
  return cache;
}

const EMPTY: Revision[] = [];
export const getRevisionsServerSnapshot = (): Revision[] => EMPTY;

/** Append a revision. Latest one for a ref wins. */
export function addRevision(r: Revision) {
  const next = [...getRevisionsSnapshot(), r];
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — keep it in memory for this session */
  }
  cache = next;
  listeners.forEach((l) => l());
}

/** The revisions for one ref, oldest first. */
export function revisionsFor(all: Revision[], ref: string): Revision[] {
  return all.filter((r) => r.ref === ref);
}

/** What the decision stands at today — the last revision, or the original. */
export function effectiveOutcome(req: PastRequest, all: Revision[]): RequestOutcome {
  const mine = revisionsFor(all, req.ref);
  return mine.length ? mine[mine.length - 1].to : req.outcome;
}

/** "4 Aug 2026 · 14:02" — how decidedOn is written across the log. */
export function stampNow(d = new Date()): string {
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}
