// ============================================================================
// Doctor mock data — Prescriptr / Health Finder Pro
// Seed data mirrors the Figma doctor designs (node 17491 Work Queue + details,
// 17546 Patients, 17547 Pharmacies, 17550 Protocols, 17560 Compliance).
// No backend yet — these drive the UI exactly as the legacy demo did.
// ============================================================================

import type {
  ComplexCase,
  ComplianceRow,
  Escalation,
  NewOrder,
  Patient,
  Pharmacy,
  Protocol,
  QueueMetric,
  SimpleRepeat,
} from "./types";

// ---- Pharmacies -----------------------------------------------------------

export const PHARMACIES: Pharmacy[] = [
  { code: "WB", name: "Willowbrook Pharmacy", region: "London", postcode: "SE1", ordersToday: 14, compliance: 99, sopVersion: "v3.2", sopUpdated: "12 May 2026", connected: true },
  { code: "MX", name: "MedExpress UK", region: "Manchester", postcode: "M1", ordersToday: 11, compliance: 98, sopVersion: "v3.0", sopUpdated: "2 May 2026", connected: true },
  { code: "PD", name: "PharmaDirect", region: "Leeds", postcode: "LS1", ordersToday: 9, compliance: 95, sopVersion: "v3.1", sopUpdated: "28 Apr 2026", connected: true },
  { code: "CP", name: "CarePoint Online", region: "Birmingham", postcode: "B1", ordersToday: 7, compliance: 83, sopVersion: "v2.9", sopUpdated: "9 Apr 2026", connected: true },
  { code: "NC", name: "Nuffield Chemist", region: "Bristol", postcode: "BS1", ordersToday: 8, compliance: 97, sopVersion: "v3.1", sopUpdated: "1 May 2026", connected: true },
  { code: "RS", name: "RightScript", region: "Glasgow", postcode: "G1", ordersToday: 6, compliance: 91, sopVersion: "v3.1", sopUpdated: "3 May 2026", connected: true },
];

const PHARMACY_BY_CODE = new Map(PHARMACIES.map((p) => [p.code, p]));
export const pharmacyName = (code: string) =>
  PHARMACY_BY_CODE.get(code)?.name ?? code;

// ---- SOPs / Protocols -----------------------------------------------------
// buildRules mirrors legacy doctor.js buildRules(): six rules per pharmacy,
// parameterised by BMI floor, treatment-gap weeks and max doses.

interface ProtoParams {
  bmiMin: number;
  gap: number;
  maxMj: string;
  maxWg: string;
}

const PROTO_PARAMS: Record<string, ProtoParams> = {
  WB: { bmiMin: 30, gap: 6, maxMj: "15 mg", maxWg: "2.4 mg" },
  MX: { bmiMin: 30, gap: 6, maxMj: "15 mg", maxWg: "2.4 mg" },
  PD: { bmiMin: 32, gap: 8, maxMj: "12.5 mg", maxWg: "1.7 mg" },
  CP: { bmiMin: 30, gap: 4, maxMj: "12.5 mg", maxWg: "1.7 mg" },
  NC: { bmiMin: 30, gap: 6, maxMj: "15 mg", maxWg: "2.4 mg" },
  RS: { bmiMin: 30, gap: 6, maxMj: "15 mg", maxWg: "2.4 mg" },
};

const PROTO_META: Record<string, { version: string; updated: string; pages: number }> = {
  WB: { version: "v3.2", updated: "12 May 2026", pages: 12 },
  MX: { version: "v3.0", updated: "2 May 2026", pages: 11 },
  PD: { version: "v3.1", updated: "28 Apr 2026", pages: 13 },
  CP: { version: "v2.9", updated: "9 Apr 2026", pages: 10 },
  NC: { version: "v3.1", updated: "1 May 2026", pages: 12 },
  RS: { version: "v3.1", updated: "3 May 2026", pages: 11 },
};

