"use client";

import { useState } from "react";
import { pharmacyName } from "@/lib/doctor/data";
import type { SimpleRepeat } from "@/lib/doctor/types";
import { AuditNote } from "./AiRecommendationCard";
import { ReviewPanel } from "./ReviewPanel";
import {
  PrescriptionPicker,
  fallbackFrom,
  prescriptionLabel,
  type Prescription,
} from "./PrescriptionPicker";
import { Modal } from "@/components/ui/Modal";
import { consultationFor } from "@/lib/doctor/consultation";
import { OutcomePanel } from "./OrderReview";
import { PatientMediaCard } from "@/components/shared/PatientMedia";
import { PatientSummaryCard } from "./PatientSummaryCard";
import { ReservationBanner } from "./ReservationBanner";
import { ReviewShell } from "./ReviewShell";
import { ScorePill } from "@/components/ui/StatusPill";
import { useCaseHold, useNextCase } from "./queueHooks";
import { Toast } from "@/components/ui/Toast";

/* ============================================================================
   One simple repeat, on its own.

   These are normally signed in batch from the queue — green, same dose, no
   reading to argue with. This is the same case when the prescriber wants to
   look before signing, which until now they could only do by trusting the
   batch dialog's one-line summary.

   There is no AI recommendation to approve or depart from, so the picker opens
   on the continuation the patient asked for and any change is just a change —
   no justification gate, because there is no recommendation to justify against.
   ============================================================================ */

type Decision = null | "approved" | "escalated";

export function SimpleRepeatReview({ repeat }: { repeat: SimpleRepeat }) {
  const [decision, setDecision] = useState<Decision>(null);
  const [escalating, setEscalating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [rx, setRx] = useState<Prescription>(() => fallbackFrom(repeat.med, repeat.dose));
  const hold = useCaseHold(repeat.ref);
  const upNext = useNextCase(repeat.ref);

  const approve = () => {
    setDecision("approved");
    setToast(`${prescriptionLabel(rx)} issued & audit-logged`);
  };
  const escalate = () => {
    setEscalating(false);
    setDecision("escalated");
    setToast("Escalated to senior review");
  };

  const answers = consultationFor(repeat.ref);

  return (
    <>
      <ReviewShell
        title="Simple Repeat Review"
        subtitle={`${repeat.ref} · ${pharmacyName(repeat.pharmacyCode)} · continuation at the same dose`}
        backHref="/doctor/queue"
        trail={["Simple Repeats", repeat.ref]}
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
              ref_={repeat.ref}
              nhs={repeat.nhs}
              age={answers.age}
              sex={answers.sexAtBirth}
              bmi={answers.bmi}
              ethnicity={answers.ethnicity}
              pharmacyCode={repeat.pharmacyCode}
              comorbidities={answers.conditions}
              pill={<ScorePill score={repeat.score} />}
            />

            <div className="rounded-lg bg-background-paper p-5 shadow-card">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Order request</p>
              <p className="mt-2 text-base font-bold text-text-primary">{repeat.med}</p>
              <p className="text-sm text-text-secondary">{repeat.dose} · self-requested repeat</p>
              <p className="mt-1 text-sm text-text-secondary">
                {pharmacyName(repeat.pharmacyCode)} · last reviewed {repeat.lastReview}
              </p>
            </div>

            <PatientMediaCard
              caseRef={repeat.ref}
              weightPhoto={`Uploaded ${repeat.lastReview}`}
              idDocument="Verified at sign-up"
              note="Visually confirm the ID matches the weight photo before issuing."
            />
          </>
        }
        right={
          <ReviewPanel
            ai={null}
            noReadingBody="Simple repeats are auto-scored Green against the pharmacy SOP — same medication, same dose, nothing flagged. There is no separate recommendation to read, so what you issue below is yours."
            caseRef={repeat.ref}
            answers={answers}
            prescription={
              <PrescriptionPicker
                recommended={null}
                recommendedText="no reading on a green simple repeat"
                value={rx}
                onChange={setRx}
                disabled={!hold.claimed}
              />
            }
            actions={
              decision === "approved" ? (
                <OutcomePanel
                  tone="success"
                  title="Prescription issued"
                  body={`${prescriptionLabel(rx)} issued to ${pharmacyName(repeat.pharmacyCode)}. Decision and the active SOP version recorded to the audit trail.`}
                  onNext={upNext.hasNext ? () => hold.leaveTo(upNext.resolveHref()) : undefined}
                />
              ) : decision === "escalated" ? (
                <OutcomePanel
                  tone="slate"
                  title="Escalated to senior review"
                  body="Removed from your queue and routed to senior clinical review."
                  onNext={upNext.hasNext ? () => hold.leaveTo(upNext.resolveHref()) : undefined}
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
                      Approve &amp; issue
                    </button>
                    <button
                      type="button"
                      onClick={() => setEscalating(true)}
                      disabled={!hold.claimed}
                      className="flex-1 basis-40 whitespace-nowrap rounded-lg border border-warning px-4 py-3 text-sm font-bold text-warning-dark hover:bg-warning-lighter disabled:opacity-40"
                    >
                      Escalate
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
        title="Escalate to senior review"
        subtitle={`${repeat.ref} · ${pharmacyName(repeat.pharmacyCode)}`}
        onClose={() => setEscalating(false)}
      >
        <p className="text-sm text-text-secondary">
          This repeat will be removed from your queue and routed to senior clinical review. Add an optional note for the
          reviewer.
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
