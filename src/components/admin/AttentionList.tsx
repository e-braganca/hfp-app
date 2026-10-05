"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CATEGORY_SINGULAR, liveCases } from "@/lib/shared/live-cases";
import { waitedLabel } from "@/lib/admin/queue-sla";
import { useWaitClock } from "./boardClockHooks";
import { ClockIcon } from "./WaitFlag";
import { pharmacyName } from "@/lib/doctor/data";
import type { AttentionKind, AttentionRow } from "@/lib/admin/types";
import type { Rag } from "@/lib/doctor/types";

/* ============================================================================
   Requires your attention.

   Client-side because half the list is derived from the live clock, which
   only exists in the browser. The rows are cases the patient is still waiting
   on — claimed or not, since claiming is not an answer.

   Seeded rows (escalations, overdue info requests, compliance) come in as
   props from the server; the unclaimed ones are computed here and merged.
   ============================================================================ */

const RAG_TEXT: Record<Rag, string> = {
  green: "text-success-dark",
  amber: "text-warning-dark",
  yellow: "text-warning-dark",
  red: "text-error",
};

const KIND_BADGE: Record<AttentionKind, { label: string; cls: string; clock?: boolean }> = {
  critical: { label: "Late", cls: "border border-error bg-error-lighter/40 text-error-dark", clock: true },
  escalated: { label: "Escalated", cls: "bg-primary-dark text-white" },
  late: { label: "Late", cls: "border border-warning bg-warning-lighter/40 text-warning-darker", clock: true },
  overdue: { label: "Overdue", cls: "bg-warning-lighter text-warning-darker" },
  compliance: { label: "Compliance", cls: "bg-warning-lighter text-warning-darker" },
};

/**
 * Worst first. A case past the red threshold outranks an escalation: the
 * escalation is in someone's hands awaiting judgement, while a red-flagged one
 * has had no answer at all for a day, claimed or not.
 */
const KIND_RANK: Record<AttentionKind, number> = {
  critical: 0,
  escalated: 1,
  late: 2,
  overdue: 3,
  compliance: 4,
};

export function AttentionList({ seeded }: { seeded: AttentionRow[] }) {
  const cases = useMemo(() => liveCases(), []);
  const clock = useWaitClock(cases);

  const unclaimed: AttentionRow[] = cases
    .map((c) => ({ c, flag: clock.flagFor(c.ref) }))
    .filter(({ flag }) => flag !== "none")
    .sort((a, b) => clock.hoursFor(b.c.ref) - clock.hoursFor(a.c.ref))
    .map(({ c, flag }) => ({
      kind: (flag === "red" ? "critical" : "late") as AttentionKind,
      title: `${c.ref} — ${CATEGORY_SINGULAR[c.category]} still undecided`,
      sub: `${pharmacyName(c.pharmacyCode)} · ${c.med} ${c.dose}`,
      waited: `Waiting ${waitedLabel(clock.hoursFor(c.ref))}`,
      waitedRag: flag === "red" ? ("red" as Rag) : ("amber" as Rag),
      action: "Review" as const,
      href: "/admin/queue",
    }));

  const rows = [...unclaimed, ...seeded].sort((a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind]);

  return (
    <div className="mt-6 overflow-hidden rounded-lg bg-background-paper shadow-card">
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="h-2.5 w-2.5 rounded-full bg-error" />
        <h2 className="text-base font-bold text-text-primary">Requires your attention</h2>
        <span className="rounded-full bg-error-lighter px-2 py-0.5 text-xs font-bold text-error-dark">
          {rows.length}
        </span>
        {unclaimed.length > 0 && (
          <span className="text-xs text-text-secondary">
            {unclaimed.length} still waiting on a decision
          </span>
        )}
      </div>
      {rows.map((r, i) => {
        const badge = KIND_BADGE[r.kind];
        return (
          <div key={`${r.kind}-${r.title}-${i}`} className="flex items-center gap-4 border-t border-[var(--divider)] px-5 py-3.5">
            <span
              className={`flex shrink-0 items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                badge.clock ? "rounded-md" : "rounded-full"
              } ${badge.cls}`}
            >
              {badge.clock && <ClockIcon className="h-3 w-3" />}
              {badge.label}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{r.title}</p>
              <p className="truncate text-xs text-text-secondary">
                {r.sub}
                {r.waited && (
                  <>
                    {" · "}
                    <span className={`font-semibold ${r.waitedRag ? RAG_TEXT[r.waitedRag] : ""}`}>{r.waited}</span>
                  </>
                )}
              </p>
            </div>
            <Link
              href={r.href}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold ${
                r.action === "Review"
                  ? "bg-primary-dark text-white hover:bg-primary-darker"
                  : "border border-[var(--divider)] text-text-primary hover:bg-background-neutral"
              }`}
            >
              {r.action}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