function buildProtocol(code: string): Protocol {
  const p = PROTO_PARAMS[code];
  const meta = PROTO_META[code];
  return {
    pharmacyCode: code,
    version: meta.version,
    updated: meta.updated,
    pages: meta.pages,
    rules: [
      { n: "1.1", title: "Eligibility", text: `BMI ≥ ${p.bmiMin}, or ≥ ${p.bmiMin - 3} with a qualifying comorbidity (T2DM, hypertension, OSA).` },
      { n: "2.2", title: "Titration", text: "Escalate by one dose level no sooner than every 4 weeks, tolerance permitting." },
      { n: "3.1", title: "Contraindications", text: "Do not initiate with personal or family history of medullary thyroid carcinoma, MEN-2, or pancreatitis." },
      { n: "4.3", title: "Treatment gaps", text: `A treatment gap greater than ${p.gap} weeks requires re-titration — restart one dose level below and reassess.`, flag: true },
      { n: "5.1", title: "Maximum dose", text: `Mounjaro ${p.maxMj} · Wegovy ${p.maxWg}. Do not exceed without specialist sign-off.` },
      { n: "6.2", title: "Continuation review", text: "Reassess at 6 months; discontinue if < 5% body-weight reduction is achieved." },
    ],
  };
}

export const PROTOCOLS: Protocol[] = PHARMACIES.map((p) => buildProtocol(p.code));
export const protocolFor = (code: string) =>
  PROTOCOLS.find((p) => p.pharmacyCode === code) ?? PROTOCOLS[0];

// ---- Queue metrics --------------------------------------------------------

export const QUEUE_METRICS: QueueMetric[] = [
  { label: "New Orders", thisWeek: 34, open: 7 },
  { label: "Simple Repeats", thisWeek: 28, open: 23 },
  { label: "Complex Repeats", thisWeek: 15, open: 5 },
  { label: "Escalated Requests", open: 3 },
];

// ---- New orders -----------------------------------------------------------

