// ============================================================================
// Pharmacy partner applications — the bridge between the public registration
// wizard (/pharmacies/register) and the admin review queue (Pharmacies & SOPs).
// Demo persistence is localStorage; production is an API + review workflow.
// ============================================================================

export interface PharmacyApplication {
  id: string;
  business: string;
  responsibleName: string;
  responsibleEmail: string;
  phone: string; // dial code + national
  address: string;
  coverage: string[]; // e.g. ["England", "Wales"]
  meds: string[]; // e.g. ["Mounjaro (tirzepatide)"]
  sopFileName: string;
  submittedAt: string; // "31 Jul 2026, 14:02"
}

export const COVERAGE_AREAS = ["England", "Scotland", "Wales", "Northern Ireland"] as const;

export const SUPPLY_MEDS = [
  "Mounjaro (tirzepatide)",
  "Wegovy (semaglutide)",
  "Saxenda (liraglutide)",
  "Ozempic (semaglutide · T2DM only)",
  "Orlistat",
] as const;

const KEY = "hfp-pharmacy-applications";

/* Tiny external store over localStorage so React components can read it with
   useSyncExternalStore (SSR-safe, no setState-in-effect). The snapshot is
   cached so its reference stays stable between mutations. */

const EMPTY: PharmacyApplication[] = [];
let cache: PharmacyApplication[] | null = null;
const listeners = new Set<() => void>();

function read(): PharmacyApplication[] {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as PharmacyApplication[];
  } catch {
    return EMPTY;
  }
}

function write(apps: PharmacyApplication[]) {
  window.localStorage.setItem(KEY, JSON.stringify(apps));
  cache = apps;
  listeners.forEach((l) => l());
}

export function subscribeApplications(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getApplicationsSnapshot(): PharmacyApplication[] {
  if (cache === null) cache = read();
  return cache;
}

export const getApplicationsServerSnapshot = (): PharmacyApplication[] => EMPTY;

export function saveApplication(app: PharmacyApplication) {
  write([...getApplicationsSnapshot(), app]);
}

export function removeApplication(id: string) {
  write(getApplicationsSnapshot().filter((a) => a.id !== id));
}
