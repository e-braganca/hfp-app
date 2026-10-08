"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CATEGORY_SINGULAR, liveCases } from "@/lib/shared/live-cases";
import type { WaitFlag } from "@/lib/admin/queue-sla";
import { WaitChip } from "@/components/shared/WaitFlag";
import { useClaims } from "@/components/doctor/queueHooks";
import { holdFor } from "@/lib/doctor/queue-claims";
import { useWaitClock } from "@/components/shared/boardClockHooks";
import { pharmacyName } from "@/lib/doctor/data";
import type { AttentionKind, AttentionRow } from "@/lib/admin/types";

/* ============================================================================
   Requires your attention.

   Client-side because half the list is derived from the live clock, which
   only exists in the browser. The rows are cases the patient is still waiting
   on — claimed or not, since claiming is not an answer.

   Seeded rows (escalations, overdue info requests, compliance) come in as
   props from the server; the unclaimed ones are computed here and merged.
   ============================================================================ */

const KIND_BADGE: Record<AttentionKind, { label: string; cls: string }> = {
  critical: { label: "Late", cls: "bg-error-lighter text-error-darker" },
  escalated: { label: "Escalated", cls: "bg-primary-lighter text-primary-darker" },
  late: { label: "Late", cls: "bg-warning-lighter text-warning-darker" },
  overdue: { label: "Overdue", cls: "bg-warning-lighter text-warning-darker" },
  compliance: { label: "Compliance", cls: "bg-info-lighter text-info-dark" },
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

/** One subject, however many reasons it is on the list. */
interface Row {
  key: string;
  kinds: AttentionKind[];
  title: string;
  sub: string;
  wait?: { hours: number; flag: WaitFlag };
  action: AttentionRow["action"];
  href: string;
}

const refOf = (title: string) => title.match(/^(PT-\d+)/)?.[1];

export function AttentionList({ seeded }: { seeded: AttentionRow[] }) {
  const cases = useMemo(() => liveCases(), []);
  const clock = useWaitClock(cases);
  const claims = useClaims();

  /**
   * Only cases nobody is holding. The clock keeps running through a claim —
   * the patient is still waiting — but a case somebody is working is not the
   * admin's to chase, and listing it here would send them to interrupt the
   * person already on it.
   */
  const late = cases
    .filter((c) => clock.flagFor(c.ref) !== "none" && !holdFor(claims, c.ref))
    .sort((a, b) => clock.hoursFor(b.ref) - clock.hoursFor(a.ref))
    // an escalated case is also its complex-repeat self, so liveCases() lists
    // it twice — one patient waiting is one thing to chase, not two
    .filter((c, i, all) => all.findIndex((x) => x.ref === c.ref) === i);

  const lateByRef = new Map(late.map((c) => [c.ref, c]));

  /**
   * A case can be two things at once — escalated AND sitting unanswered — and
   * it was appearing as two rows, which reads as two problems and gets counted
   * twice. One row, both badges.
   */
  const merged: Row[] = seeded.map((r) => {
    const ref = refOf(r.title);
    const lateCase = ref ? lateByRef.get(ref) : undefined;
    if (lateCase) lateByRef.delete(ref!);
    const flag = lateCase ? clock.flagFor(lateCase.ref) : "none";
    return {
      key: `${r.kind}-${r.title}`,
      kinds: lateCase ? [flag === "red" ? "critical" : "late", r.kind] : [r.kind],
      title: r.title,
      sub: r.sub,
      wait: lateCase ? { hours: clock.hoursFor(lateCase.ref), flag } : undefined,
      action: r.action,
      href: r.href,
    };
  });

  const lateOnly: Row[] = [...lateByRef.values()].map((c) => {
    const flag = clock.flagFor(c.ref);
    return {
      key: `late-${c.ref}`,
      kinds: [flag === "red" ? "critical" : "late"],
      title: `${c.ref} — ${CATEGORY_SINGULAR[c.category]} still undecided`,
      sub: `${pharmacyName(c.pharmacyCode)} · ${c.med} ${c.dose}`,
      wait: { hours: clock.hoursFor(c.ref), flag },
      action: "Review" as const,
      href: "/admin/queue",
    };
  });

  const worst = (r: Row) => Math.min(...r.kinds.map((k) => KIND_RANK[k]));
  const rows = [...lateOnly, ...merged].sort((a, b) => worst(a) - worst(b));
  const waiting = late.length;

  return (
    <div className="mt-6 overflow-hidden rounded-lg bg-background-paper shadow-card">
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="h-2.5 w-2.5 rounded-full bg-error" />
        <h2 className="text-base font-bold text-text-primary">Requires your attention</h2>
        <span className="rounded-full bg-error-lighter px-2 py-0.5 text-xs font-bold text-error-dark">
          {rows.length}
        </span>
        {waiting > 0 && (
          <span className="text-xs text-text-secondary">{waiting} waiting with nobody on them</span>
        )}
      </div>

      {rows.map((r) => (
        <div key={r.key} className="flex items-center gap-4 border-t border-[var(--divider)] px-5 py-3.5">
          {/* fixed width, so the titles start in the same place whether a row
              carries one badge or two */}
          <div className="flex w-36 shrink-0 flex-wrap gap-1.5">
            {r.kinds.map((k) => (
              <span
                key={k}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${KIND_BADGE[k].cls}`}
              >
                {KIND_BADGE[k].label}
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text-primary">{r.title}</p>
            <p className="truncate text-xs text-text-secondary">{r.sub}</p>
          </div>

          {r.wait && (
            <div className="shrink-0">
              <WaitChip hours={r.wait.hours} flag={r.wait.flag} />
            </div>
          )}

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
      ))}
    </div>
  );
}
