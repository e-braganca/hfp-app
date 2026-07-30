// ============================================================================
// Patient onboarding — types + clinical gate logic (FC-02)
// Ported from legacy onboarding.js. Outcome precedence: blocked > age > BMI.
// ============================================================================

import {
  ETHNIC_GROUPS,
  HIGHER_RISK_ETHNICITY,
  QUALIFYING_COMORBIDITY,
  SAFETY_QUESTIONS,
} from "./constants";
import {
  DEFAULT_HEIGHT_UNIT,
  DEFAULT_WEIGHT_UNIT,
  cmToFtIn,
  ftInToCm,
  kgToLb,
  kgToStLb,
  lbToKg,
  numOf,
  stLbToKg,
  trim1,
  type HeightUnit,
  type WeightUnit,
} from "./units";

export type Sex = "female" | "male";
export type MedsAnswer = "glp1" | "other" | "none";
export type Outcome = null | "submitted" | "blocked" | "declined-bmi" | "declined-age";

export interface Answers {
  sex: Sex | null;
  /** Canonical ISO yyyy-mm-dd, derived from the three dob part fields. */
  dob: string;
  /** Raw NHS-style date-of-birth parts (separate Day / Month / Year boxes). */
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  /** Canonical, always metric — every clinical rule reads these two. */
  heightCm: string;
  weightKg: string;
  /** Display units + their raw fields; folded into the canonical pair on edit. */
  heightUnit: HeightUnit;
  weightUnit: WeightUnit;
  heightFt: string;
  heightIn: string;
  weightSt: string;
  weightLb: string;
  weightLbTotal: string;
  ethnicity: string | null;
  conditions: string[];
  meds: MedsAnswer | null;
  safety: Record<string, "yes" | "no">;
  weightPhoto: boolean;
  idDoc: boolean;
  firstName: string;
  lastName: string;
  email: string;
  /** dial code (e.g. "+44") + national number, stored separately */
  mobileCountry: string;
  mobile: string;
  password: string;
  consent: boolean;
  /** TREATMENT_OPTIONS key, chosen after verification */
  treatment: string | null;
  /** mock checkout — demo only, nothing is processed or stored */
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
}

export const emptyAnswers = (): Answers => ({
  sex: null,
  dob: "",
  dobDay: "",
  dobMonth: "",
  dobYear: "",
  heightCm: "",
  weightKg: "",
  heightUnit: DEFAULT_HEIGHT_UNIT,
  weightUnit: DEFAULT_WEIGHT_UNIT,
  heightFt: "",
  heightIn: "",
  weightSt: "",
  weightLb: "",
  weightLbTotal: "",
  ethnicity: null,
  conditions: [],
  meds: null,
  safety: {},
  weightPhoto: false,
  idDoc: false,
  firstName: "",
  lastName: "",
  email: "",
  mobileCountry: "+44",
  mobile: "",
  password: "",
  consent: false,
  treatment: null,
  cardNumber: "",
  cardExpiry: "",
  cardCvc: "",
});

/** Fold the Day / Month / Year boxes into the canonical ISO dob — "" if the
 *  parts don't form a real calendar date (guards 31 Feb, year typos, etc.). */
export function withCanonicalDob(a: Answers): Answers {
  const d = Number(a.dobDay);
  const m = Number(a.dobMonth);
  const y = Number(a.dobYear);
  const next = { ...a, dob: "" };
  if (!d || !m || !y || y < 1900 || y > 2100 || m > 12 || d > 31) return next;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return next;
  next.dob = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return next;
}

/** Fold whichever unit fields are on screen back into the canonical cm / kg. */
export function withCanonicalMeasures(a: Answers): Answers {
  const next = { ...a };
  if (a.heightUnit === "ftin") {
    const ft = numOf(a.heightFt);
    const inch = numOf(a.heightIn);
    next.heightCm = ft === null && inch === null ? "" : trim1(ftInToCm(ft, inch));
  }
  if (a.weightUnit === "stlb") {
    const st = numOf(a.weightSt);
    const lb = numOf(a.weightLb);
    next.weightKg = st === null && lb === null ? "" : trim1(stLbToKg(st, lb));
  } else if (a.weightUnit === "lb") {
    const total = numOf(a.weightLbTotal);
    next.weightKg = total === null ? "" : trim1(lbToKg(total));
  }
  return next;
}

/* Switching units converts what is already there, then re-derives the canonical
   value from the rounded display so the two never disagree. */
export function withHeightUnit(a: Answers, unit: HeightUnit): Answers {
  if (a.heightUnit === unit) return a;
  const cm = numOf(a.heightCm);
  const next: Answers = { ...a, heightUnit: unit };
  if (cm === null) return next;
  if (unit === "ftin") {
    const { ft, inch } = cmToFtIn(cm);
    next.heightFt = String(ft);
    next.heightIn = String(inch);
    next.heightCm = trim1(ftInToCm(ft, inch));
  } else {
    next.heightCm = String(Math.round(cm));
  }
  return next;
}

