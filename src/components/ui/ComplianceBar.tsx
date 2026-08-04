import { RAG_TEXT, complianceRag } from "@/lib/doctor/rag";

/** A named row with a RAG-coloured compliance figure. */
export function ComplianceBar({ name, pct }: { name: string; pct: number }) {
  const rag = complianceRag(pct);
  return (
    <div className="flex items-center gap-4 border-b border-[var(--divider)] py-2.5 last:border-0">
      <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{name}</span>
      <span className={`shrink-0 text-right font-mono text-sm font-bold ${RAG_TEXT[rag]}`}>{pct}%</span>
    </div>
  );
}