export const NEW_ORDERS: NewOrder[] = [
  {
    ref: "PT-4471", patientName: "Aisha Khan", nhs: "485 219 7740", med: "Mounjaro (tirzepatide)", dose: "2.5 mg",
    eligibility: "New start · BMI 33.1 · eligible", score: { rag: "green", confidence: 97 },
    pharmacyCode: "WB", submittedAt: "10:24 today",
    age: 47, sex: "Female", bmi: 33.1, ethnicity: "White British", comorbidities: ["Hypertension"],
    preference: "Mounjaro (tirzepatide)",
    verdict: "approve",
    ai: {
      basis: "Auto-scored against SOP Rule 1.1", score: { rag: "green", confidence: 97 },
      title: "Approve new start.",
      body: "Patient meets Willowbrook SOP Rule 1.1 (BMI ≥ 30) with no contraindications on record. Begin at 2.5 mg with 4-weekly titration.",
      checks: [
        "BMI 33.1 — meets Rule 1.1 (≥ 30)",
        "Comorbidity on record — Hypertension",
        "No contraindications (Rule 3.1)",
        "Patient preference — Mounjaro; SOP-compatible, honoured",
      ],
      recommendedRx: "Mounjaro 2.5 mg · 4-week starter supply",
    },
    verification: { weightPhoto: "Live camera", idDocument: "Passport" },
  },
  {
    ref: "PT-4470", patientName: "Grace Adeyemi", nhs: "602 884 1190", med: "Wegovy (semaglutide)", dose: "0.25 mg",
    eligibility: "New start · BMI 31.6 · eligible", score: { rag: "green", confidence: 96 },
    pharmacyCode: "MX", submittedAt: "10:11 today",
    age: 39, sex: "Female", bmi: 31.6, ethnicity: "Black African", comorbidities: [],
    preference: "Wegovy (semaglutide)",
    verdict: "approve",
    ai: {
      basis: "Auto-scored against SOP Rule 1.1", score: { rag: "green", confidence: 96 },
      title: "Approve new start.",
      body: "Patient meets MedExpress SOP Rule 1.1 (BMI ≥ 30). Begin at 0.25 mg with 4-weekly titration.",
      checks: ["BMI 31.6 — meets Rule 1.1 (≥ 30)", "No contraindications (Rule 3.1)", "First GLP-1 start on record", "Patient preference — Wegovy; SOP-compatible, honoured"],
      recommendedRx: "Wegovy 0.25 mg · 4-week starter supply",
    },
    verification: { weightPhoto: "Live camera", idDocument: "Driving licence" },
  },
  {
    ref: "PT-4468", patientName: "Nadia Patel", nhs: "771 045 3328", med: "Mounjaro (tirzepatide)", dose: "2.5 mg",
    eligibility: "BMI 28.4 · borderline — verify", score: { rag: "amber", confidence: 82 },
    pharmacyCode: "PD", submittedAt: "09:52 today",
    age: 44, sex: "Female", bmi: 28.4, ethnicity: "South Asian", comorbidities: ["Type 2 diabetes"],
    preference: "Let prescriber recommend",
    verdict: "verify",
    ai: {
      basis: "Auto-scored against SOP Rule 1.1", score: { rag: "amber", confidence: 82 },
      title: "Verify comorbidity pathway.",
      body: "BMI 28.4 is below the 32 floor but the comorbidity pathway (≥ 27 with T2DM) may apply. Confirm the diabetes diagnosis before issuing.",
      checks: [
        "BMI 28.4 — below Rule 1.1 floor (32)",
        "Comorbidity pathway — Type 2 diabetes (≥ 27)",
        "Higher-risk ethnicity — South Asian",
        "No patient preference — tirzepatide proposed on efficacy (SOP 2.3)",
      ],
      recommendedRx: "Mounjaro 2.5 mg · 4-week starter supply (pending confirmation)",
    },
    verification: { weightPhoto: "Live camera", idDocument: "Passport" },
  },
  {
    ref: "PT-4465", patientName: "Chloe Barnes", nhs: "339 612 5507", med: "Wegovy (semaglutide)", dose: "0.25 mg",
    eligibility: "BMI 26.1 · below threshold", score: { rag: "red", confidence: 91 },
    pharmacyCode: "CP", submittedAt: "09:40 today",
    age: 35, sex: "Female", bmi: 26.1, ethnicity: "White British", comorbidities: [],
    preference: "Wegovy (semaglutide)",
    verdict: "decline",
    ai: {
      basis: "Auto-scored against SOP Rule 1.1", score: { rag: "red", confidence: 91 },
      title: "Decline — below threshold.",
      body: "BMI 26.1 is below the SOP Rule 1.1 floor with no qualifying comorbidity on record. Does not meet eligibility.",
      checks: [
        "BMI 26.1 — below Rule 1.1 floor (30)",
        "No qualifying comorbidity on record",
        "No contraindications, but eligibility not met",
        "Patient preference — Wegovy; not applicable, eligibility not met",
      ],
      recommendedRx: "No prescription — signpost to lifestyle pathway",
    },
    verification: { weightPhoto: "Live camera", idDocument: "Driving licence" },
  },
  {
    ref: "PT-4464", patientName: "Peter Whitfield", nhs: "123 456 7890", med: "Wegovy (semaglutide)", dose: "0.5 mg",
    eligibility: "New start · BMI 32.5 · eligible", score: { rag: "green", confidence: 95 },
    pharmacyCode: "NC", submittedAt: "09:31 today",
    age: 51, sex: "Male", bmi: 32.5, ethnicity: "White British", comorbidities: ["Hypertension"],
    preference: "Let prescriber recommend",
    verdict: "approve",
    ai: {
      basis: "Auto-scored against SOP Rule 1.1", score: { rag: "green", confidence: 95 },
      title: "Approve new start.",
      body: "Patient meets Nuffield SOP Rule 1.1 (BMI ≥ 30). Begin at 0.5 mg with 4-weekly titration.",
      checks: ["BMI 32.5 — meets Rule 1.1 (≥ 30)", "Comorbidity on record — Hypertension", "No contraindications (Rule 3.1)", "No patient preference — semaglutide proposed per pharmacy formulary"],
      recommendedRx: "Wegovy 0.5 mg · 4-week starter supply",
    },
    verification: { weightPhoto: "Live camera", idDocument: "Passport" },
  },
  {
    ref: "PT-4463", patientName: "Sarah Doyle", nhs: "987 654 3210", med: "Wegovy (semaglutide)", dose: "1.0 mg",
    eligibility: "New start · BMI 30.2 · eligible", score: { rag: "green", confidence: 93 },
    pharmacyCode: "RS", submittedAt: "09:18 today",
    age: 42, sex: "Female", bmi: 30.2, ethnicity: "White British", comorbidities: [],
    preference: "Wegovy (semaglutide)",
    verdict: "approve",
    ai: {
      basis: "Auto-scored against SOP Rule 1.1", score: { rag: "green", confidence: 93 },
      title: "Approve new start.",
      body: "Patient meets RightScript SOP Rule 1.1 (BMI ≥ 30). Begin at 1.0 mg with 4-weekly titration.",
      checks: ["BMI 30.2 — meets Rule 1.1 (≥ 30)", "No contraindications (Rule 3.1)", "First GLP-1 start on record", "Patient preference — Wegovy; SOP-compatible, honoured"],
      recommendedRx: "Wegovy 1.0 mg · 4-week starter supply",
    },
    verification: { weightPhoto: "Live camera", idDocument: "Driving licence" },
  },
  {
    ref: "PT-4462", patientName: "Mark Ellison", nhs: "456 789 1234", med: "Mounjaro (tirzepatide)", dose: "5.0 mg",
    eligibility: "BMI 29.1 · borderline — verify", score: { rag: "amber", confidence: 85 },
    pharmacyCode: "WB", submittedAt: "09:02 today",
    age: 48, sex: "Male", bmi: 29.1, ethnicity: "White British", comorbidities: ["Obstructive sleep apnoea"],
    preference: "Mounjaro (tirzepatide)",
    verdict: "verify",
    ai: {
      basis: "Auto-scored against SOP Rule 1.1", score: { rag: "amber", confidence: 85 },
      title: "Verify comorbidity pathway.",
      body: "BMI 29.1 is below the 30 floor; OSA may qualify under the comorbidity pathway (≥ 27). Confirm before issuing.",
      checks: ["BMI 29.1 — below Rule 1.1 floor (30)", "Comorbidity pathway — OSA (≥ 27)", "No contraindications (Rule 3.1)", "Patient preference — Mounjaro; honoured pending pathway confirmation"],
      recommendedRx: "Mounjaro 5.0 mg · 4-week supply (pending confirmation)",
    },
    verification: { weightPhoto: "Live camera", idDocument: "Passport" },
  },
];

