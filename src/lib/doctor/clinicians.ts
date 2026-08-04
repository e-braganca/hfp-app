// ============================================================================
// Who is working the shared queue, and what each of them is allowed to take.
//
// With 30–100 prescribers pulling from one board, "can this clinician take
// this case" is a matrix, not a level: a junior may be signed off for simple
// repeats at Green while never seeing a Red complex repeat. Permission is
// (category × maximum RAG) — the pair the SOP actually cares about.
// ============================================================================

import type { Rag } from "./types";

export type QueueCategory = "new" | "simple" | "complex" | "escalated";

export const CATEGORY_LABEL: Record<QueueCategory, string> = {
  new: "New Orders",
  simple: "Simple Repeats",
  complex: "Complex Repeats",
  escalated: "Escalated",
};

/** Risk order — a clinician cleared to `maxRag` may take anything at or below. */
const RAG_RANK: Record<Rag, number> = { green: 0, yellow: 1, amber: 2, red: 3 };

export const RAG_ORDER = RAG_RANK;

export interface Clinician {
  name: string;
  initials: string;
  gmc: string;
  grade: "Junior prescriber" | "Prescriber" | "Senior prescriber" | "Clinical Lead";
  categories: QueueCategory[];
  maxRag: Rag;
  /** how many cases they may hold at once */
  claimLimit: number;
}

export const CLINICIANS: Clinician[] = [
  {
    name: "Dr. Eleanor Hart", initials: "EH", gmc: "7041182", grade: "Clinical Lead",
    categories: ["new", "simple", "complex", "escalated"], maxRag: "red", claimLimit: 8,
  },
  {
    name: "Dr. Raymond Okafor", initials: "RO", gmc: "6893021", grade: "Senior prescriber",
    categories: ["new", "simple", "complex", "escalated"], maxRag: "red", claimLimit: 6,
  },
  {
    name: "Dr. Sofia Patel", initials: "SP", gmc: "7455610", grade: "Prescriber",
    categories: ["new", "simple", "complex"], maxRag: "amber", claimLimit: 5,
  },
  {
    name: "Dr. Julia Reyes", initials: "JR", gmc: "7788123", grade: "Prescriber",
    categories: ["new", "simple"], maxRag: "amber", claimLimit: 5,
  },
  {
    name: "Dr. Tomas Bowen", initials: "TB", gmc: "8012456", grade: "Junior prescriber",
    categories: ["simple"], maxRag: "green", claimLimit: 3,
  },
  {
    name: "Dr. Hannah Cole", initials: "HC", gmc: "pending", grade: "Junior prescriber",
    categories: ["simple"], maxRag: "green", claimLimit: 2,
  },
];

export const DEFAULT_CLINICIAN = CLINICIANS[0];

export function clinicianByName(name: string): Clinician {
  return CLINICIANS.find((c) => c.name === name) ?? DEFAULT_CLINICIAN;
}

/** Why a clinician can't take a case — null when they can. */
export function blockedReason(
  c: Clinician,
  category: QueueCategory,
  rag: Rag,
): string | null {
  if (!c.categories.includes(category)) return `${CATEGORY_LABEL[category]} not in your scope`;
  if (RAG_RANK[rag] > RAG_RANK[c.maxRag]) {
    return rag === "red" ? "Red — senior review only" : "Above your RAG clearance";
  }
  return null;
}

export function canTake(c: Clinician, category: QueueCategory, rag: Rag): boolean {
  return blockedReason(c, category, rag) === null;
}

/** "Simple repeats · up to Green" — the one-line summary of a clearance. */
export function clearanceSummary(c: Clinician): string {
  const cats =
    c.categories.length === 4
      ? "All request types"
      : c.categories.map((k) => CATEGORY_LABEL[k]).join(" · ");
  const rag = c.maxRag === "red" ? "all RAG levels" : `up to ${c.maxRag[0].toUpperCase()}${c.maxRag.slice(1)}`;
  return `${cats} · ${rag}`;
}
