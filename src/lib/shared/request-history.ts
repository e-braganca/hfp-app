// ============================================================================
// Past medication requests — the decision log behind the live queue.
// Every request that has left the queue lands here with its outcome, who
// decided it, and the SOP version in force at the time. Doctors see their own
// decisions; admins see the whole panel's.
// ============================================================================

import type { Rag } from "@/lib/doctor/types";

export type RequestOutcome = "approved" | "declined" | "info" | "escalated";

export interface PastRequest {
  ref: string;
  /** the patient this belongs to — one patient, many requests over time */
  patientRef: string;
  patientName: string;
  med: string;
  dose: string;
  category: "New Order" | "Simple Repeat" | "Complex Repeat";
  pharmacyCode: string;
  decidedBy: string;
  decidedOn: string; // "2 Aug 2026 · 09:41"
  outcome: RequestOutcome;
  rag: Rag;
  sopVersion: string;
  /** short reason — shown on declines, escalations and info requests */
  note?: string;
}

/** `label` for filters and prose; `short` for the table cell, which is tight. */
export const OUTCOME_META: Record<RequestOutcome, { label: string; short: string; cls: string }> = {
  approved: { label: "Approved & issued", short: "Approved", cls: "bg-success-lighter text-success-dark" },
  declined: { label: "Declined", short: "Declined", cls: "bg-error-lighter text-error-dark" },
  info: { label: "Info requested", short: "Info requested", cls: "bg-warning-lighter text-warning-dark" },
  escalated: { label: "Escalated", short: "Escalated", cls: "bg-info-lighter text-info-dark" },
};

