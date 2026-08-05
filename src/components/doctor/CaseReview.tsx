"use client";

import { useState } from "react";
import { pharmacyName } from "@/lib/doctor/data";
import type { ComplexCase } from "@/lib/doctor/types";
import { AiRecommendationCard, AuditNote } from "./AiRecommendationCard";
import { ConsultationAnswersCard } from "./ConsultationAnswersCard";
import { Modal } from "@/components/ui/Modal";
import { consultationFor } from "@/lib/doctor/consultation";
import { OutcomePanel } from "./OrderReview";
import { PatientSummaryCard } from "./PatientSummaryCard";
import { RagPill } from "@/components/ui/StatusPill";
import { MedicationTimeline } from "./MedicationTimeline";
import { ReservationBanner } from "./ReservationBanner";
import { ReviewShell } from "./ReviewShell";
import { useCaseHold } from "./queueHooks";
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
  const hold = useCaseHold(case_.ref);

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
      <ReviewShell
        title="Complex Repeat Review"
        subtitle={`${case_.ref} · ${pharmacyName(case_.pharmacyCode)} · Flagged for ${case_.flagReason.toLowerCase()}`}
        backHref="/doctor/queue"
        trail={["Complex Repeats", case_.ref]}
        banner={
          <ReservationBanner
            claimed={hold.claimed}
            secondsLeft={hold.secondsLeft}
            onClaim={hold.claimCase}
            onRelease={hold.releaseCase}
          />
        }
        left={
          <>
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

            {/* same slot the new-order review puts it in */}
            <div className="rounded-lg bg-background-paper p-5 shadow-card">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Order request</p>
              <p className="mt-2 text-base font-bold text-text-primary">{case_.orderRequest.med}</p>
              <p className="text-sm text-text-secondary">{case_.orderRequest.detail}</p>
              <p className="mt-1 text-sm text-text-secondary">{case_.orderRequest.meta}</p>
            </div>

            <div className="rounded-lg bg-background-paper p-5 shadow-card">
              <p className="text-sm font-bold text-text-primary">Medication history</p>
              <p className="text-xs text-text-secondary">
                {case_.med} · {pharmacyName(case_.pharmacyCode)} SOP {case_.sopCitation.version}
              </p>
              <MedicationTimeline events={case_.history} />
            </div>

            <ConsultationAnswersCard
              answers={consultationFor(case_.ref, {
                sexAtBirth: case_.sex,
                age: case_.age,
                bmi: case_.bmi,
                ethnicity: case_.ethnicity,
                conditions: case_.comorbidities,
              })}
            />
          </>
        }
        right={
          <AiRecommendationCard
            ai={case_.ai}
            sop={case_.sopCitation}
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
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={approve}
                        disabled={!hold.claimed}
                        className="flex-1 basis-40 whitespace-nowrap rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
                      >
                        Approve recommendation
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecision("overriding")}
                        disabled={!hold.claimed}
                        className="flex-1 basis-40 whitespace-nowrap rounded-lg border border-[var(--divider)] px-4 py-3 text-sm font-bold text-text-primary hover:bg-background-neutral disabled:opacity-40"
                      >
                        Review / Override
                      </button>
                      <button
                        type="button"
                        onClick={() => setEscalating(true)}
                        disabled={!hold.claimed}
                        className="flex-1 basis-40 whitespace-nowrap rounded-lg border border-error px-4 py-3 text-sm font-bold text-error hover:bg-error-lighter disabled:opacity-40"
                      >
                        Escalate / decline
                      </button>
                    </div>
                    {hold.claimed ? (
                      <AuditNote />
                    ) : (
                      <p className="mt-3 text-xs font-semibold text-warning-dark">
                        Claim this case to unlock the decision.
                      </p>
                    )}
                  </>
                )
            }
          />
        }
      />

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
    <div className="rounded-lg border border-[var(--divider)] bg-background-neutral p-5">
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
