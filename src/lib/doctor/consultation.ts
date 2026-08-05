// ============================================================================
// What the patient actually answered at onboarding.
//
// The AI card tells a prescriber what the SOP makes of a case. Sometimes they
// need the raw material instead — the ethnicity that moved the BMI threshold,
// the five safety answers, whether they arrived already on a GLP-1. This is
// that record, keyed by case ref and shown on every surface a decision is
// made from.
//
// Demo data: a handful of cases are written out, the rest are derived
// deterministically from the ref so no screen is ever blank. In production
// this is the stored consultation, verbatim.
// ============================================================================

import { ETHNICITIES } from "@/lib/onboarding/constants";
import { SAFETY_QUESTIONS } from "@/lib/onboarding/constants";

export interface ConsultationAnswers {
  submittedAt: string;
  sexAtBirth: "Female" | "Male";
  age: number;
  heightCm: number;
  weightKg: number;
  bmi: number;
  /** the label the patient picked, and whether it lowered their threshold */
  ethnicity: string;
  bmiThreshold: number;
  conditions: string[];
  /** "None of these" | "Other prescription medication" | "A GLP-1 medicine" */
  medsAnswer: string;
  /** set when they arrived mid-treatment */
  glp1?: { product: string; dose: string; startedOn: string; lastDoseOn: string; sideEffects: string };
  otherMeds?: string[];
  /** every safety question answered No, or the consultation would have stopped */
  safetyAllClear: boolean;
  treatmentPreference: string;
  verification: { weightPhoto: string; idDocument: string };
}

/** Stable 0–1 from a ref, so the same case always shows the same answers. */
function seed(ref: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < ref.length; i++) {
    h ^= ref.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const CONDITION_POOL = ["Type 2 diabetes", "High blood pressure", "Obstructive sleep apnoea", "High cholesterol", "PCOS"];
const OTHER_MED_POOL = [
  ["Ramipril", "Atorvastatin"],
  ["Sertraline"],
  ["Levothyroxine", "Vitamin D (colecalciferol)"],
  ["Metformin", "Gliclazide"],
  ["Omeprazole", "Amlodipine"],
];

/** Cases the demo actually clicks into, written out rather than generated. */
const WRITTEN: Record<string, Partial<ConsultationAnswers>> = {
  "PT-4471": {
    submittedAt: "2 Aug 2026 · 10:24",
    conditions: ["High blood pressure"],
    medsAnswer: "None of these",
    treatmentPreference: "Mounjaro (tirzepatide)",
  },
  "PT-2087": {
    submittedAt: "3 Jun 2026 · 08:12",
    conditions: ["Type 2 diabetes", "High blood pressure"],
    medsAnswer: "A GLP-1 medicine",
    glp1: {
      product: "Mounjaro (tirzepatide)",
      dose: "7.5 mg",
      startedOn: "October 2025",
      lastDoseOn: "15 Mar 2026",
      sideEffects: "None reported",
    },
    treatmentPreference: "Mounjaro (tirzepatide)",
  },
  "PT-2043": {
    submittedAt: "8 Dec 2025 · 19:40",
    conditions: ["High blood pressure"],
    medsAnswer: "Other prescription medication",
    otherMeds: ["Ramipril", "Naproxen"],
    treatmentPreference: "Wegovy (semaglutide)",
  },
  "PT-4461": {
    submittedAt: "28 Jul 2026 · 21:05",
    conditions: [],
    medsAnswer: "None of these",
    treatmentPreference: "Let prescriber recommend",
  },
};

/**
 * The consultation behind a case. Pass whatever the calling record already
 * knows — those values win, so the drawer never contradicts the row above it.
 */
export function consultationFor(
  ref: string,
  known: Partial<ConsultationAnswers> = {},
): ConsultationAnswers {
  const rnd = seed(ref);
  const written = WRITTEN[ref] ?? {};

  const bmi = known.bmi ?? Math.round((28 + rnd() * 9) * 10) / 10;
  const heightCm = known.heightCm ?? Math.round(160 + rnd() * 25);
  const weightKg = known.weightKg ?? Math.round(bmi * (heightCm / 100) ** 2 * 10) / 10;
  const ethnicity = known.ethnicity ?? ETHNICITIES[Math.floor(rnd() * ETHNICITIES.length)].label;

  const derived: ConsultationAnswers = {
    submittedAt: "—",
    sexAtBirth: rnd() > 0.5 ? "Female" : "Male",
    age: 28 + Math.floor(rnd() * 34),
    heightCm,
    weightKg,
    bmi,
    ethnicity,
    bmiThreshold: 30,
    conditions: rnd() > 0.45 ? [CONDITION_POOL[Math.floor(rnd() * CONDITION_POOL.length)]] : [],
    medsAnswer: rnd() > 0.6 ? "Other prescription medication" : "None of these",
    safetyAllClear: true,
    treatmentPreference: rnd() > 0.5 ? "Mounjaro (tirzepatide)" : "Let prescriber recommend",
    verification: { weightPhoto: "Live camera", idDocument: rnd() > 0.5 ? "Passport" : "Driving licence" },
  };
  if (derived.medsAnswer === "Other prescription medication") {
    derived.otherMeds = OTHER_MED_POOL[Math.floor(rnd() * OTHER_MED_POOL.length)];
  }

  const merged = { ...derived, ...written, ...known };
  // a written record that names other meds shouldn't keep the derived list
  if (merged.medsAnswer !== "Other prescription medication") delete merged.otherMeds;
  if (merged.medsAnswer !== "A GLP-1 medicine") delete merged.glp1;
  return merged;
}

/** The five questions, all answered No — shown so the prescriber sees them asked. */
export const SAFETY_ASKED = SAFETY_QUESTIONS.map((q) => q.q);
