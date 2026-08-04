import type { Rag } from "./types";

/** Tailwind classes for a RAG status pill (bg + text). */
export const RAG_PILL: Record<Rag, string> = {
  green: "bg-success-lighter text-success-darker",
  amber: "bg-warning-lighter text-warning-darker",
  yellow: "bg-warning-lighter text-warning-darker",
  red: "bg-error-lighter text-error-darker",
};

/** Solid fill for a RAG dot / progress bar. */
export const RAG_FILL: Record<Rag, string> = {
  green: "bg-success",
  amber: "bg-warning",
  yellow: "bg-warning",
  red: "bg-error",
};

/** Text colour for a bare RAG figure (compliance % with no bar). */
export const RAG_TEXT: Record<Rag, string> = {
  green: "text-success-dark",
  amber: "text-warning-dark",
  yellow: "text-warning-dark",
  red: "text-error",
};

export const RAG_LABEL: Record<Rag, string> = {
  green: "Green",
  amber: "Amber",
  yellow: "Yellow",
  red: "Red",
};

/** RAG band for a compliance %: ≥95 green, ≥90 amber, else red. */
export function complianceRag(pct: number): Rag {
  if (pct >= 95) return "green";
  if (pct >= 90) return "amber";
  return "red";
}
