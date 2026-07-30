// ============================================================================
// Patient domain — Alex Morgan's treatment, weight log and deliveries.
// Seed data for the patient platform (FC-13…18). Mirrors the clinical rules
// the doctor side enforces: weight-trend triggers, re-titration, prescriber
// review before every repeat.
// ============================================================================

export interface TreatmentPlan {
  med: string; // "Mounjaro (tirzepatide)"
  shortName: string; // "Mounjaro"
  dose: string; // "5 mg"
  week: number; // week of programme
  injectionDay: string; // "Friday"
  priceMo: number; // £/month
  pharmacy: string;
  prescriber: string;
  nextReview: string; // "22 Aug 2026"
  startedOn: string; // "17 Jun 2026"
}

export const TREATMENT: TreatmentPlan = {
  med: "Mounjaro (tirzepatide)",
  shortName: "Mounjaro",
  dose: "5 mg",
  week: 6,
  injectionDay: "Friday",
  priceMo: 159,
  pharmacy: "Willowbrook Pharmacy",
  prescriber: "Dr. Eleanor Hart",
  nextReview: "22 Aug 2026",
  startedOn: "17 Jun 2026",
};

export interface DoseStage {
  week: string; // "Week 1–4"
  dose: string; // "2.5 mg"
  state: "done" | "current" | "next" | "future";
}

export const DOSE_SCHEDULE: DoseStage[] = [
  { week: "Week 1–4", dose: "2.5 mg", state: "done" },
  { week: "Week 5–8", dose: "5 mg", state: "current" },
  { week: "Week 9–12", dose: "7.5 mg", state: "next" },
  { week: "Week 13+", dose: "10 mg", state: "future" },
];

export interface WeightEntry {
  date: string; // "24 Jul 2026"
  kg: number;
  note?: string;
}

/** Weekly check-ins, oldest first. Start weight = onboarding verified weight. */
export const WEIGHT_LOG: WeightEntry[] = [
  { date: "17 Jun 2026", kg: 96.2, note: "Programme start — verified photo" },
  { date: "24 Jun 2026", kg: 95.4 },
  { date: "1 Jul 2026", kg: 94.8, note: "Mild nausea, settled by day 3" },
  { date: "8 Jul 2026", kg: 94.1 },
  { date: "15 Jul 2026", kg: 93.6, note: "Moved up to 5 mg" },
  { date: "22 Jul 2026", kg: 92.9 },
  { date: "29 Jul 2026", kg: 92.4 },
];

export type DeliveryStatus = "preparing" | "shipped" | "delivered";

export interface Delivery {
  ref: string; // "DL-1088"
  date: string; // "12 Aug 2026"
  what: string; // "Mounjaro 5 mg · 4 doses"
  status: DeliveryStatus;
  tracking?: string;
}

export const DELIVERIES: Delivery[] = [
  { ref: "DL-1088", date: "12 Aug 2026", what: "Mounjaro 5 mg · 4 doses", status: "preparing" },
  { ref: "DL-1041", date: "15 Jul 2026", what: "Mounjaro 5 mg · 4 doses", status: "delivered", tracking: "RM 9042 1180 5GB" },
  { ref: "DL-0996", date: "17 Jun 2026", what: "Mounjaro 2.5 mg · 4 doses", status: "delivered", tracking: "RM 8811 0429 2GB" },
];

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, { label: string; tone: "success" | "warning" | "info" }> = {
  preparing: { label: "Preparing", tone: "warning" },
  shipped: { label: "Shipped · cold-chain", tone: "info" },
  delivered: { label: "Delivered", tone: "success" },
};

/** Height from onboarding — BMI on the tracking page derives from it. */
export const HEIGHT_CM = 175;

export const bmiFor = (kg: number) => kg / (HEIGHT_CM / 100) ** 2;