export const newOrderByRef = (ref: string) =>
  NEW_ORDERS.find((o) => o.ref === ref);

// ---- Simple repeats (batch-approvable, all green) --------------------------

export const SIMPLE_REPEATS: SimpleRepeat[] = [
  { ref: "PT-3120", nhs: "500 200 6000", med: "Wegovy (semaglutide)", dose: "1.0 mg · same dose", lastReview: "12 May 2026", pharmacyCode: "WB", score: { rag: "green", confidence: 95 } },
  { ref: "PT-3121", nhs: "503 207 6131", med: "Mounjaro (tirzepatide)", dose: "7.5 mg · same dose", lastReview: "14 May 2026", pharmacyCode: "MX", score: { rag: "green", confidence: 97 } },
  { ref: "PT-3122", nhs: "510 215 6200", med: "Wegovy (semaglutide)", dose: "0.5 mg · same dose", lastReview: "16 May 2026", pharmacyCode: "PD", score: { rag: "green", confidence: 94 } },
  { ref: "PT-3123", nhs: "520 222 6300", med: "Wegovy (semaglutide)", dose: "1.7 mg · same dose", lastReview: "18 May 2026", pharmacyCode: "CP", score: { rag: "green", confidence: 96 } },
  { ref: "PT-3124", nhs: "525 230 6400", med: "Mounjaro (tirzepatide)", dose: "10 mg · same dose", lastReview: "20 May 2026", pharmacyCode: "NC", score: { rag: "green", confidence: 98 } },
  { ref: "PT-3125", nhs: "530 237 6500", med: "Wegovy (semaglutide)", dose: "2.4 mg · same dose", lastReview: "22 May 2026", pharmacyCode: "RS", score: { rag: "green", confidence: 93 } },
  { ref: "PT-3126", nhs: "540 245 6600", med: "Mounjaro (tirzepatide)", dose: "5.0 mg · same dose", lastReview: "24 May 2026", pharmacyCode: "WB", score: { rag: "green", confidence: 95 } },
  { ref: "PT-3127", nhs: "550 252 6700", med: "Wegovy (semaglutide)", dose: "1.0 mg · same dose", lastReview: "26 May 2026", pharmacyCode: "MX", score: { rag: "green", confidence: 99 } },
  { ref: "PT-3128", nhs: "560 260 6800", med: "Mounjaro (tirzepatide)", dose: "2.5 mg · same dose", lastReview: "27 May 2026", pharmacyCode: "PD", score: { rag: "green", confidence: 92 } },
  { ref: "PT-3129", nhs: "570 267 6900", med: "Wegovy (semaglutide)", dose: "1.7 mg · same dose", lastReview: "28 May 2026", pharmacyCode: "NC", score: { rag: "green", confidence: 96 } },
];

