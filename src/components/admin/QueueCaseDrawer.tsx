"use client";

import { useEffect, type ReactNode } from "react";
import { MedicationTimeline } from "@/components/doctor/MedicationTimeline";
import { PatientSummaryCard } from "@/components/doctor/PatientSummaryCard";
import { ReviewPanel } from "@/components/doctor/ReviewPanel";
import { PresenceDot } from "@/components/admin/doctorBits";
import { RagPill } from "@/components/ui/StatusPill";
import { consultationFor } from "@/lib/doctor/consultation";
import { CATEGORY_LABEL, type QueueCategory } from "@/lib/doctor/clinicians";
import {
  COMPLEX_CASES,
  ESCALATIONS,
  NEW_ORDERS,
  SIMPLE_REPEATS,
  pharmacyName,
} from "@/lib/doctor/data";
import { heldFor, type Hold } from "@/lib/doctor/queue-claims";
import type { Rag } from "@/lib/doctor/types";
import type { AdminDoctor } from "@/lib/admin/types";

/* ============================================================================
   A live case, read from the admin side.

   Same reading the prescriber gets — patient record and history down the left,
   the three-tab review panel on the right — so the two sides of the platform
   are never looking at differently shaped versions of the same case. What
   changes is where it ends: the admin's job here is routing, so the panel's
   action slot holds "who should work this", never approve or escalate.

   The drawer does not trap the page behind it. There is no scrim swallowing
   clicks and no scroll lock, so the queue stays live underneath: clicking
   another row swaps this panel to that case rather than closing it, which is
   how an administrator actually reads a board — across cases, not one at a
   time through a close button.
   ============================================================================ */

export function QueueCaseDrawer({
  caseRef,
  category,
  rag,
  hold,
  holder,
  now,
  assignControl,
  onUnassign,
  onClose,
}: {
  caseRef: string | null;
  category: QueueCategory;
  rag: Rag;
  hold: Hold | null;
  holder: AdminDoctor | undefined;
  now: number;
  /** the platform select, passed in so the page keeps ownership of assignment */
  assignControl: ReactNode;
  onUnassign?: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!caseRef) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [caseRef, onClose]);

  if (!caseRef) return null;

  const order = NEW_ORDERS.find((o) => o.ref === caseRef);
  const complex = COMPLEX_CASES.find((c) => c.ref === caseRef);
  const simple = SIMPLE_REPEATS.find((r) => r.ref === caseRef);
  const escalated = ESCALATIONS.find((e) => e.ref === caseRef);
  const base = order ?? complex ?? simple ?? escalated;
  if (!base) return null;

  // simple repeats and escalations carry no demographics of their own; the
  // consultation record fills them so the panel is never half-empty
  const answers = consultationFor(caseRef, {
    ...(order && {
      sexAtBirth: order.sex, age: order.age, bmi: order.bmi, ethnicity: order.ethnicity,
      conditions: order.comorbidities, treatmentPreference: order.preference, verification: order.verification,
      submittedAt: order.submittedAt,
    }),
    ...(complex && {
      sexAtBirth: complex.sex, age: complex.age, bmi: complex.bmi, ethnicity: complex.ethnicity,
      conditions: complex.comorbidities,
    }),
  });

  const headline =
    order?.eligibility ?? complex?.flagReason ?? escalated?.reason ?? (simple ? `Last review ${simple.lastReview}` : "");

  return (
    // the wrapper only positions the panel — it must not intercept clicks on
    // the board behind it, which is what makes case-to-case swapping work
    <div className="pointer-events-none fixed inset-0 z-40 flex justify-end">
      <aside
        role="dialog"
        aria-label={`Case ${caseRef}`}
        className="pointer-events-auto relative flex h-full w-full max-w-[min(100vw,1060px)] flex-col border-l border-[var(--divider)] bg-background-neutral shadow-dialog"
      >
        <header className="shrink-0 bg-gradient-to-r from-primary-darker via-primary-dark to-primary px-6 py-4 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">
                {CATEGORY_LABEL[category]} · {pharmacyName(base.pharmacyCode)}
              </p>
              <h2 className="mt-0.5 truncate text-lg font-bold">{caseRef}</h2>
              <p className="truncate text-sm text-white/80">
                {base.med} · {base.dose}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-md p-1 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-background-paper p-5 shadow-card">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">{headline}</p>
              <p className="mt-0.5 text-sm text-text-secondary">
                {hold && holder ? (
                  <span className="inline-flex items-center gap-1.5">
                    Held by
                    <PresenceDot online={holder.online} className="h-2 w-2 ring-0" />
                    <span className="font-semibold text-text-primary">{holder.name}</span>
                    {hold.kind === "reserved" ? " · reviewing now" : ` · ${heldFor(hold, now)}`}
                  </span>
                ) : (
                  "On the shared board — no one has claimed it"
                )}
              </p>
            </div>
            <RagPill rag={rag} />
          </div>

          {/* the prescriber's two-column reading, with the panel stretched so
              its tab bar and footer line up with the left rail */}
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(280px,340px)_1fr]">
            <div className="space-y-6">
              <PatientSummaryCard
                ref_={caseRef}
                nhs={base.nhs}
                age={answers.age}
                sex={answers.sexAtBirth}
                bmi={answers.bmi}
                ethnicity={answers.ethnicity}
                pharmacyCode={base.pharmacyCode}
                comorbidities={answers.conditions}
                pill={<RagPill rag={rag} />}
              />

              {complex && (
                <>
                  <div className="rounded-lg bg-background-paper p-5 shadow-card">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Order request</p>
                    <p className="mt-2 text-base font-bold text-text-primary">{complex.orderRequest.med}</p>
                    <p className="text-sm text-text-secondary">{complex.orderRequest.detail}</p>
                    <p className="mt-1 text-sm text-text-secondary">{complex.orderRequest.meta}</p>
                  </div>

                  <div className="rounded-lg bg-background-paper p-5 shadow-card">
                    <p className="text-sm font-bold text-text-primary">Medication history</p>
                    <p className="text-xs text-text-secondary">
                      {complex.med} · {pharmacyName(complex.pharmacyCode)} SOP {complex.sopCitation.version}
                    </p>
                    <MedicationTimeline events={complex.history} />
                  </div>
                </>
              )}
            </div>

            {/* keyed so swapping cases lands on the AI tab rather than leaving
                the previous case's tab selected over different content */}
            <ReviewPanel
              key={caseRef}
              ai={order?.ai ?? complex?.ai ?? null}
              sop={complex?.sopCitation}
              caseRef={caseRef}
              answers={answers}
              noReadingBody={
                simple
                  ? "Simple repeats are auto-scored Green against the pharmacy SOP and signed in batch — there's no separate recommendation to read."
                  : "Escalated cases carry the reading from the case they were raised on; it's on the escalation itself."
              }
              actions={
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                    {hold ? "Move to" : "Send to"}
                  </span>
                  <div className="min-w-[14rem] flex-1">{assignControl}</div>
                  {hold && onUnassign && (
                    <button
                      type="button"
                      onClick={onUnassign}
                      className="text-sm font-bold text-text-secondary underline hover:text-text-primary"
                    >
                      Return to the board
                    </button>
                  )}
                  <p className="w-full text-xs text-text-secondary">
                    Routing only — the prescriber who claims it makes the decision.
                  </p>
                </div>
              }
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
