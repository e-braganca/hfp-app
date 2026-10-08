// ============================================================================
// Every case currently on the shared board, flattened across the four queues.
//
// Lives here rather than on the Current queue page because Oversight needs the
// same list to work out what is running late — and two derivations of "what is
// live" that can drift apart is exactly the bug that would make the admin's
// attention list lie.
// ============================================================================

import type { QueueCategory } from "@/lib/doctor/clinicians";
import { COMPLEX_CASES, ESCALATIONS, NEW_ORDERS, SIMPLE_REPEATS } from "@/lib/doctor/data";
import type { Rag } from "@/lib/doctor/types";

/** Escalations carry no RAG of their own — reaching senior review is the signal. */
export const ESCALATION_RAG: Rag = "red";

export interface LiveCase {
  ref: string;
  category: QueueCategory;
  rag: Rag;
  nhs: string;
  med: string;
  dose: string;
  pharmacyCode: string;
  detail: string;
  href?: string;
}

export function liveCases(): LiveCase[] {
  // Three of the complex repeats are also escalations. A case has one live
  // state, and that state is the later one — it is with a senior, not on the
  // complex board — so it must not be listed twice. Every consumer counts
  // these rows, and a patient counted twice is two problems that aren't there.
  const escalated = new Set(ESCALATIONS.map((e) => e.ref));
  return [
    ...NEW_ORDERS.map((o) => ({
      ref: o.ref, category: "new" as QueueCategory, rag: o.score.rag, nhs: o.nhs, med: o.med, dose: o.dose,
      pharmacyCode: o.pharmacyCode, detail: o.eligibility, href: `/doctor/orders/${o.ref}`,
    })),
    ...SIMPLE_REPEATS.map((r) => ({
      ref: r.ref, category: "simple" as QueueCategory, rag: r.score.rag, nhs: r.nhs, med: r.med, dose: r.dose,
      pharmacyCode: r.pharmacyCode, detail: `Last review ${r.lastReview}`, href: `/doctor/repeats/${r.ref}`,
    })),
    ...COMPLEX_CASES.filter((c) => !escalated.has(c.ref)).map((c) => ({
      ref: c.ref, category: "complex" as QueueCategory, rag: c.score.rag, nhs: c.nhs, med: c.med, dose: c.dose,
      pharmacyCode: c.pharmacyCode, detail: c.flagReason, href: `/doctor/cases/${c.ref}`,
    })),
    ...ESCALATIONS.map((e) => ({
      ref: e.ref, category: "escalated" as QueueCategory, rag: ESCALATION_RAG, nhs: e.nhs, med: e.med, dose: e.dose,
      pharmacyCode: e.pharmacyCode, detail: e.reason, href: `/doctor/escalations/${e.ref}`,
    })),
  ];
}

/**
 * CATEGORY_LABEL is plural because it names a queue ("Simple Repeats").
 * Prose about one case needs the singular — "an unclaimed simple repeat".
 */
export const CATEGORY_SINGULAR: Record<QueueCategory, string> = {
  new: "new order",
  simple: "simple repeat",
  complex: "complex repeat",
  escalated: "escalation",
};
