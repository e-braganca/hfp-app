"use client";

import { useMemo, useState } from "react";
import { pharmacyName } from "@/lib/doctor/data";
import type { ComplexCase } from "@/lib/doctor/types";
import { AuditNote } from "./AiRecommendationCard";
import { ReviewPanel } from "./ReviewPanel";
import {
  PrescriptionPicker,
  amendmentReady,
  fallbackFrom,
  parseRecommended,
  prescriptionLabel,
  sameAsRecommended,
  type Prescription,
} from "./PrescriptionPicker";
import { Modal } from "@/components/ui/Modal";
import { consultationFor } from "@/lib/doctor/consultation";
import { OutcomePanel } from "./OrderReview";
import { PatientSummaryCard } from "./PatientSummaryCard";
import { RagPill } from "@/components/ui/StatusPill";
import { MedicationTimeline } from "./MedicationTimeline";
import { ReservationBanner } from "./ReservationBanner";
import { ReviewShell } from "./ReviewShell";
import { useCaseHold, useNextCase } from "./queueHooks";
import { Toast } from "@/components/ui/Toast";
import { PatientMediaCard } from "@/components/shared/PatientMedia";

type Decision = null | "approved" | "escalated";

export function CaseReview({ case_ }: { case_: ComplexCase }) {
  const [decision, setDecision] = useState<Decision>(null);
  const [escalating, setEscalating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  /**
   * Same mechanism as the new-order review: the recommendation is the opening
   * selection, not a separate mode. Departing from it is editing what is on
   * screen and saying why, rather than passing through an override dialog that
   * never showed what was being overridden.
   */
  const recommended = useMemo(() => parseRecommended(case_.ai.recommendedRx), [case_.ai.recommendedRx]);
  const [rx, setRx] = useState<Prescription>(() => recommended ?? fallbackFrom(case_.med, case_.dose));
  const amended = !sameAsRecommended(rx, recommended);
  const needsReason = !amendmentReady(rx, recommended);
  const hold = useCaseHold(case_.ref);
  const upNext = useNextCase(case_.ref);

  const approve = () => {
    setDecision("approved");
    setToast(
      amended
        ? `${prescriptionLabel(rx)} issued — amendment and reason audit-logged`
        : "Prescription issued & audit-logged",
    );
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
            onSkip={upNext.hasNext ? () => hold.skipTo(upNext.resolveHref()) : undefined}
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

            <PatientMediaCard
              caseRef={case_.ref}
              weightPhoto="Uploaded at last review"
              idDocument="Verified at sign-up"
              note="Visually confirm the ID matches the weight photo before issuing."
            />

            <div className="rounded-lg bg-background-paper p-5 shadow-card">
              <p className="text-sm font-bold text-text-primary">Medication history</p>
              <p className="text-xs text-text-secondary">
                {case_.med} · {pharmacyName(case_.pharmacyCode)} SOP {case_.sopCitation.version}
              </p>
              <MedicationTimeline events={case_.history} />
            </div>

          </>
        }
        right={
          <ReviewPanel
            ai={case_.ai}
            sop={case_.sopCitation}
            caseRef={case_.ref}
            answers={consultationFor(case_.ref, {
              sexAtBirth: case_.sex,
              age: case_.age,
              bmi: case_.bmi,
              ethnicity: case_.ethnicity,
              conditions: case_.comorbidities,
            })}
            prescription={
              <PrescriptionPicker
                recommended={recommended}
                recommendedText={case_.ai.recommendedRx}
                value={rx}
                onChange={setRx}
                disabled={!hold.claimed}
              />
            }
            actions={
                decision === "approved" ? (
                  <OutcomePanel
                    tone={amended ? "warning" : "success"}
                    title={amended ? "Amended prescription issued" : "Prescription issued"}
                    body={
                      amended
                        ? `${prescriptionLabel(rx)} issued — amended from ${case_.ai.recommendedRx}. The amendment, your reason and SOP ${case_.sopCitation.version} are on the audit trail.`
                        : `${case_.ai.recommendedRx} confirmed. Decision and SOP ${case_.sopCitation.version} recorded to the audit trail.`
                    }
                    onNext={upNext.hasNext ? () => hold.leaveTo(upNext.resolveHref()) : undefined}
                  />
                ) : decision === "escalated" ? (
                  <OutcomePanel tone="slate" title="Escalated to senior review" body="Removed from your queue and routed to senior clinical review." onNext={upNext.hasNext ? () => hold.leaveTo(upNext.resolveHref()) : undefined} />
                ) : (
                  <>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={approve}
                        disabled={!hold.claimed || needsReason}
                        className="flex-1 basis-40 whitespace-nowrap rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
                      >
                        {amended ? "Issue amended" : "Approve & issue"}
                      </button>
                      {/* never "decline": a prescriber's only way out of a case
                          they won't issue is a senior, who can decline */}
                      <button
                        type="button"
                        onClick={() => setEscalating(true)}
                        disabled={!hold.claimed}
                        className="flex-1 basis-40 whitespace-nowrap rounded-lg border border-warning px-4 py-3 text-sm font-bold text-warning-dark hover:bg-warning-lighter disabled:opacity-40"
                      >
                        Escalate
                      </button>
                    </div>
                    {hold.claimed && needsReason ? (
                      <p className="mt-3 text-xs font-semibold text-warning-dark">
                        Say why you&rsquo;re departing from the recommendation before issuing.
                      </p>
                    ) : hold.claimed ? (
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
        title="Escalate to senior review"
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
            className="rounded-lg bg-warning-dark px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            Confirm escalation
          </button>
        </div>
      </Modal>

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
