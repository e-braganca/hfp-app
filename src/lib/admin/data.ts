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
    detail: {
      nhs: "702 118 4430", age: 54, bmi: 33.8, ethnicity: "White British",
      comorbidities: ["Hypertension", "Osteoarthritis"],
      history: [
        { label: "Started 0.25 mg", date: "8 Dec 2025" },
        { label: "Escalated to 1.0 mg", date: "2 Feb 2026" },
        { label: "Escalated to 1.7 mg", date: "16 Mar 2026" },
        { label: "Escalated to 2.4 mg", date: "27 Apr 2026" },
        { label: "6-month review — 3.1% total loss", date: "8 Jun 2026", flag: true, detail: "Below the 5% continuation threshold (Rule 6.2)" },
        { label: "Repeat requested", date: "2 Aug 2026 · today" },
      ],
      ai: {
        basis: "Auto-scored against SOP Rule 6.2 — 6-month continuation review",
        score: { rag: "red", confidence: 94 },
        title: "Discontinue — continuation threshold not met.",
        body: "Six months at target dose has produced 3.1% total body-weight loss against the 5% floor Rule 6.2 sets for continuing. Adherence is documented and the titration was correct, so this is a non-response rather than a dosing failure.",
        checks: [
          "Full titration completed — 0.25 mg to 2.4 mg over 20 weeks, no steps skipped",
          "Weight logs complete for 24 of 26 weeks — non-response is not an adherence artefact",
          "No contraindication has emerged; the block is efficacy, not safety",
        ],
        recommendedRx: "Discontinue Wegovy · offer a tirzepatide switch review",
      },
      orderRequest: { med: "Wegovy (semaglutide) 2.4 mg", detail: "4-week supply · self-requested repeat", meta: "PharmaDirect · 2 Aug 2026" },
      sopCitation: {
        rule: "SOP RULE 6.2", version: "v3.1",
        quote: "Discontinue where total weight loss is below 5% at the six-month review, unless a documented clinical rationale for continuation is recorded.",
      },
    },
  },
  {
    ref: "PT-2071", patientName: "Callum Wright", sex: "Male", pharmacyCode: "MX", escalatedBy: "Dr. Julia Reyes", waited: "5h", rag: "red",
    reason: "Dose escalation above SOP max", med: "Wegovy (semaglutide) · 2.4 mg",
    status: "open",
    detail: {
      nhs: "418 903 2271", age: 41, bmi: 36.2, ethnicity: "White British",
      comorbidities: ["Type 2 diabetes", "OSA"],
      history: [
        { label: "Started 0.25 mg", date: "19 Jan 2026" },
        { label: "Escalated to 1.0 mg", date: "16 Mar 2026" },
        { label: "Escalated to 1.7 mg", date: "20 Apr 2026" },
        { label: "Escalated to 2.4 mg", date: "18 May 2026" },
        { label: "Patient requested 3.0 mg", date: "1 Aug 2026", flag: true, detail: "Above the licensed 2.4 mg maximum for semaglutide (Rule 2.4)" },
      ],
      ai: {
        basis: "Auto-scored against SOP Rule 2.4 — maximum licensed dose",
        score: { rag: "red", confidence: 99 },
        title: "Refuse the increase — 2.4 mg is the ceiling.",
        body: "The patient is already at the maximum licensed weekly dose for semaglutide. There is no SOP or licence route to 3.0 mg, so the only clinical options are continuing at 2.4 mg or reviewing a switch to tirzepatide, where the licensed ceiling is higher.",
        checks: [
          "Response is on track — 11.4% total loss at 6 months, well above the Rule 6.2 floor",
          "No tolerance issues logged; the request is patient-driven, not clinician-driven",
          "Tirzepatide switch would need a fresh titration from 2.5 mg under Rule 2.2",
        ],
        recommendedRx: "Continue Wegovy 2.4 mg · decline the increase",
      },
      orderRequest: { med: "Wegovy (semaglutide) 3.0 mg", detail: "4-week supply · dose increase requested", meta: "MedExpress UK · 1 Aug 2026" },
      sopCitation: {
        rule: "SOP RULE 2.4", version: "v3.0",
        quote: "Do not exceed the maximum licensed dose for the product. Requests above the ceiling must be refused and, where appropriate, reviewed as a product switch.",
      },
    },
  },
  {
    ref: "PT-2087", patientName: "James Mitchell", sex: "Male", pharmacyCode: "PD", escalatedBy: "Dr. Tomas Bowen", waited: "2h", rag: "amber",
    reason: "7-week treatment gap", med: "Mounjaro (tirzepatide) · 7.5 mg",
    note: "Gap was due to a supply issue. Is re-titration still mandatory?",
    status: "open",
    detail: {
      nhs: "553 220 8814", age: 47, bmi: 31.4, ethnicity: "Black Caribbean",
      comorbidities: ["Hypertension"],
      history: [
        { label: "Started 2.5 mg", date: "6 Oct 2025" },
        { label: "Escalated to 5 mg", date: "10 Nov 2025" },
        { label: "Escalated to 7.5 mg", date: "12 Jan 2026" },
        { label: "Last dispensed — 4-week supply", date: "15 Mar 2026" },
        { label: "7-week treatment gap", date: "12 Apr 2026 → 3 Jun 2026", flag: true, gap: true, detail: "Exceeds the 6-week re-titration trigger (Rule 4.3)" },
        { label: "Repeat requested at 7.5 mg", date: "2 Aug 2026 · today" },
      ],
      ai: {
        basis: "Auto-scored against SOP Rule 4.3 — treatment gaps",
        score: { rag: "amber", confidence: 91 },
        title: "Re-titrate — resume one dose level below.",
        body: "A 7-week gap crosses the 6-week trigger, so gastrointestinal tolerance can no longer be assumed at 7.5 mg. Rule 4.3 makes no exception for the cause of the gap: the risk it manages is loss of tolerance, which a supply issue produces just as readily as non-adherence.",
        checks: [
          "Gap of 7 weeks confirmed against dispensing records at PharmaDirect",
          "No adverse events logged before the interruption — tolerance was good at 7.5 mg",
          "Restarting at 5 mg allows re-escalation after 4 weeks under Rule 2.2",
        ],
        recommendedRx: "Mounjaro 5 mg · 4-week supply, re-escalate at review",
      },
      orderRequest: { med: "Mounjaro (tirzepatide) 7.5 mg", detail: "4-week supply · self-requested repeat", meta: "PharmaDirect · 2 Aug 2026" },
      sopCitation: {
        rule: "SOP RULE 4.3", version: "v3.1",
        quote: "A treatment gap greater than 6 weeks requires re-titration — restart one dose level below and reassess.",
      },
    },
  },
  {
    ref: "PT-4461", patientName: "Zainab Hussain", sex: "Female", pharmacyCode: "RS", escalatedBy: "Dr. Sofia Patel", waited: "1h", rag: "amber",
    reason: "Pregnancy flag, breastfeeding unconfirmed", med: "Wegovy (semaglutide) · 0.25 mg",
    note: "Patient reply is ambiguous. Do we need midwife confirmation before issuing?",
    status: "open",
    detail: {
      nhs: "690 447 1052", age: 33, bmi: 30.9, ethnicity: "Pakistani",
      comorbidities: [],
      history: [
        { label: "Assessment submitted", date: "28 Jul 2026" },
        { label: "Safety screening — pregnancy question answered 'No'", date: "28 Jul 2026" },
        { label: "Patient message: \"not pregnant, still feeding my youngest sometimes\"", date: "1 Aug 2026", flag: true, detail: "Breastfeeding is a contraindication in its own right (Rule 3.1)" },
      ],
      ai: {
        basis: "Auto-scored against SOP Rule 3.1 — absolute contraindications",
        score: { rag: "amber", confidence: 88 },
        title: "Hold — confirm breastfeeding status before issuing.",
        body: "The screening answer rules out pregnancy but the patient's own message describes ongoing breastfeeding, which Rule 3.1 treats as an absolute contraindication independently. The record cannot be resolved from what is on file; it needs an unambiguous answer, not an inference.",
        checks: [
          "BMI 30.9 meets Rule 1.1 on its own — eligibility is not the blocker",
          "No other contraindication flagged across the five safety questions",
          "A clear 'no longer breastfeeding' reply is sufficient; midwife sign-off is not required by the SOP",
        ],
        recommendedRx: "No prescription until breastfeeding status is confirmed",
      },
      orderRequest: { med: "Wegovy (semaglutide) 0.25 mg", detail: "4-week starter supply · new order", meta: "RightScript · 28 Jul 2026" },
      sopCitation: {
        rule: "SOP RULE 3.1", version: "v3.1",
        quote: "Do not initiate in patients who are pregnant, breastfeeding, or planning a pregnancy. Where status is unclear, hold the order until confirmed in writing.",
      },
    },
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
