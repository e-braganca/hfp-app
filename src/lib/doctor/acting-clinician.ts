// ============================================================================
// Who this browser tab is signed in as.
//
// sessionStorage on purpose: claims live in localStorage (shared across
// windows) while identity is per-tab, so two windows side by side are two
// different prescribers on the same board. That's the whole demo — open a
// second window, switch clinician, watch the claims interact.
// ============================================================================

import { CLINICIANS, DEFAULT_CLINICIAN, clinicianByName, type Clinician } from "./clinicians";

const KEY = "hfp-acting-clinician";

let cache: string | undefined;
const listeners = new Set<() => void>();

export function subscribeActing(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getActingSnapshot(): string {
  if (cache === undefined) {
    try {
      cache = window.sessionStorage.getItem(KEY) ?? DEFAULT_CLINICIAN.name;
    } catch {
      cache = DEFAULT_CLINICIAN.name;
    }
  }
  return cache;
}

export const getActingServerSnapshot = (): string => DEFAULT_CLINICIAN.name;

export function setActing(name: string) {
  cache = name;
  try {
    window.sessionStorage.setItem(KEY, name);
  } catch {
    /* ignore — in-memory for this session */
  }
  listeners.forEach((l) => l());
}

export function actingClinician(name: string): Clinician {
  return clinicianByName(name);
}

export { CLINICIANS };
