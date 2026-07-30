import type { AutoScore, Rag } from "@/lib/doctor/types";
import { RAG_LABEL, RAG_PILL } from "@/lib/doctor/rag";

/** RAG auto-score pill, e.g. "Green · 97%". */
export function ScorePill({ score }: { score: AutoScore }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${RAG_PILL[score.rag]}`}
    >
      {RAG_LABEL[score.rag]} · {score.confidence}%
    </span>
  );
}

/** Generic labelled RAG pill (no confidence), e.g. "Flagged · Amber", "Green". */
export function RagPill({
  rag,
  label,
}: {
  rag: Rag;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${RAG_PILL[rag]}`}
    >
      {label ?? RAG_LABEL[rag]}
    </span>
  );
}
