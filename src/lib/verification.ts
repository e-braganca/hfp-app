// ============================================================================
// Pending verification photos — set when a patient defers the weight photo /
// ID capture during onboarding; cleared by the catch-up wizard at
// /patient/verify. The order sits ON HOLD (no prescriber review, no charge)
// until this is empty. Same localStorage external-store pattern as
// pharmacy-applications so React reads it with useSyncExternalStore.
// ============================================================================

export interface PendingVerification {
  weightPhoto: boolean; // true = still owed
  idDoc: boolean;
  deferredAt: string; // "31 Jul 2026, 15:12"
}

const KEY = "hfp-pending-verification";

let cache: PendingVerification | null | undefined; // undefined = not read yet
const listeners = new Set<() => void>();

function read(): PendingVerification | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingVerification) : null;
  } catch {
    return null;
  }
}

export function subscribeVerification(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getVerificationSnapshot(): PendingVerification | null {
  if (cache === undefined) cache = read();
  return cache;
}

export const getVerificationServerSnapshot = (): PendingVerification | null => null;

export function setPendingVerification(p: PendingVerification | null) {
  if (p) window.localStorage.setItem(KEY, JSON.stringify(p));
  else window.localStorage.removeItem(KEY);
  cache = p;
  listeners.forEach((l) => l());
}
