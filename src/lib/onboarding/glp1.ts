// ============================================================================
// Patients arriving mid-treatment.
//
// Someone already on a GLP-1 is not a new start: the prescriber has to know
// what they are on, at what dose, and when they last injected before writing
// anything. None of it blocks the consultation — it feeds the RAG score the
// clinical queue triages on, so the case reaches the right prescriber with the
// right flags rather than being refused at the door.
// ============================================================================

import type { Rag } from "@/lib/doctor/types";

export interface Glp1Product {
  key: string;
  name: string;
  generic: string;
  /** licensed maintenance ladder, low → high */
  doses: string[];
  /** how often it's injected — drives the "overdue" arithmetic */
  cadence: "weekly" | "daily";
}

export const GLP1_PRODUCTS: Glp1Product[] = [
  {
    key: "mounjaro",
    name: "Mounjaro",
    generic: "tirzepatide",
    doses: ["2.5 mg", "5 mg", "7.5 mg", "10 mg", "12.5 mg", "15 mg"],
    cadence: "weekly",
  },
  {
    key: "wegovy",
    name: "Wegovy",
    generic: "semaglutide",
    doses: ["0.25 mg", "0.5 mg", "1 mg", "1.7 mg", "2.4 mg"],
    cadence: "weekly",
  },
  {
    key: "ozempic",
    name: "Ozempic",
    generic: "semaglutide",
    doses: ["0.25 mg", "0.5 mg", "1 mg", "2 mg"],
    cadence: "weekly",
  },
  {
    key: "saxenda",
    name: "Saxenda",
    generic: "liraglutide",
    doses: ["0.6 mg", "1.2 mg", "1.8 mg", "2.4 mg", "3 mg"],
    cadence: "daily",
  },
  {
    key: "other",
    name: "Something else / not sure",
    generic: "prescriber will confirm",
    doses: ["Not sure"],
    cadence: "weekly",
  },
];

export function glp1Product(key: string | null): Glp1Product | undefined {
  return GLP1_PRODUCTS.find((p) => p.key === key);
}

/**
 * Side effects that change what a prescriber does with a GLP-1 — hold the
 * dose, slow the titration, or stop. Shared with the patient re-order
 * check-in so both surfaces ask the same question the same way.
 */
export const GLP1_SIDE_EFFECTS = [
  "Severe or persistent vomiting",
  "Severe stomach pain",
  "Persistent diarrhoea",
  "Dizziness or heart palpitations",
  "Injection-site reaction",
  "Low mood or anxiety changes",
] as const;

export const SIDE_EFFECT_OTHER = "Other";

/** The ones a prescriber has to see before issuing, not just note. */
const RED_FLAG_EFFECTS = new Set<string>([
  "Severe or persistent vomiting",
  "Severe stomach pain",
  "Dizziness or heart palpitations",
]);

export interface Glp1History {
  product: string | null;
  dose: string;
  startedOn: string; // yyyy-mm
  lastDoseOn: string; // yyyy-mm-dd
  sideEffects: string[];
  sideEffectOther: string;
}

export const emptyGlp1History = (): Glp1History => ({
  product: null,
  dose: "",
  startedOn: "",
  lastDoseOn: "",
  sideEffects: [],
  sideEffectOther: "",
});

/** Whole weeks since the last injection, or null if the date is missing. */
export function weeksSinceLastDose(h: Glp1History, today = new Date()): number | null {
  if (!h.lastDoseOn) return null;
  const last = new Date(`${h.lastDoseOn}T00:00:00Z`);
  if (Number.isNaN(last.getTime())) return null;
  const days = Math.floor((today.getTime() - last.getTime()) / 86_400_000);
  return Math.max(0, Math.floor(days / 7));
}

export interface Glp1Signal {
  rag: Rag;
  reasons: string[];
}

/**
 * Turn the answers into the flags the queue triages on. Deliberately
 * conservative — this decides which prescriber sees the case, not whether the
 * patient may continue, so over-flagging costs a senior review and
 * under-flagging costs a bad prescription.
 */
export function glp1Signal(h: Glp1History, today = new Date()): Glp1Signal {
  const reasons: string[] = [];
  let rag: Rag = "green";
  const raise = (to: Rag) => {
    const rank = { green: 0, yellow: 1, amber: 2, red: 3 };
    if (rank[to] > rank[rag]) rag = to;
  };

  const weeks = weeksSinceLastDose(h, today);
  const product = glp1Product(h.product);

  // Rule 4.3 — a gap past 6 weeks means tolerance can't be assumed
  if (weeks !== null) {
    if (weeks > 6) {
      raise("amber");
      reasons.push(`${weeks}-week gap since last dose — re-titration required (Rule 4.3)`);
    } else if (weeks > 3 && product?.cadence === "weekly") {
      raise("yellow");
      reasons.push(`${weeks} weeks since last dose — confirm the schedule before continuing`);
    }
  }

  // top of the ladder on arrival: nowhere to escalate, so a prescriber decides
  if (product && h.dose && h.dose === product.doses[product.doses.length - 1] && h.dose !== "Not sure") {
    raise("amber");
    reasons.push(`Already at the maximum licensed dose (${h.dose} ${product.name})`);
  }

  if (h.product === "other" || h.dose === "Not sure") {
    raise("amber");
    reasons.push("Current product or dose unconfirmed — verify before issuing");
  }

  if (h.product === "ozempic") {
    raise("yellow");
    reasons.push("On Ozempic — licensed for T2DM, not weight loss; switch needs review");
  }

  const flagged = h.sideEffects.filter((e) => RED_FLAG_EFFECTS.has(e));
  if (flagged.length) {
    raise("red");
    reasons.push(`Reported: ${flagged.join(", ").toLowerCase()}`);
  } else if (h.sideEffects.length || h.sideEffectOther.trim()) {
    raise("yellow");
    reasons.push("Side effects reported — review tolerance before escalating dose");
  }

  if (reasons.length === 0) reasons.push("Stable on treatment, no flags raised");
  return { rag, reasons };
}