// ---- Complex repeats ------------------------------------------------------

const WB_SOP_RULE = {
  rule: "SOP RULE 4.3",
  version: "v3.2",
  quote:
    "Where a treatment gap exceeds 6 weeks, re-titration is mandatory: restart at one dose level below and re-assess before escalation.",
};

export const COMPLEX_CASES: ComplexCase[] = [
  {
    ref: "PT-2087", nhs: "943 476 5919", med: "Mounjaro (tirzepatide)", dose: "7.5 mg",
    flagReason: "7-week treatment gap", score: { rag: "amber", confidence: 94 },
    pharmacyCode: "WB", age: 54, sex: "Male", bmi: 34.2, ethnicity: "White British",
    comorbidities: ["Type 2 diabetes", "Hypertension"],
    history: [
      { label: "Started 2.5 mg", date: "10 Jul 2025" },
      { label: "Titrated to 5 mg", date: "7 Aug 2025" },
      { label: "Dispensed 5 mg", date: "4 Sep 2025" },
      { label: "Titrated to 7.5 mg", date: "2 Oct 2025" },
      { label: "Dispensed 7.5 mg", date: "30 Oct 2025" },
      { label: "Dispensed 7.5 mg", date: "27 Nov 2025" },
      { label: "Dispensed 7.5 mg", date: "22 Dec 2025" },
      { label: "Dispensed 7.5 mg", date: "19 Jan 2026" },
      { label: "Dispensed 7.5 mg", date: "16 Feb 2026" },
      { label: "Last dispensed · 7.5 mg", date: "15 Mar 2026" },
      { label: "7-week treatment gap", date: "", flag: true, gap: true, detail: "No dispense 12 Apr → 3 Jun · exceeds 6-week SOP limit" },
      { label: "Repeat requested · 7.5 mg", date: "3 Jun 2026 · today" },
    ],
    ai: {
      basis: "Generated against Willowbrook SOP · Rule 4.3", score: { rag: "amber", confidence: 94 },
      title: "Step down dose and restart protocol.",
      body: "Treatment gap of 7 weeks exceeds the 6-week threshold. SOP Rule 4.3 requires re-titration rather than resuming the prior dose.",
      checks: [
        "GI tolerance to tirzepatide falls after ≥ 6 weeks without dosing — resuming at 7.5 mg risks significant nausea and vomiting.",
        "Restart at 5 mg for 4 weeks, then reassess tolerance before returning to 7.5 mg.",
        "No red-flag contraindications found in patient record (renal, pancreatitis, MEN-2).",
      ],
      recommendedRx: "Mounjaro 5 mg · 4-week restart supply",
    },
    orderRequest: { med: "Mounjaro 7.5 mg", detail: "4-week supply · self-requested repeat", meta: "Willowbrook Pharmacy · 3 Jun 2026" },
    sopCitation: WB_SOP_RULE,
  },
  {
    ref: "PT-2071", nhs: "218 905 6634", med: "Wegovy (semaglutide)", dose: "2.5 mg",
    flagReason: "Dose escalation above SOP max", score: { rag: "red", confidence: 93 },
    pharmacyCode: "MX", age: 46, sex: "Female", bmi: 36.7, ethnicity: "White British",
    comorbidities: ["Hypertension"],
    history: [
      { label: "Started 0.25 mg", date: "10 Jan 2026" },
      { label: "Titrated to 1.0 mg", date: "8 Feb 2026" },
      { label: "Titrated to 1.7 mg", date: "10 Mar 2026" },
      { label: "Requested 2.5 mg", date: "", flag: true, detail: "Above MedExpress SOP max of 2.4 mg" },
    ],
    ai: {
      basis: "Generated against MedExpress SOP · Rule 5.1", score: { rag: "red", confidence: 93 },
      title: "Hold — exceeds maximum dose.",
      body: "Requested 2.5 mg exceeds the MedExpress SOP maximum of 2.4 mg. Rule 5.1 requires specialist sign-off before exceeding maximum.",
      checks: [
        "Wegovy max under MedExpress SOP is 2.4 mg (Rule 5.1).",
        "No specialist sign-off attached to this request.",
        "Escalate for senior review or hold at 1.7 mg.",
      ],
      recommendedRx: "Hold at Wegovy 1.7 mg · escalate for specialist sign-off",
    },
    orderRequest: { med: "Wegovy 2.5 mg", detail: "4-week supply · self-requested repeat", meta: "MedExpress UK · 3 Jun 2026" },
    sopCitation: { rule: "SOP RULE 5.1", version: "v3.0", quote: "Do not exceed Wegovy 2.4 mg without documented specialist sign-off." },
  },
  {
    ref: "PT-2095", nhs: "345 678 1234", med: "Mounjaro (tirzepatide)", dose: "10 mg",
    flagReason: "Reassessment needed after 12 weeks", score: { rag: "green", confidence: 95 },
    pharmacyCode: "NC", age: 41, sex: "Female", bmi: 31.0, ethnicity: "White British",
    comorbidities: [],
    history: [
      { label: "Started 2.5 mg", date: "6 Feb 2026" },
      { label: "Titrated to 7.5 mg", date: "5 Apr 2026" },
      { label: "Titrated to 10 mg", date: "3 May 2026" },
      { label: "12-week continuation review due", date: "", flag: true, detail: "Rule 6.2 — confirm ≥ 5% weight loss to continue" },
    ],
    ai: {
      basis: "Generated against Nuffield SOP · Rule 6.2", score: { rag: "green", confidence: 95 },
      title: "Continue — review threshold met.",
      body: "12-week continuation review is due. Recorded weight loss meets the Rule 6.2 threshold, so continuation at the current dose is appropriate.",
      checks: [
        "Weight loss of 8.4% at 12 weeks — exceeds the 5% Rule 6.2 threshold.",
        "No new contraindications on record.",
        "Continue at 10 mg and schedule the next review.",
      ],
      recommendedRx: "Mounjaro 10 mg · 4-week continuation supply",
    },
    orderRequest: { med: "Mounjaro 10 mg", detail: "4-week supply · self-requested repeat", meta: "Nuffield Chemist · 3 Jun 2026" },
    sopCitation: { rule: "SOP RULE 6.2", version: "v3.1", quote: "Reassess at continuation review; discontinue if < 5% body-weight reduction is achieved." },
  },
  {
    ref: "PT-2110", nhs: "567 890 3456", med: "Wegovy (semaglutide)", dose: "1.0 mg",
    flagReason: "Reported GI side effects", score: { rag: "amber", confidence: 92 },
    pharmacyCode: "RS", age: 38, sex: "Female", bmi: 29.8, ethnicity: "South Asian",
    comorbidities: ["Type 2 diabetes"],
    history: [
      { label: "Started 0.25 mg", date: "20 Feb 2026" },
      { label: "Titrated to 0.5 mg", date: "20 Mar 2026" },
      { label: "Titrated to 1.0 mg", date: "18 Apr 2026" },
      { label: "Reported nausea & vomiting", date: "", flag: true, detail: "Rule 2.2 — hold titration until tolerance improves" },
    ],
    ai: {
      basis: "Generated against RightScript SOP · Rule 2.2", score: { rag: "amber", confidence: 92 },
      title: "Hold titration — manage tolerance.",
      body: "Patient reports GI side effects at 1.0 mg. Rule 2.2 advises holding at the current dose until tolerance improves rather than escalating.",
      checks: [
        "Nausea and vomiting reported since last dose increase.",
        "Hold at 1.0 mg; do not escalate this cycle.",
        "Reassess tolerance at next review before resuming titration.",
      ],
      recommendedRx: "Wegovy 1.0 mg · hold dose · 4-week supply",
    },
    orderRequest: { med: "Wegovy 1.7 mg", detail: "4-week supply · self-requested repeat", meta: "RightScript · 3 Jun 2026" },
    sopCitation: { rule: "SOP RULE 2.2", version: "v3.1", quote: "Escalate by one dose level no sooner than every 4 weeks, tolerance permitting." },
  },
  {
    ref: "PT-2123", nhs: "678 901 4567", med: "Wegovy (semaglutide)", dose: "1.7 mg",
    flagReason: "No weight loss at 6 months", score: { rag: "red", confidence: 88 },
    pharmacyCode: "CP", age: 57, sex: "Male", bmi: 33.4, ethnicity: "White British",
    comorbidities: ["Hypertension"],
    history: [
      { label: "Started 0.25 mg", date: "2 Dec 2025" },
      { label: "Titrated to 1.0 mg", date: "3 Feb 2026" },
      { label: "Titrated to 1.7 mg", date: "3 Apr 2026" },
      { label: "6-month review — 2.1% loss", date: "", flag: true, detail: "Rule 6.2 — below 5% threshold, discontinue" },
    ],
    ai: {
      basis: "Generated against CarePoint SOP · Rule 6.2", score: { rag: "red", confidence: 88 },
      title: "Discontinue — below response threshold.",
      body: "At the 6-month review, weight loss is 2.1% — below the 5% Rule 6.2 threshold. SOP requires discontinuation.",
      checks: [
        "Weight loss of 2.1% at 6 months — below the 5% Rule 6.2 threshold.",
        "No documented adherence issue to explain non-response.",
        "Discontinue and signpost to an alternative pathway.",
      ],
      recommendedRx: "Discontinue Wegovy · signpost to alternative pathway",
    },
    orderRequest: { med: "Wegovy 1.7 mg", detail: "4-week supply · self-requested repeat", meta: "CarePoint Online · 3 Jun 2026" },
    sopCitation: { rule: "SOP RULE 6.2", version: "v2.9", quote: "Discontinue if < 5% body-weight reduction is achieved at continuation review." },
  },
];

