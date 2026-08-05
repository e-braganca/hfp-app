// ============================================================================
// What the patient has logged since the seed data: weekly weights and the
// doses they've actually injected.
//
// One store because the same entries have to read the same on the dashboard,
// on Weight tracking and on My treatment — logging from a modal on one screen
// has to be true on the next. localStorage external store, same pattern as
// the rest of the prototype; production is an API write.
// ============================================================================

import { WEIGHT_LOG, type WeightEntry } from "./data";

export interface DoseEntry {
  /** ISO yyyy-mm-dd — the day it was injected */
  date: string;
  /** the dose as prescribed at the time, recorded for the audit trail */
  dose: string;
}

interface PatientLog {
  weights: WeightEntry[];
  doses: DoseEntry[];
}

const KEY = "hfp-patient-log";
const EMPTY: PatientLog = { weights: [], doses: [] };

let cache: PatientLog | undefined;
const listeners = new Set<() => void>();

function read(): PatientLog {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as PatientLog) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function write(next: PatientLog) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — memory only for this session */
  }
  listeners.forEach((l) => l());
}

export function subscribeLog(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getLogSnapshot(): PatientLog {
  if (cache === undefined) cache = read();
  return cache;
}

export const getLogServerSnapshot = (): PatientLog => EMPTY;

export function logWeight(entry: WeightEntry) {
  const log = getLogSnapshot();
  write({ ...log, weights: [...log.weights, entry] });
}

/** One dose per day — logging the same date twice replaces it rather than doubling. */
export function logDose(entry: DoseEntry) {
  const log = getLogSnapshot();
  write({ ...log, doses: [...log.doses.filter((d) => d.date !== entry.date), entry] });
}

export function undoDose(date: string) {
  const log = getLogSnapshot();
  write({ ...log, doses: log.doses.filter((d) => d.date !== date) });
}

/** Seed entries plus anything logged since, oldest first. */
export function allWeights(log: PatientLog): WeightEntry[] {
  return [...WEIGHT_LOG, ...log.weights];
}

/** Doses newest first — the order every screen shows them in. */
export function allDoses(log: PatientLog): DoseEntry[] {
  return [...log.doses].sort((a, b) => b.date.localeCompare(a.date));
}

/** "12 Aug 2026" from an ISO date, for display next to the seeded strings. */
export function prettyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function todayIso(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * Days since the last recorded injection — the number that decides whether
 * the patient is on schedule, due, or into the territory Rule 4.3 cares about.
 */
export function daysSinceLastDose(doses: DoseEntry[], now = new Date()): number | null {
  const last = allDoses({ weights: [], doses });
  if (!last.length) return null;
  const d = new Date(`${last[0].date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86_400_000));
}
