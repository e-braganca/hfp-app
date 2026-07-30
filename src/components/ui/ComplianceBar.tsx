import { RAG_FILL, complianceRag } from "@/lib/doctor/rag";

/** A named row with a RAG-coloured compliance % bar. */
export function ComplianceBar({ name, pct }: { name: string; pct: number }) {
  const rag = complianceRag(pct);
  return (
    <div className="flex items-center gap-4 py-2.5">
      <span className="w-44 shrink-0 truncate text-sm text-text-primary">{name}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-background-neutral">
        <div className={`h-full rounded-full ${RAG_FILL[rag]}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right font-mono text-sm font-bold text-text-primary">
        {pct}%
      </span>
    </div>
  );
}
