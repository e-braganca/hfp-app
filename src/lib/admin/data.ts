// ============================================================================
// Admin mock data — Prescriptr / Health Finder Pro
// Seed mirrors the Figma admin designs (Overview, Escalations, Doctors,
// Pharmacies & SOPs). Shares pharmacies/protocols with the doctor domain.
// ============================================================================

import { PHARMACIES } from "@/lib/doctor/data";
import type {
  AdminDoctor,
  AdminEscalation,
  AdminPharmacy,
  AttentionRow,
  OverviewKpi,
} from "./types";

// ---- Overview -------------------------------------------------------------

export const OVERVIEW_KPIS: OverviewKpi[] = [
  { label: "Pending prescriptions", value: "36", sub: "across 6 connected pharmacies" },
  { label: "Escalations", value: "5", sub: "awaiting senior review", danger: true },
  { label: "Active doctors", value: "6", sub: "3 onboarding" },
  { label: "Avg SOP compliance", value: "94%", sub: "target ≥ 90% per pharmacy" },
];

export const ATTENTION_ROWS: AttentionRow[] = [
  { kind: "escalated", title: "PT-2043 — No weight loss at 6 months", sub: "Dr. Mads Lindqvist · RightScript", waited: "Waiting 1d", waitedRag: "red", action: "Review", href: "/admin/escalations" },
  { kind: "escalated", title: "PT-2071 — Dose escalation above SOP max", sub: "Dr. Julia Reyes · MedExpress UK", waited: "Waiting 5h", waitedRag: "amber", action: "Review", href: "/admin/escalations" },
  { kind: "escalated", title: "PT-2062 — Adverse reaction to medication", sub: "Dr. Liam Chen · CarePoint Online", waited: "Waiting 4h", waitedRag: "amber", action: "Review", href: "/admin/escalations" },
  { kind: "escalated", title: "PT-2095 — Elevated blood pressure readings", sub: "Dr. Sarah Kahn · Nuffield Chemist", waited: "Waiting 3h", waitedRag: "green", action: "Review", href: "/admin/escalations" },
  { kind: "escalated", title: "PT-2087 — 7-week treatment gap", sub: "Dr. Tomas Bowen · Willowbrook Pharmacy", waited: "Waiting 2h", waitedRag: "green", action: "Review", href: "/admin/escalations" },
  { kind: "overdue", title: "PT-4459 — information request unanswered for 3 days", sub: "RightScript · Patient reminded twice", action: "View", href: "/admin/escalations" },
  { kind: "compliance", title: "CarePoint Online at 83% SOP compliance — below the 90% target", sub: "Review overrides and SOP parameters with the pharmacy", action: "View", href: "/admin/pharmacies" },
];

// ---- Escalations ----------------------------------------------------------

export const ADMIN_ESCALATIONS: AdminEscalation[] = [
  {
    ref: "PT-2043", patientName: "Helen Roberts", sex: "Female", pharmacyCode: "PD", escalatedBy: "Dr. Mads Lindqvist", waited: "1d", rag: "red",
    reason: "No weight loss at 6 months", med: "Wegovy (semaglutide) · 2.4 mg",
    note: "Patient adamant it works — SOP 6.2 says discontinue below 5%. Second opinion?",
    status: "open",
  },
  {
    ref: "PT-2071", patientName: "Callum Wright", sex: "Male", pharmacyCode: "MX", escalatedBy: "Dr. Julia Reyes", waited: "5h", rag: "red",
    reason: "Dose escalation above SOP max", med: "Wegovy (semaglutide) · 2.4 mg",
    status: "open",
  },
  {
    ref: "PT-2087", patientName: "James Mitchell", sex: "Male", pharmacyCode: "PD", escalatedBy: "Dr. Tomas Bowen", waited: "2h", rag: "amber",
    reason: "7-week treatment gap", med: "Mounjaro (tirzepatide) · 7.5 mg",
    note: "Gap was due to a supply issue. Is re-titration still mandatory?",
    status: "open",
  },
  {
    ref: "PT-4461", patientName: "Zainab Hussain", sex: "Female", pharmacyCode: "RS", escalatedBy: "Dr. Sofia Patel", waited: "1h", rag: "amber",
    reason: "Pregnancy flag, breastfeeding unconfirmed", med: "Wegovy (semaglutide) · 0.25 mg",
    note: "Patient reply is ambiguous. Do we need midwife confirmation before issuing?",
    status: "open",
  },
];

// ---- Doctors --------------------------------------------------------------