export function withWeightUnit(a: Answers, unit: WeightUnit): Answers {
  if (a.weightUnit === unit) return a;
  const kg = numOf(a.weightKg);
  const next: Answers = { ...a, weightUnit: unit };
  if (kg === null) return next;
  if (unit === "stlb") {
    const { st, lb } = kgToStLb(kg);
    next.weightSt = String(st);
    next.weightLb = String(lb);
    next.weightKg = trim1(stLbToKg(st, lb));
  } else if (unit === "lb") {
    const total = kgToLb(kg);
    next.weightLbTotal = String(total);
    next.weightKg = trim1(lbToKg(total));
  } else {
    next.weightKg = trim1(kg);
  }
  return next;
}

/** "5′ 11″ · 15 st 4 lb (180.3 cm · 97.1 kg)" — patient's units, then clinical. */
export function measureSummary(a: Answers): string {
  const h =
    a.heightUnit === "ftin"
      ? `${numOf(a.heightFt) ?? 0}′ ${numOf(a.heightIn) ?? 0}″`
      : `${a.heightCm} cm`;
  const w =
    a.weightUnit === "stlb"
      ? `${numOf(a.weightSt) ?? 0} st ${numOf(a.weightLb) ?? 0} lb`
      : a.weightUnit === "lb"
        ? `${a.weightLbTotal} lb`
        : `${a.weightKg} kg`;
  // only spell out what the patient did not already type in metric
  const metric: string[] = [];
  if (a.heightUnit !== "cm") metric.push(`${a.heightCm} cm`);
  if (a.weightUnit !== "kg") metric.push(`${a.weightKg} kg`);
  return `${h} · ${w}${metric.length ? ` (${metric.join(" · ")})` : ""}`;
}

/** "Asian or Asian British — Indian": the group matters clinically. */
export function ethnicityLabel(a: Answers): string {
  for (const { group, options } of ETHNIC_GROUPS) {
    for (const o of options) {
      if (o.key === a.ethnicity) return group === "Other" ? o.label : `${group} — ${o.label}`;
    }
  }
  return "—";
}

/** BMI, or null if height/weight are missing or out of sane bounds. */
export function bmi(a: Answers): number | null {
  const h = Number(a.heightCm);
  const w = Number(a.weightKg);
  if (!h || !w || h < 100 || h > 260 || w < 25 || w > 400) return null;
  return w / (h / 100) ** 2;
}

export const hasComorbidity = (a: Answers) =>
  a.conditions.some((c) => QUALIFYING_COMORBIDITY.has(c));

/** Eligibility BMI floor: 27 with comorbidity, 27.5 higher-risk ethnicity, else 30. */
export function bmiThreshold(a: Answers): number {
  if (hasComorbidity(a)) return 27;
  if (a.ethnicity && HIGHER_RISK_ETHNICITY.has(a.ethnicity)) return 27.5;
  return 30;
}

export function bmiEligible(a: Answers): boolean {
  const b = bmi(a);
  return b !== null && b >= bmiThreshold(a);
}

/** Age in whole years from DOB, or null if unset. */
export function age(a: Answers): number | null {
  if (!a.dob) return null;
  const d = new Date(a.dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years--;
  return years;
}

/** First safety question answered "yes" (a hard block), or undefined. */
export function hardContra(a: Answers) {
  return SAFETY_QUESTIONS.find((q) => a.safety[q.key] === "yes");
}

/** Outcome evaluated when leaving the safety step. */
export function computeOutcome(a: Answers): Exclude<Outcome, "submitted"> {
  if (hardContra(a)) return "blocked";
  const yrs = age(a);
  if (yrs === null || yrs < 18 || yrs > 74) return "declined-age";
  if (!bmiEligible(a)) return "declined-bmi";
  return null;
}

const EMAIL_RE = /.+@.+\..+/;

/** Whether the current step's inputs are complete enough to continue. */
export function canContinue(step: string, a: Answers): boolean {
  switch (step) {
    case "sex":
      return a.sex !== null;
    case "dob": {
      // hard-stop under-18s at the step itself; the 74 upper bound is checked
      // with the other gates after safety screening
      const yrs = age(a);
      return yrs !== null && yrs >= 18;
    }
    case "measure":
      return bmi(a) !== null;
    case "ethnicity":
      return a.ethnicity !== null;
    case "conditions":
      return true; // "none" is valid
    case "meds":
      return a.meds !== null;
    case "safety":
      return SAFETY_QUESTIONS.every((q) => a.safety[q.key]);
    case "photo":
      return a.weightPhoto;
    case "id":
      return a.idDoc;
    case "account":
      return (
        a.firstName.trim().length > 0 &&
        a.lastName.trim().length > 0 &&
        EMAIL_RE.test(a.email) &&
        a.mobile.replace(/\D/g, "").length >= 9 && // 9–11 national digits covers UK + the dial list
        a.password.length >= 8 &&
        a.consent
      );
    case "treatment":
      return a.treatment !== null;
    case "payment":
      // mock checkout: shape-only completeness, nothing is validated for real
      return (
        a.cardNumber.replace(/\D/g, "").length >= 12 &&
        /^\d{2}\s*\/\s*\d{2}$/.test(a.cardExpiry.trim()) &&
        a.cardCvc.replace(/\D/g, "").length >= 3
      );
    default:
      return true;
  }
}
