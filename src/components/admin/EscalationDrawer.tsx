"use client";

import { useEffect } from "react";
import { AiRecommendationCard } from "@/components/doctor/AiRecommendationCard";
import { MedicationTimeline } from "@/components/doctor/MedicationTimeline";
import { PatientSummaryCard } from "@/components/doctor/PatientSummaryCard";
import { RagPill } from "@/components/ui/StatusPill";
import { pharmacyName } from "@/lib/doctor/data";
import { OUTCOME_LABEL, type AdminEscalation, type EscalationStatus } from "@/lib/admin/types";

/* ============================================================================
   Escalation review drawer — the senior reviewer gets the same clinical
   picture the doctor had (patient record, medication history, AI reading,
   order request, the SOP rule in force) plus what the doctor asked.

   The three resolutions live in the drawer footer, not on the list cards:
   deciding from a headline was the thing worth fixing. Resolving advances to
   the next open case so the reviewer works the queue without going back to
   the list.
   ============================================================================ */

export function EscalationDrawer({
  escalation,
  status,
  position,
  total,
  onClose,
  onGuidance,
  onInfo,
  onDecline,
}: {
  escalation: AdminEscalation | null;
  status: EscalationStatus;
  /** 1-based place in the current tab, for the "3 of 4" counter */
  position: number;
  total: number;
  onClose: () => void;
  onGuidance: () => void;
  onInfo: () => void;
  onDecline: () => void;
}) {
  // Esc closes, and the page behind shouldn't scroll under the panel
  useEffect(() => {
    if (!escalation) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [escalation, onClose]);

  if (!escalation) return null;
  const e = escalation;
  const d = e.detail;
  const resolved = status !== "open";

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close review"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-primary-darker/40"
      />

      <aside
        role="dialog"
        aria-label={`Escalation review ${e.ref}`}
        className="relative flex h-full w-full max-w-[min(100vw,1100px)] flex-col bg-background-neutral shadow-dialog"
      >
        {/* header */}
        <header className="shrink-0 bg-gradient-to-r from-primary-darker via-primary-dark to-primary px-6 py-4 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">
                Senior review · {position} of {total}
              </p>
              <h2 className="mt-0.5 truncate text-lg font-bold">
                {e.ref} — {e.patientName}
              </h2>
              <p className="truncate text-sm text-white/80">
                {e.reason} · {e.med}
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

        {/* body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {/* why it's here */}
          <div className="rounded-lg bg-background-paper p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-text-secondary">
                Escalated by <span className="font-semibold text-text-primary">{e.escalatedBy}</span> ·{" "}
                {pharmacyName(e.pharmacyCode)} · waiting {e.waited}
              </p>
              {resolved ? (
                <RagPill rag={OUTCOME_LABEL[status].rag} label={OUTCOME_LABEL[status].label} />
              ) : (
                <RagPill rag={e.rag} />
              )}
            </div>
            {e.note && (
              <div className="mt-3 flex gap-2.5 rounded-lg bg-background-neutral px-4 py-3 text-sm text-text-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-text-disabled">
                  <path d="M4 5h16v11H8l-4 4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
                <span>
                  <span className="font-semibold">Question from the doctor: </span>
                  {e.note}
                </span>
              </div>
            )}
          </div>

          {/* two columns once the panel is at its full 1100px, one below that */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(300px,360px)_1fr]">
            <div className="space-y-6">
              <PatientSummaryCard
                ref_={e.ref}
                nhs={d.nhs}
                age={d.age}
                sex={e.sex}
                bmi={d.bmi}
                ethnicity={d.ethnicity}
                pharmacyCode={e.pharmacyCode}
                comorbidities={d.comorbidities}
                pill={<RagPill rag={e.rag} label={`Escalated · ${e.rag === "red" ? "Red" : "Amber"}`} />}
              />

              <div className="rounded-lg bg-background-paper p-5 shadow-card">
                <p className="text-sm font-bold text-text-primary">Medication history</p>
                <p className="text-xs text-text-secondary">
                  {e.med} · {pharmacyName(e.pharmacyCode)} SOP {d.sopCitation.version}
                </p>
                <MedicationTimeline events={d.history} />
              </div>
            </div>

            <div className="space-y-6">
              <AiRecommendationCard ai={d.ai} />

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg bg-background-paper p-5 shadow-card">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Order request</p>
                  <p className="mt-2 text-base font-bold text-text-primary">{d.orderRequest.med}</p>
                  <p className="text-sm text-text-secondary">{d.orderRequest.detail}</p>
                  <p className="mt-1 text-sm text-text-secondary">{d.orderRequest.meta}</p>
                </div>
                <div className="rounded-lg bg-background-paper p-5 shadow-card">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{d.sopCitation.rule}</p>
                    <span className="rounded-md bg-background-neutral px-2 py-0.5 font-mono text-xs font-bold text-text-secondary">
                      {d.sopCitation.version}
                    </span>
                  </div>
                  <p className="mt-2 text-sm italic leading-relaxed text-text-primary">“{d.sopCitation.quote}”</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* actions */}
        <footer
          className="shrink-0 border-t border-[var(--divider)] bg-background-paper px-6 py-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {resolved ? (
            <p className="text-sm text-text-secondary">
              Resolved — <span className="font-semibold text-text-primary">{OUTCOME_LABEL[status].label}</span>. Recorded to the
              audit trail against SOP {d.sopCitation.version}.
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onGuidance}
                  className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-white hover:bg-primary-dark"
                >
                  Return with guidance
                </button>
                <button
                  type="button"
                  onClick={onInfo}
                  className="h-11 rounded-lg border border-[var(--divider)] px-5 text-sm font-bold text-text-primary hover:bg-background-neutral"
                >
                  Request patient info
                </button>
                <button
                  type="button"
                  onClick={onDecline}
                  className="h-11 rounded-lg border border-error px-5 text-sm font-bold text-error hover:bg-error-lighter"
                >
                  Decline order
                </button>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
                </svg>
                Resolving opens the next case in the list
              </p>
            </div>
          )}
        </footer>
      </aside>
    </div>
  );
}