export const complexCaseByRef = (ref: string) =>
  COMPLEX_CASES.find((c) => c.ref === ref);

// ---- Escalated requests (read-only for the doctor) -------------------------

export const ESCALATIONS: Escalation[] = [
  { ref: "PT-2071", nhs: "218 905 6634", med: "Wegovy (semaglutide)", dose: "2.5 mg", reason: "Dose escalation above SOP max", status: "Awaiting senior review", pharmacyCode: "MX" },
  { ref: "PT-2123", nhs: "678 901 4567", med: "Wegovy (semaglutide)", dose: "1.7 mg", reason: "No weight loss at 6 months", status: "Awaiting senior review", pharmacyCode: "CP" },
  { ref: "PT-2087", nhs: "943 476 5919", med: "Mounjaro (tirzepatide)", dose: "7.5 mg", reason: "7-week treatment gap", status: "In senior review", pharmacyCode: "WB" },
];

// ---- Patients (unified record) --------------------------------------------

export const PATIENTS: Patient[] = [
  { ref: "PT-4471", name: "Aisha Khan", age: 47, sex: "Female", bmi: 33.1, pharmacyCode: "WB", med: "Mounjaro (tirzepatide)", dose: "2.5 mg", status: "active", lastReview: "Today" },
  { ref: "PT-2087", name: "James Mitchell", age: 54, sex: "Male", bmi: 34.2, pharmacyCode: "MX", med: "Mounjaro (tirzepatide)", dose: "7.5 mg", status: "review", lastReview: "3 Jun 2026" },
  { ref: "PT-2620", name: "Daniel O'Connor", age: 41, sex: "Male", bmi: 31.4, pharmacyCode: "PD", med: "Wegovy (semaglutide)", dose: "1.0 mg", status: "active", lastReview: "21 May 2026" },
  { ref: "PT-4873", name: "Lily Chang", age: 29, sex: "Female", bmi: 28.0, pharmacyCode: "WB", med: "Wegovy (semaglutide)", dose: "0.5 mg", status: "active", lastReview: "15 Aug 2026" },
  { ref: "PT-3542", name: "Robert Smith", age: 62, sex: "Male", bmi: 36.7, pharmacyCode: "CP", med: "Mounjaro (tirzepatide)", dose: "5.0 mg", status: "paused", lastReview: "12 Sep 2026" },
  { ref: "PT-2835", name: "Emily Johnson", age: 35, sex: "Female", bmi: 29.6, pharmacyCode: "NC", med: "Wegovy (semaglutide)", dose: "2.4 mg", status: "active", lastReview: "30 Jun 2026" },
  { ref: "PT-1793", name: "Michael Brown", age: 48, sex: "Male", bmi: 32.1, pharmacyCode: "RS", med: "Mounjaro (tirzepatide)", dose: "1.5 mg", status: "review", lastReview: "22 Jul 2026" },
  { ref: "PT-4590", name: "Sofia Martinez", age: 60, sex: "Female", bmi: 30.0, pharmacyCode: "WB", med: "Mounjaro (tirzepatide)", dose: "3.0 mg", status: "active", lastReview: "10 Apr 2026" },
  { ref: "PT-4286", name: "Ryan Lee", age: 26, sex: "Male", bmi: 39.0, pharmacyCode: "MX", med: "Wegovy (semaglutide)", dose: "2.0 mg", status: "review", lastReview: "5 Nov 2026" },
  { ref: "PT-1866", name: "Chloe Kim", age: 44, sex: "Female", bmi: 27.6, pharmacyCode: "PD", med: "Wegovy (semaglutide)", dose: "0.5 mg", status: "active", lastReview: "16 Dec 2026" },
  { ref: "PT-5664", name: "David Wilson", age: 55, sex: "Male", bmi: 33.2, pharmacyCode: "NC", med: "Mounjaro (tirzepatide)", dose: "6.0 mg", status: "review", lastReview: "9 May 2026" },
];

