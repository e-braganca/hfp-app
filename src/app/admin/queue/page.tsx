"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PresenceDot } from "@/components/admin/doctorBits";
import { useClaims, useQueueClock } from "@/components/doctor/queueHooks";
import { PageHeader } from "@/components/ui/PageHeader";
import { RagPill } from "@/components/ui/StatusPill";
import { StatTile } from "@/components/ui/StatTile";
import { Toast } from "@/components/ui/Toast";
import { ChevronRight } from "@/components/ui/icons";
import { ADMIN_DOCTORS } from "@/lib/admin/data";
import type { AdminDoctor, QueueBand } from "@/lib/admin/types";
import { CATEGORY_LABEL, type QueueCategory } from "@/lib/doctor/clinicians";
import { COMPLEX_CASES, ESCALATIONS, NEW_ORDERS, SIMPLE_REPEATS } from "@/lib/doctor/data";
import { claim, heldFor, holdFor, release } from "@/lib/doctor/queue-claims";
import type { Rag } from "@/lib/doctor/types";

/* ============================================================================
   Current Queue — everything live, and who has it.

   Reads the same claim store the prescribers work from, so this is the real
   board rather than a report of it: assigning here takes the case off
   everyone else's list the moment it's done, and reassigning moves it between
   two people without either of them refreshing.

   Band is checked before an assignment goes through — handing a Red to a
   Green-only clinician is the mistake this page exists to prevent.
   ============================================================================ */

const ESCALATION_RAG: Rag = "red";