const eleanorCases: AdminDoctor["cases"] = [
  { ref: "PT-4471", med: "Mounjaro (tirzepatide)", dose: "7.5 mg", cat: "New Order", rag: "green", pharmacy: "MedExpress UK" },
  { ref: "PT-4463", med: "Mounjaro (tirzepatide)", dose: "2.5 mg", cat: "New Order", rag: "green", pharmacy: "RightScript" },
  { ref: "PT-3120", med: "Wegovy (semaglutide)", dose: "1.0 mg", cat: "Simple Repeat", rag: "green", pharmacy: "Nuffield Chemist" },
  { ref: "PT-4458", med: "Mounjaro (tirzepatide)", dose: "7.5 mg", cat: "Complex Repeat", rag: "amber", pharmacy: "MedExpress UK" },
  { ref: "PT-4501", med: "Ozempic (semaglutide)", dose: "0.25 mg", cat: "New Order", rag: "green", pharmacy: "PharmaDirect" },
  { ref: "PT-4460", med: "Wegovy (semaglutide)", dose: "1.7 mg", cat: "Simple Repeat", rag: "green", pharmacy: "Willowbrook Pharmacy" },
  { ref: "PT-4482", med: "Wegovy (semaglutide)", dose: "2.4 mg", cat: "New Order", rag: "green", pharmacy: "CarePoint Online" },
  { ref: "PT-4495", med: "Ozempic (semaglutide)", dose: "0.5 mg", cat: "Complex Repeat", rag: "red", pharmacy: "MedExpress UK" },
];

export const ADMIN_DOCTORS: AdminDoctor[] = [
  { name: "Dr. Eleanor Hart", initials: "EH", gmc: "7041182", pct: 99, filter: "full", status: "active", online: true, lastSeen: "now", cases: eleanorCases },
  {
    name: "Dr. Raymond Okafor", initials: "RO", gmc: "6893021", pct: 98, filter: "full", status: "active", online: true, lastSeen: "now",
    cases: [
      { ref: "PT-4470", med: "Wegovy (semaglutide)", dose: "0.25 mg", cat: "New Order", rag: "green", pharmacy: "MedExpress UK" },
      { ref: "PT-2051", med: "Mounjaro (tirzepatide)", dose: "5.0 mg", cat: "Complex Repeat", rag: "amber", pharmacy: "PharmaDirect" },
    ],
  },
  {
    name: "Dr. Sofia Patel", initials: "SP", gmc: "7455610", pct: 97, filter: "full", status: "active", online: false, lastSeen: "12 min ago",
    cases: [
      { ref: "PT-4468", med: "Mounjaro (tirzepatide)", dose: "2.5 mg", cat: "New Order", rag: "amber", pharmacy: "PharmaDirect" },
      { ref: "PT-4461", med: "Wegovy (semaglutide)", dose: "0.25 mg", cat: "New Order", rag: "amber", pharmacy: "RightScript" },
    ],
  },
  {
    name: "Dr. Julia Reyes", initials: "JR", gmc: "7788123", pct: 86, filter: "full", status: "active", online: true, lastSeen: "now",
    cases: [
      { ref: "PT-2071", med: "Wegovy (semaglutide)", dose: "2.4 mg", cat: "Complex Repeat", rag: "red", pharmacy: "MedExpress UK" },
      { ref: "PT-2059", med: "Mounjaro (tirzepatide)", dose: "10 mg", cat: "Complex Repeat", rag: "amber", pharmacy: "Willowbrook Pharmacy" },
    ],
  },
  {
    name: "Dr. Tomas Bowen", initials: "TB", gmc: "8012456", pct: 80, filter: "green", status: "active", online: false, lastSeen: "1 h ago",
    cases: [
      { ref: "PT-3120", med: "Wegovy (semaglutide)", dose: "1.0 mg", cat: "Simple Repeat", rag: "green", pharmacy: "Willowbrook Pharmacy" },
      { ref: "PT-3122", med: "Ozempic (semaglutide)", dose: "0.5 mg", cat: "Simple Repeat", rag: "green", pharmacy: "PharmaDirect" },
    ],
  },
  { name: "Dr. Hannah Cole", initials: "HC", gmc: "pending", pct: null, filter: "green", status: "onboarding", online: false, lastSeen: "Never signed in", cases: [] },
];

// ---- Pharmacies & SOPs ----------------------------------------------------

const ORDERS_TOTAL: Record<string, number> = {
  WB: 117, MX: 139, PD: 89, CP: 105, NC: 134, RS: 78,
};

export const ADMIN_PHARMACIES: AdminPharmacy[] = PHARMACIES.map((p) => ({
  code: p.code,
  name: p.name,
  region: `${p.region}, UK`,
  sopVersion: p.sopVersion,
  sopUpdated: p.sopUpdated,
  ordersTotal: ORDERS_TOTAL[p.code] ?? 100,
  compliance: p.compliance,
}));
