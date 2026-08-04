// ============================================================================
// Admin domain types — Prescriptr / Health Finder Pro
// HFP Admin (governance) side. Mirrors the Figma admin designs (Overview,
// Escalations, Doctors, Pharmacies & SOPs) and legacy adminVals().
// ============================================================================

import type { Rag } from "@/lib/doctor/types";

// ---- Escalations (FC-08) --------------------------------------------------

export type EscalationStatus = "open" | "guidance" | "info" | "declined";

export interface AdminEscalation {
  ref: string;
  patientName: string;
  sex: "Male" | "Female";
  pharmacyCode: string;
  escalatedBy: string;
  waited: string; // "1d", "5h", "2h"
  rag: Rag;
  reason: string; // headline
  med: string; // "Wegovy (semaglutide) · 2.4 mg"
  note?: string; // optional doctor question
  status: EscalationStatus;
}

/** Resolution outcome copy shown once an escalation is resolved. */
export const OUTCOME_LABEL: Record<Exclude<EscalationStatus, "open">, { label: string; rag: Rag }> = {
  guidance: { label: "Returned with guidance", rag: "green" },
  info: { label: "Awaiting patient info", rag: "amber" },
  declined: { label: "Declined — audit-logged", rag: "red" },
};

// ---- Overview (FC-12) -----------------------------------------------------

export interface OverviewKpi {
  label: string;
  value: string;
  sub: string;
  /** highlight the value (e.g. escalations in red) */
  danger?: boolean;
}

export type AttentionKind = "escalated" | "overdue" | "compliance";

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
export type QueueFilter = "green" | "full";
export type CaseCategory = "New Order" | "Simple Repeat" | "Complex Repeat";

export interface AssignedCase {
  ref: string;
  med: string;
  dose: string;
  cat: CaseCategory;
  rag: Rag;
  pharmacy: string;
}

export interface AdminDoctor {
  name: string;
  initials: string;
  gmc: string; // "7041182" or "pending"
  /** compliance %, null while onboarding */
  pct: number | null;
  filter: QueueFilter;
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
