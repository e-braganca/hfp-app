"use client";

import { useState } from "react";
import { pharmacyName } from "@/lib/doctor/data";
import type { ComplexCase } from "@/lib/doctor/types";
import { AiRecommendationCard, AuditNote } from "./AiRecommendationCard";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Modal } from "@/components/ui/Modal";
import { OutcomePanel } from "./OrderReview";
import { PageHeader } from "@/components/ui/PageHeader";
import { PatientSummaryCard } from "./PatientSummaryCard";
import { RagPill } from "@/components/ui/StatusPill";
import { Toast } from "@/components/ui/Toast";

type Decision = null | "approved" | "overriding" | "overridden" | "escalated";

const OVERRIDE_REASONS = [
  "Patient tolerating dose well",
  "Recent specialist advice on file",
  "Clinical judgement — continuity of care",
  "Gap explained by supply issue",
];

export function CaseReview({ case_ }: { case_: ComplexCase }) {
  const [decision, setDecision] = useState<Decision>(null);
  const [escalating, setEscalating] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const approve = () => {
    setDecision("approved");
    setToast("Recommendation approved & audit-logged");
  };
  const confirmOverride = () => {
    setDecision("overridden");
    setToast("Override recorded & audit-logged");
  };
  const escalate = () => {
    setEscalating(false);
    setDecision("escalated");
    setToast("Escalated to senior review");
  };

  return (
    <>
      <PageHeader
        title="Complex Repeat Review"
        subtitle={`${case_.ref} · ${pharmacyName(case_.pharmacyCode)} · Flagged for ${case_.flagReason.toLowerCase()}`}
      />

      <div className="px-6 py-6 lg:px-8">
        <Breadcrumb backHref="/doctor/queue" trail={["Complex Repeats", case_.ref]} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(320px,380px)_1fr]">
          {/* left column */}
          <div className="space-y-6">
            <PatientSummaryCard
              ref_={case_.ref}
              nhs={case_.nhs}
              age={case_.age}
              sex={case_.sex}
              bmi={case_.bmi}
              ethnicity={case_.ethnicity}
              pharmacyCode={case_.pharmacyCode}
              comorbidities={case_.comorbidities}
              pill={<RagPill rag={case_.score.rag} label={`Flagged · ${case_.score.rag === "red" ? "Red" : case_.score.rag === "amber" ? "Amber" : "Review"}`} />}
            />

            <div className="rounded-lg bg-background-paper p-5 shadow-card">
              <p className="text-sm font-bold text-text-primary">Medication history</p>
              <p className="text-xs text-text-secondary">
                {case_.med} · {pharmacyName(case_.pharmacyCode)} SOP {case_.sopCitation.version}
              </p>
              <Timeline events={case_.history} />
            </div>
          </div>

          {/* right column */}
          <div className="space-y-6">
            <AiRecommendationCard
              ai={case_.ai}
              actions={
                decision === "approved" ? (
                  <OutcomePanel tone="success" title="Recommendation approved" body={`${case_.ai.recommendedRx} confirmed. Decision and SOP ${case_.sopCitation.version} recorded to the audit trail.`} />
                ) : decision === "overridden" ? (
                  <OutcomePanel tone="warning" title="Recommendation overridden" body="Your clinical override and justification were recorded and audit-logged against the active SOP version." />
                ) : decision === "escalated" ? (
                  <OutcomePanel tone="slate" title="Escalated to senior review" body="Removed from your queue and routed to senior clinical review." />
                ) : decision === "overriding" ? (
                  <OverridePanel
                    reason={reason}
                    setReason={setReason}
                    onConfirm={confirmOverride}
                    onCancel={() => setDecision(null)}
                  />
                ) : (
                  <>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={approve}
                        className="flex-1 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark"
                      >
                        Approve recommendation
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecision("overriding")}
                        className="flex-1 rounded-lg border border-[var(--divider)] px-5 py-3 text-sm font-bold text-text-primary hover:bg-background-neutral"
                      >
                        Review / Override
                      </button>
                      <button
                        type="button"
                        onClick={() => setEscalating(true)}
                        className="flex-1 rounded-lg border border-error px-5 py-3 text-sm font-bold text-error hover:bg-error-lighter"
                      >
                        Escalate / decline
                      </button>
                    </div>
                    <AuditNote />
                  </>
                )
              }
            />

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg bg-background-paper p-5 shadow-card">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Order request</p>
                <p className="mt-2 text-base font-bold text-text-primary">{case_.orderRequest.med}</p>
                <p className="text-sm text-text-secondary">{case_.orderRequest.detail}</p>
                <p className="mt-1 text-sm text-text-secondary">{case_.orderRequest.meta}</p>
              </div>
              <div className="rounded-lg bg-background-paper p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{case_.sopCitation.rule}</p>
                  <span className="rounded-md bg-background-neutral px-2 py-0.5 font-mono text-xs font-bold text-text-secondary">
                    {case_.sopCitation.version}
                  </span>
                </div>
                <p className="mt-2 text-sm italic leading-relaxed text-text-primary">
                  “{case_.sopCitation.quote}”
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={escalating}
        title="Escalate / decline"
        subtitle={`${case_.ref} · ${pharmacyName(case_.pharmacyCode)}`}
        onClose={() => setEscalating(false)}
      >
        <p className="text-sm text-text-secondary">
          This case will be removed from your queue and routed to senior clinical review. Add an optional note for the reviewer.
        </p>
        <textarea
          rows={3}
          placeholder="Optional note for the reviewer…"
          className="mt-3 w-full rounded-lg border border-[var(--divider)] p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-main-24"
        />
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setEscalating(false)}
            className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-background-neutral"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={escalate}
            className="rounded-lg bg-error px-4 py-2.5 text-sm font-bold text-white hover:bg-error-dark"
          >
            Confirm escalation
          </button>
        </div>
      </Modal>

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}

