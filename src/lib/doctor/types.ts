// ============================================================================
// Doctor domain types — Prescriptr / Health Finder Pro
// UK AI-assisted, SOP-grounded prescribing platform. Weight-loss (GLP-1) is the
// only live therapy area. Mirrors the Figma doctor designs and the legacy
// doctor.js seed model. See FLOWCHARTS-OVERVIEW.md (FC-04..FC-08).
// ============================================================================

/** Clinical safety score (RAG) attached to every case by the upstream AI (FC-03). */
export type Rag = "green" | "amber" | "yellow" | "red";

export interface AutoScore {
  rag: Rag;
  /** AI confidence %, e.g. 97 */
  confidence: number;
}

export type Sex = "Male" | "Female";

/** Two-letter pharmacy code, e.g. "WB". */
export type PharmacyCode = string;

// ---- Pharmacies -----------------------------------------------------------

export interface Pharmacy {
  code: PharmacyCode;
  name: string;
  region: string;
  postcode: string;
  ordersToday: number;
  /** SOP compliance %, 0–100 */
  compliance: number;
  sopVersion: string; // "v3.2"
  sopUpdated: string; // "12 May 2026"
  connected: boolean;
}

// ---- SOPs / Protocols -----------------------------------------------------

export interface SopRule {
  n: string; // "1.1"
  title: string;
  text: string;
  /** true if this rule is one clinicians see flagged inline on cases */
  flag?: boolean;
}

export interface Protocol {
  pharmacyCode: PharmacyCode;
  version: string;
  updated: string;
  pages: number;
  rules: SopRule[];
}

// ---- AI recommendation ----------------------------------------------------

export interface AiRecommendation {
  /** Header eyebrow, e.g. "Auto-scored against SOP Rule 1.1" */
  basis: string;
  score: AutoScore;
  /** Bold verdict headline, e.g. "Approve new start." */
  title: string;
  body: string;
  /** Green-dot check bullets */
  checks: string[];
  recommendedRx: string; // "Mounjaro 2.5 mg · 4-week starter supply"
}

// ---- Orders / cases (the central entities) --------------------------------

/** New-order verdict that drives the primary CTA styling. */
export type Verdict = "approve" | "verify" | "decline";

export interface NewOrder {
  ref: string; // "PT-4471"
  nhs: string; // "485 219 7740"
  med: string; // "Mounjaro (tirzepatide)"
  dose: string; // "2.5 mg"
  eligibility: string; // "New start · BMI 33.1 · eligible"
  score: AutoScore;
  pharmacyCode: PharmacyCode;
  submittedAt: string; // "10:24 today"
  age: number;
  sex: Sex;
  bmi: number;
  ethnicity: string;
  comorbidities: string[];
  /** Treatment preference the patient picked at onboarding — either a named
   *  medication or "Let prescriber recommend". The AI recommendation must
   *  honour it when SOP-compatible and say so in its checks. */
  preference: string;
  verdict: Verdict;
  ai: AiRecommendation;
  verification: {
    weightPhoto: string; // caption
    idDocument: string;
  };
}

export interface SimpleRepeat {
  ref: string;
  nhs: string;
  med: string;
  dose: string; // "1.0 mg · same dose"
  lastReview: string; // "12 May 2026"
  pharmacyCode: PharmacyCode;
  score: AutoScore; // always green
}

export interface TimelineEvent {
  label: string; // "Started 2.5 mg"
  date: string; // "14 Jan 2026"
  flag?: boolean; // red treatment-gap node
  detail?: string; // sub-line for a flagged node
}

export interface ComplexCase {
  ref: string;
  nhs: string;
  med: string;
  dose: string;
  flagReason: string; // "7-week treatment gap"
  score: AutoScore;
  pharmacyCode: PharmacyCode;
  age: number;
  sex: Sex;
  bmi: number;
  ethnicity: string;
  comorbidities: string[];
  history: TimelineEvent[];
  ai: AiRecommendation;
  orderRequest: {
    med: string;
    detail: string; // "4-week supply · self-requested repeat"
    meta: string; // "Willowbrook Pharmacy · 3 Jun 2026"
  };
  sopCitation: {
    rule: string; // "SOP RULE 4.3"
    version: string;
    quote: string;
  };
}

export interface Escalation {
  ref: string;
  nhs: string;
  med: string;
  dose: string;
  reason: string;
  status: "Awaiting senior review" | "In senior review";
  pharmacyCode: PharmacyCode;
}

// ---- Patients (unified record) --------------------------------------------

export type PatientStatus = "active" | "review" | "paused";

export interface Patient {
  ref: string;
  name: string;
  age: number;
  sex: Sex;
  bmi: number;
  pharmacyCode: PharmacyCode;
  med: string;
  dose: string;
  status: PatientStatus;
  lastReview: string;
}

// ---- Compliance -----------------------------------------------------------

export interface ComplianceRow {
  name: string;
  /** compliance % 0–100 */
  pct: number;
}

// ---- Queue metrics --------------------------------------------------------

export interface QueueMetric {
  label: string;
  thisWeek?: number;
  open: number;
}
