// ============================================================================
// Admin domain types — Prescriptr / Health Finder Pro
// HFP Admin (governance) side: Overview, Current queue, Doctors,
// Pharmacies & SOPs. Escalations are not a page of their own — they are a tab
// on the queue, read off the same board as everything else.
// ============================================================================

import type { Rag } from "@/lib/doctor/types";

// ---- Overview (FC-12) -----------------------------------------------------

export interface OverviewKpi {
  label: string;
  value: string;
  sub: string;
  /** highlight the value (e.g. escalations in red) */
  danger?: boolean;
}

/**
 * Why a row is on the oversight list. `late`/`critical` are generated from
 * the live board rather than seeded: a case nobody claimed for long enough
 * is an operational miss only the admin can see.
 */
export type AttentionKind = "escalated" | "overdue" | "compliance" | "late" | "critical";

export interface AttentionRow {
  kind: AttentionKind;
  title: string;
  sub: string;
  waited?: string;
  waitedRag?: Rag;
  action: "Review" | "View";
  href: string;
}

// ---- Doctors (FC-11) ------------------------------------------------------

export type DoctorStatus = "active" | "suspended" | "onboarding";

/**
 * RAG bands a clinician may work. `granted` is set when they're invited and
 * only an admin can widen it; `access` is what they're pulling right now, and
 * can never exceed what was granted. "all" means every granted band.
 *
 * Note for production: the queue's own clearance model
 * (lib/doctor/clinicians.ts) is seeded separately in this prototype — the two
 * need to read the same record once there's a backend.
 */
export type QueueBand = "green" | "amber" | "red";
export type QueueAccess = QueueBand | "all";

export const QUEUE_BANDS: QueueBand[] = ["green", "amber", "red"];

export const ACCESS_LABEL: Record<QueueAccess, string> = {
  green: "Green only",
  amber: "Amber only",
  red: "Red only",
  all: "All bands",
};
type CaseCategory = "New Order" | "Simple Repeat" | "Complex Repeat";

interface AssignedCase {
  ref: string;
  med: string;
  dose: string;
  cat: CaseCategory;
  rag: Rag;
  pharmacy: string;
}

export interface AdminDoctor {
  name: string;
  /** where the invitation goes, and how they sign in */
  email: string;
  initials: string;
  gmc: string; // "7041182" or "pending"
  /** compliance %, null while onboarding */
  pct: number | null;
  /** bands this clinician is licensed for, set at invitation */
  granted: QueueBand[];
  /** the band they are working right now — a subset of `granted` */
  access: QueueAccess;
  /** account state — set by the admin, independent of who's logged in now */
  status: DoctorStatus;
  /** live platform presence; lastSeen only shown when offline */
  online: boolean;
  lastSeen: string; // "12 min ago" / "Yesterday 18:40"
  cases: AssignedCase[];
}

// ---- Pharmacies & SOPs (FC-10) --------------------------------------------

export interface AdminPharmacy {
  code: string;
  name: string;
  region: string;
  sopVersion: string;
  sopUpdated: string;
  ordersTotal: number;
  compliance: number;
}

/** Editable per-pharmacy SOP parameters extracted during the upload pipeline. */
export interface SopParams {
  bmiMin: number;
  bmiComorbid: number;
  gapWeeks: number;
  maxMj: string;
  maxWg: string;
  reviewMonths: number;
}