function OverridePanel({
  reason,
  setReason,
  onConfirm,
  onCancel,
}: {
  reason: string | null;
  setReason: (r: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-6 rounded-lg border border-[var(--divider)] bg-background-neutral p-5">
      <p className="text-sm font-bold text-text-primary">Override the AI recommendation</p>
      <p className="mt-1 text-xs text-text-secondary">
        Select a justification. Overrides require a reason and are audit-logged against the active SOP.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {OVERRIDE_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(r)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              reason === r
                ? "border-primary bg-primary text-white"
                : "border-[var(--divider)] bg-background-paper text-text-primary hover:bg-background-neutral"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <textarea
        rows={2}
        placeholder="Add clinical justification…"
        className="mt-3 w-full rounded-lg border border-[var(--divider)] p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-main-24"
      />
      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-background-paper"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!reason}
          onClick={onConfirm}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
        >
          Confirm override
        </button>
      </div>
    </div>
  );
}

const TL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "15 Mar 2026" / "3 Jun 2026 · today" -> Date; flag rows carry no date. */
function parseEventDate(s: string): Date | null {
  const m = s.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (!m) return null;
  const month = TL_MONTHS.indexOf(m[2]);
  return month < 0 ? null : new Date(Date.UTC(Number(m[3]), month, Number(m[1])));
}

/**
 * Medication history. Long records are noise on a repeat decision, so the
 * timeline collapses what the prescriber doesn't need in front of them:
 *   · anything older than 6 months (measured from the case's own latest
 *     event, not the wall clock — these records are fixed stories);
 *   · on a treatment-gap case, everything before the gap, however recent —
 *     the gap node itself states the dates it spans, so nothing is lost.
 * Whatever stays visible scrolls after six rows.
 */
function Timeline({ events }: { events: ComplexCase["history"] }) {
  const [expanded, setExpanded] = useState(false);

  const dates = events.map((e) => parseEventDate(e.date));
  const latest = dates.reduce<Date | null>((a, d) => (d && (!a || d > a) ? d : a), null);
  const cutoff = latest ? new Date(Date.UTC(latest.getUTCFullYear(), latest.getUTCMonth() - 6, latest.getUTCDate())) : null;
  const gapIndex = events.findIndex((e) => e.gap);

  const isCollapsed = (i: number) => {
    if (gapIndex !== -1 && i < gapIndex) return true;
    const d = dates[i];
    return !!(cutoff && d && d < cutoff);
  };

  const hiddenCount = events.filter((_, i) => isCollapsed(i)).length;
  const shown = events.map((e, i) => ({ e, i })).filter(({ i }) => expanded || !isCollapsed(i));

  return (
    <div className="mt-3">
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mb-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-[var(--divider)] px-3 py-2 text-xs font-bold text-text-secondary transition-colors hover:border-primary-light hover:text-text-primary"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            className={`transition-transform ${expanded ? "rotate-90" : ""}`}
          >
            <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {expanded ? `Hide ${hiddenCount} earlier ${hiddenCount === 1 ? "entry" : "entries"}` : `Show ${hiddenCount} earlier ${hiddenCount === 1 ? "entry" : "entries"}`}
          {!expanded && gapIndex !== -1 && (
            <span className="ml-auto font-normal text-text-disabled">before the gap</span>
          )}
        </button>
      )}

      <ol className={`space-y-0 ${shown.length > 6 ? "max-h-[360px] overflow-y-auto pr-2" : ""}`}>
        {shown.map(({ e, i }, idx) => {
          const last = idx === shown.length - 1;
          const dimmed = expanded && isCollapsed(i);
          return (
            <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
              {!last && (
                <span
                  className={`absolute left-[7px] top-4 h-full w-px ${e.flag ? "bg-error/40" : "bg-[var(--divider)]"}`}
                />
              )}
              <span
                className={`relative z-10 mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 ${
                  e.flag ? "border-error bg-error-lighter" : "border-grey-400 bg-background-paper"
                }`}
              >
                {e.flag && <span className="h-1.5 w-1.5 rounded-full bg-error" />}
              </span>
              <div className={`min-w-0 ${dimmed ? "opacity-60" : ""}`}>
                {e.flag ? (
                  <span className="inline-block rounded-full bg-error-lighter px-2.5 py-0.5 text-xs font-bold text-error-dark">
                    {e.label}
                  </span>
                ) : (
                  <p className="text-sm font-semibold text-text-primary">{e.label}</p>
                )}
                {e.date && <p className="text-xs text-text-secondary">{e.date}</p>}
                {e.detail && <p className="mt-0.5 text-xs text-error-dark">{e.detail}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