export const patientByRef = (ref: string) =>
  PATIENTS.find((p) => p.ref === ref);

// ---- Compliance -----------------------------------------------------------

export const CLINICIAN_COMPLIANCE: ComplianceRow[] = [
  { name: "Dr. Ingrid Walters", pct: 99 },
  { name: "Dr. Kofi Mensah", pct: 99 },
  { name: "Dr. Yuki Tanaka", pct: 99 },
  { name: "Dr. Nadia Petrova", pct: 99 },
  { name: "Dr. Samuel Osei", pct: 94 },
  { name: "Dr. Eleanor Hart", pct: 99 },
  { name: "Dr. Raymond Okafor", pct: 98 },
  { name: "Dr. Sofia Patel", pct: 97 },
  { name: "Dr. Mads Lindqvist", pct: 96 },
  { name: "Dr. Julia Reyes", pct: 91 },
  { name: "Dr. Tomas Bowen", pct: 83 },
  { name: "Dr. Aisha Nakamura", pct: 81 },
];

export const PHARMACY_COMPLIANCE: ComplianceRow[] = PHARMACIES.map((p) => ({
  name: p.name,
  pct: p.compliance,
}));

/** SVG cohort-trend points (weight-loss outcomes), 0–100 y-scale. */
export const COHORT_TREND: number[] = [22, 24, 27, 30, 38, 47, 55, 61, 66, 74, 82, 88];