export const PAST_REQUESTS: PastRequest[] = [
  { ref: "PT-4459", patientRef: "PT-4459", patientName: "Owen Fletcher", med: "Mounjaro (tirzepatide)", dose: "5 mg", category: "Simple Repeat", pharmacyCode: "WB", decidedBy: "Dr. Eleanor Hart", decidedOn: "2 Aug 2026 · 09:41", outcome: "approved", rag: "green", sopVersion: "v3.2" },
  { ref: "PT-4457", patientRef: "PT-4457", patientName: "Meera Kapoor", med: "Wegovy (semaglutide)", dose: "1.0 mg", category: "Simple Repeat", pharmacyCode: "MX", decidedBy: "Dr. Eleanor Hart", decidedOn: "2 Aug 2026 · 09:22", outcome: "approved", rag: "green", sopVersion: "v3.0" },
  { ref: "PT-4455", patientRef: "PT-4455", patientName: "Tom Bright", med: "Mounjaro (tirzepatide)", dose: "2.5 mg", category: "New Order", pharmacyCode: "PD", decidedBy: "Dr. Raymond Okafor", decidedOn: "2 Aug 2026 · 08:57", outcome: "info", rag: "amber", sopVersion: "v3.1", note: "Weight photo unreadable — new live capture requested" },
  { ref: "PT-4452", patientRef: "PT-4452", patientName: "Sadia Rahman", med: "Wegovy (semaglutide)", dose: "0.25 mg", category: "New Order", pharmacyCode: "CP", decidedBy: "Dr. Julia Reyes", decidedOn: "1 Aug 2026 · 17:12", outcome: "approved", rag: "green", sopVersion: "v2.9" },
  { ref: "PT-4448", patientRef: "PT-4448", patientName: "Gavin Muir", med: "Mounjaro (tirzepatide)", dose: "10 mg", category: "Complex Repeat", pharmacyCode: "WB", decidedBy: "Dr. Eleanor Hart", decidedOn: "1 Aug 2026 · 16:03", outcome: "escalated", rag: "red", sopVersion: "v3.2", note: "Dose escalation above SOP max — senior review" },
  { ref: "PT-4444", patientRef: "PT-4444", patientName: "Nia Thompson", med: "Wegovy (semaglutide)", dose: "0.5 mg", category: "New Order", pharmacyCode: "NC", decidedBy: "Dr. Sofia Patel", decidedOn: "1 Aug 2026 · 14:30", outcome: "declined", rag: "red", sopVersion: "v3.1", note: "BMI 26.4 — below Rule 1.1 floor, no qualifying comorbidity" },
  { ref: "PT-4441", patientRef: "PT-4441", patientName: "Ivan Petrov", med: "Mounjaro (tirzepatide)", dose: "7.5 mg", category: "Simple Repeat", pharmacyCode: "RS", decidedBy: "Dr. Raymond Okafor", decidedOn: "1 Aug 2026 · 11:48", outcome: "approved", rag: "green", sopVersion: "v3.1" },
  { ref: "PT-4438", patientRef: "PT-4438", patientName: "Ruth Ellery", med: "Wegovy (semaglutide)", dose: "2.4 mg", category: "Complex Repeat", pharmacyCode: "MX", decidedBy: "Dr. Eleanor Hart", decidedOn: "31 Jul 2026 · 18:20", outcome: "approved", rag: "amber", sopVersion: "v3.0", note: "Continuation review — 9.2% loss at 6 months, continued" },
  { ref: "PT-4433", patientRef: "PT-4433", patientName: "Leon Baptiste", med: "Mounjaro (tirzepatide)", dose: "2.5 mg", category: "New Order", pharmacyCode: "PD", decidedBy: "Dr. Julia Reyes", decidedOn: "31 Jul 2026 · 15:05", outcome: "declined", rag: "red", sopVersion: "v3.1", note: "History of pancreatitis disclosed at safety screening" },
  { ref: "PT-4429", patientRef: "PT-4429", patientName: "Amelia Frost", med: "Wegovy (semaglutide)", dose: "1.7 mg", category: "Simple Repeat", pharmacyCode: "WB", decidedBy: "Dr. Tomas Bowen", decidedOn: "31 Jul 2026 · 12:44", outcome: "approved", rag: "green", sopVersion: "v3.2" },
  { ref: "PT-4425", patientRef: "PT-4425", patientName: "Hassan Ali", med: "Mounjaro (tirzepatide)", dose: "5 mg", category: "Complex Repeat", pharmacyCode: "CP", decidedBy: "Dr. Eleanor Hart", decidedOn: "30 Jul 2026 · 16:31", outcome: "info", rag: "amber", sopVersion: "v2.9", note: "8-week treatment gap — asked why dosing paused" },
  { ref: "PT-4419", patientRef: "PT-4419", patientName: "Grace Whitmore", med: "Wegovy (semaglutide)", dose: "0.25 mg", category: "New Order", pharmacyCode: "NC", decidedBy: "Dr. Sofia Patel", decidedOn: "30 Jul 2026 · 10:15", outcome: "approved", rag: "green", sopVersion: "v3.1" },
  { ref: "PT-4412", patientRef: "PT-4412", patientName: "Daniel O'Connor", med: "Mounjaro (tirzepatide)", dose: "12.5 mg", category: "Complex Repeat", pharmacyCode: "RS", decidedBy: "Dr. Raymond Okafor", decidedOn: "29 Jul 2026 · 17:52", outcome: "escalated", rag: "amber", sopVersion: "v3.1", note: "Patient requested faster titration than SOP allows" },
  { ref: "PT-4408", patientRef: "PT-4408", patientName: "Beth Kowalski", med: "Wegovy (semaglutide)", dose: "1.0 mg", category: "Simple Repeat", pharmacyCode: "MX", decidedBy: "Dr. Eleanor Hart", decidedOn: "29 Jul 2026 · 09:08", outcome: "approved", rag: "green", sopVersion: "v3.0" },
  { ref: "PT-4401", patientRef: "PT-4401", patientName: "Marcus Reid", med: "Mounjaro (tirzepatide)", dose: "2.5 mg", category: "New Order", pharmacyCode: "WB", decidedBy: "Dr. Julia Reyes", decidedOn: "28 Jul 2026 · 14:19", outcome: "approved", rag: "green", sopVersion: "v3.2" },
  { ref: "PT-4396", patientRef: "PT-4396", patientName: "Yuki Tanaka", med: "Wegovy (semaglutide)", dose: "0.5 mg", category: "New Order", pharmacyCode: "PD", decidedBy: "Dr. Tomas Bowen", decidedOn: "28 Jul 2026 · 11:02", outcome: "declined", rag: "red", sopVersion: "v3.1", note: "Age 17 — below the 18–74 treatable range" },

  // Repeats belonging to patients on the unified record, so their detail page
  // shows a real course of treatment rather than a single row.
  { ref: "RQ-2087-3", patientRef: "PT-2087", patientName: "James Mitchell", med: "Mounjaro (tirzepatide)", dose: "7.5 mg", category: "Simple Repeat", pharmacyCode: "MX", decidedBy: "Dr. Raymond Okafor", decidedOn: "12 Jan 2026 · 10:15", outcome: "approved", rag: "green", sopVersion: "v3.0" },
  { ref: "RQ-2087-2", patientRef: "PT-2087", patientName: "James Mitchell", med: "Mounjaro (tirzepatide)", dose: "5 mg", category: "Simple Repeat", pharmacyCode: "MX", decidedBy: "Dr. Eleanor Hart", decidedOn: "10 Nov 2025 · 16:40", outcome: "approved", rag: "green", sopVersion: "v3.0" },
  { ref: "RQ-2087-1", patientRef: "PT-2087", patientName: "James Mitchell", med: "Mounjaro (tirzepatide)", dose: "2.5 mg", category: "New Order", pharmacyCode: "MX", decidedBy: "Dr. Eleanor Hart", decidedOn: "6 Oct 2025 · 09:05", outcome: "approved", rag: "green", sopVersion: "v2.9" },
  { ref: "RQ-3542-2", patientRef: "PT-3542", patientName: "Robert Smith", med: "Mounjaro (tirzepatide)", dose: "5 mg", category: "Complex Repeat", pharmacyCode: "CP", decidedBy: "Dr. Sofia Patel", decidedOn: "12 Sep 2026 · 14:22", outcome: "info", rag: "amber", sopVersion: "v2.9", note: "Blood pressure readings requested before continuing" },
  { ref: "RQ-3542-1", patientRef: "PT-3542", patientName: "Robert Smith", med: "Mounjaro (tirzepatide)", dose: "5 mg", category: "Simple Repeat", pharmacyCode: "CP", decidedBy: "Dr. Sofia Patel", decidedOn: "8 Aug 2026 · 11:37", outcome: "approved", rag: "green", sopVersion: "v2.9" },
  { ref: "RQ-4873-2", patientRef: "PT-4873", patientName: "Lily Chang", med: "Wegovy (semaglutide)", dose: "0.5 mg", category: "Simple Repeat", pharmacyCode: "WB", decidedBy: "Dr. Julia Reyes", decidedOn: "15 Aug 2026 · 08:44", outcome: "approved", rag: "green", sopVersion: "v3.2" },
  { ref: "RQ-4873-1", patientRef: "PT-4873", patientName: "Lily Chang", med: "Wegovy (semaglutide)", dose: "0.25 mg", category: "New Order", pharmacyCode: "WB", decidedBy: "Dr. Julia Reyes", decidedOn: "18 Jul 2026 · 13:02", outcome: "approved", rag: "amber", sopVersion: "v3.2", note: "BMI 28.0 with PCOS — approved on comorbidity" },
  { ref: "RQ-4286-1", patientRef: "PT-4286", patientName: "Ryan Lee", med: "Wegovy (semaglutide)", dose: "2.0 mg", category: "Complex Repeat", pharmacyCode: "MX", decidedBy: "Dr. Raymond Okafor", decidedOn: "5 Nov 2026 · 17:20", outcome: "declined", rag: "red", sopVersion: "v3.0", note: "Dose above the step the titration record supports" },
  { ref: "RQ-4471-1", patientRef: "PT-4471", patientName: "Aisha Khan", med: "Mounjaro (tirzepatide)", dose: "2.5 mg", category: "New Order", pharmacyCode: "WB", decidedBy: "Dr. Eleanor Hart", decidedOn: "2 Aug 2026 · 10:40", outcome: "approved", rag: "green", sopVersion: "v3.2" },
];