interface LiveCase {
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

function liveCases(): LiveCase[] {
  return [
    ...NEW_ORDERS.map((o) => ({
      ref: o.ref, category: "new" as QueueCategory, rag: o.score.rag, nhs: o.nhs, med: o.med, dose: o.dose,
      pharmacyCode: o.pharmacyCode, detail: o.eligibility, href: `/doctor/orders/${o.ref}`,
    })),
    ...SIMPLE_REPEATS.map((r) => ({
      ref: r.ref, category: "simple" as QueueCategory, rag: r.score.rag, nhs: r.nhs, med: r.med, dose: r.dose,
      pharmacyCode: r.pharmacyCode, detail: `Last review ${r.lastReview}`,
    })),
    ...COMPLEX_CASES.map((c) => ({
      ref: c.ref, category: "complex" as QueueCategory, rag: c.score.rag, nhs: c.nhs, med: c.med, dose: c.dose,
      pharmacyCode: c.pharmacyCode, detail: c.flagReason, href: `/doctor/cases/${c.ref}`,
    })),
    ...ESCALATIONS.map((e) => ({
      ref: e.ref, category: "escalated" as QueueCategory, rag: ESCALATION_RAG, nhs: e.nhs, med: e.med, dose: e.dose,
      pharmacyCode: e.pharmacyCode, detail: e.reason,
    })),
  ];
}

/** Can this clinician be handed this band right now? */
function canBeAssigned(d: AdminDoctor, rag: Rag): { ok: boolean; why?: string } {
  if (d.status === "suspended") return { ok: false, why: "suspended" };
  if (d.status === "onboarding") return { ok: false, why: "certification pending" };
  const band: QueueBand = rag === "green" ? "green" : rag === "red" ? "red" : "amber";
  if (!d.granted.includes(band)) return { ok: false, why: `not cleared for ${band}` };
  if (d.access !== "all" && d.access !== band) return { ok: false, why: `working ${d.access} only` };
  return { ok: true };
}

export default function AdminQueuePage() {
  const claims = useClaims();
  const now = useQueueClock();
  const [category, setCategory] = useState<QueueCategory | "all">("all");
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const cases = useMemo(() => liveCases(), []);
  const rows = cases.filter((c) => {
    if (category !== "all" && c.category !== category) return false;
    if (onlyUnassigned && holdFor(claims, c.ref)) return false;
    return true;
  });

  const assigned = cases.filter((c) => holdFor(claims, c.ref)).length;
  const workingNow = new Set(
    Object.values(claims).filter((h) => holdFor(claims, h.ref)).map((h) => h.by),
  ).size;

  const assign = (c: LiveCase, doctorName: string) => {
    if (!doctorName) return;
    const d = ADMIN_DOCTORS.find((x) => x.name === doctorName)!;
    const verdict = canBeAssigned(d, c.rag);
    if (!verdict.ok) {
      setToast(`Can't send ${c.ref} to ${d.name} — ${verdict.why}`);
      return;
    }
    claim(c.ref, d.name, d.initials);
    setToast(`${c.ref} sent to ${d.name} — it's off everyone else's board`);
  };

  const unassign = (c: LiveCase, by: string) => {
    release(c.ref, by);
    setToast(`${c.ref} returned to the shared board`);
  };

  const cols = "grid-cols-[100px_0.9fr_1.3fr_1.2fr_auto_1.5fr_150px] [&>*]:min-w-0";

  return (
    <>
      <PageHeader title="Current queue" subtitle="Every live case and who is holding it, across the whole panel" />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile value={cases.length} label="Cases live now" />
          <StatTile value={assigned} label="Claimed by a clinician" tone="success" />
          <StatTile value={cases.length - assigned} label="Waiting on the board" tone="warning" />
          <StatTile value={workingNow} label="Clinicians holding work" tone="muted" />
        </div>

        <section className="rounded-lg bg-background-paper shadow-card">
          <div className="flex flex-wrap items-center gap-3 border-b border-[var(--divider)] p-4">
            <div className="flex flex-wrap gap-1">
              {(["all", "new", "simple", "complex", "escalated"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    category === c
                      ? "bg-primary text-white"
                      : "bg-background-neutral text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {c === "all" ? "Everything" : CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
            <label className="ml-auto flex items-center gap-2 text-sm font-semibold text-text-secondary">
              <input
                type="checkbox"
                checked={onlyUnassigned}
                onChange={(e) => setOnlyUnassigned(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--divider)] accent-[var(--primary)]"
              />
              Unassigned only
            </label>
          </div>

          <div className="overflow-x-auto lg:overflow-x-visible">
            <div className="min-w-[1020px] lg:min-w-0">
              <div className={`grid ${cols} border-b border-[var(--divider)] bg-grey-100`}>
                {["Ref", "Type", "Medication", "Detail", "Score", "Assigned to", "Actions"].map((h) => (
                  <div
                    key={h}
                    className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary ${
                      h === "Actions" ? "text-right" : ""
                    }`}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {rows.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-text-secondary">Nothing matches this filter.</p>
              )}

              {rows.map((c) => {
                const hold = holdFor(claims, c.ref);
                const doctor = hold ? ADMIN_DOCTORS.find((d) => d.name === hold.by) : undefined;
                return (
                  <div key={`${c.category}-${c.ref}`} className={`grid ${cols} items-center border-b border-[var(--divider)] last:border-0`}>
                    <div className="px-4 py-3">
                      <p className="font-mono text-xs font-bold text-text-primary">{c.ref}</p>
                      <p className="font-mono text-[10px] text-text-disabled">{c.nhs}</p>
                    </div>
                    <div className="px-4 py-3">
                      <span className="rounded-md bg-grey-200 px-2 py-0.5 text-xs font-semibold text-text-secondary">
                        {CATEGORY_LABEL[c.category]}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <p className="truncate text-sm font-bold text-text-primary" title={c.med}>{c.med}</p>
                      <p className="truncate text-xs text-text-secondary">{c.dose}</p>
                    </div>
                    <div className="px-4 py-3 text-sm text-text-secondary">{c.detail}</div>
                    <div className="px-4 py-3">
                      <RagPill rag={c.rag} />
                    </div>

                    <div className="px-4 py-3">
                      {hold && doctor ? (
                        <span className="flex items-center gap-2">
                          <span className="relative shrink-0">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-lighter text-[10px] font-bold text-primary-dark">
                              {doctor.initials}
                            </span>
                            <PresenceDot online={doctor.online} className="absolute -bottom-0.5 -right-0.5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-bold text-text-primary">{doctor.name}</span>
                            <span className="block text-[11px] text-text-secondary">
                              {hold.kind === "reserved" ? "reviewing now" : `holding · ${heldFor(hold, now)}`}
                            </span>
                          </span>
                        </span>
                      ) : hold ? (
                        <span className="text-xs text-text-secondary">{hold.by}</span>
                      ) : (
                        <span className="text-xs font-semibold text-warning-dark">On the shared board</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3">
                      <AssignSelect
                        value={hold?.by ?? ""}
                        rag={c.rag}
                        onPick={(name) => assign(c, name)}
                      />
                      {hold && (
                        <button
                          type="button"
                          onClick={() => unassign(c, hold.by)}
                          className="whitespace-nowrap text-xs font-bold text-text-secondary underline hover:text-text-primary"
                        >
                          Unassign
                        </button>
                      )}
                      {c.href && (
                        <Link
                          href={c.href}
                          className="flex items-center gap-1 whitespace-nowrap text-xs font-bold text-primary-dark hover:underline"
                        >
                          Open
                          <ChevronRight width={14} height={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="border-t border-[var(--divider)] px-4 py-3 text-xs text-text-secondary">
            Showing {rows.length} of {cases.length}. Clinicians who aren&rsquo;t cleared for a case&rsquo;s band are
            listed but can&rsquo;t be picked.
          </p>
        </section>
      </div>

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}

/** Send or move a case. Ineligible clinicians stay visible with the reason,
 *  so the admin sees who would need widening rather than an empty list. */
function AssignSelect({
  value,
  rag,
  onPick,
}: {
  value: string;
  rag: Rag;
  onPick: (name: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onPick(e.target.value)}
      className="h-8 max-w-[11rem] rounded-lg border border-[var(--divider)] bg-background-paper px-2 text-xs font-semibold text-text-primary focus:border-primary focus:outline-none"
    >
      <option value="">{value ? "Move to…" : "Send to…"}</option>
      {ADMIN_DOCTORS.map((d) => {
        const v = canBeAssigned(d, rag);
        return (
          <option key={d.name} value={d.name} disabled={!v.ok}>
            {d.online ? "● " : "○ "}
            {d.name}
            {v.ok ? "" : ` — ${v.why}`}
          </option>
        );
      })}
    </select>
  );
}
