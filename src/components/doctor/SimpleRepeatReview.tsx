"use client";

import { useMemo, useState } from "react";
import { pharmacyName } from "@/lib/doctor/data";
import type { SimpleRepeat } from "@/lib/doctor/types";
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
import { DecisionButtons, EscalateModal, OrderRequestCard } from "./caseParts";
import { RequestInfoEmailModal } from "@/components/shared/RequestInfoEmailModal";
import { requestInfo as recordInfoRequest } from "@/lib/doctor/info-requests";
import { consultationFor } from "@/lib/doctor/consultation";
import { OutcomePanel } from "./OutcomePanel";
import { PatientMediaCard } from "@/components/shared/PatientMedia";
import { PatientSummaryCard } from "./PatientSummaryCard";
import { ReservationBanner } from "./ReservationBanner";
import { ReviewShell } from "./ReviewShell";
import { ScorePill } from "@/components/ui/StatusPill";
import { useCaseHold, useFlashToast, useNextCase } from "./queueHooks";
import { Toast } from "@/components/ui/Toast";

/* ============================================================================
   One simple repeat, on its own.

   These are normally signed in batch from the queue — green, same dose. This
   is the same case when the prescriber wants to look before signing, which
   until now they could only do by trusting the batch dialog's one-line
   summary.

   The reading is shorter than a new start's: there is no rule being weighed,
   so there is no SOP quote, only a check that nothing has changed. But it is a
   reading, and it names what is being continued — a prescriber cannot sign a
   continuation they have not been shown.
   ============================================================================ */

type Decision = null | "approved" | "info" | "escalated";

export function SimpleRepeatReview({ repeat }: { repeat: SimpleRepeat }) {
  const [decision, setDecision] = useState<Decision>(null);
  const [escalating, setEscalating] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [toast, setToast] = useFlashToast();
  const recommended = useMemo(() => parseRecommended(repeat.ai.recommendedRx), [repeat.ai.recommendedRx]);
  const [rx, setRx] = useState<Prescription>(() => recommended ?? fallbackFrom(repeat.med, repeat.dose));
  const amended = !sameAsRecommended(rx, recommended);
  const needsReason = !amendmentReady(rx, recommended);
  const hold = useCaseHold(repeat.ref);
  const upNext = useNextCase(repeat.ref);

  const approve = () => {
    setDecision("approved");
    setToast(
      amended
        ? `${prescriptionLabel(rx)} issued — amendment and reason audit-logged`
        : `${prescriptionLabel(rx)} issued & audit-logged`,
    );
  };
  const requestInfo = (subject: string, items: string[], note?: string) => {
    setEmailing(false);
    setDecision("info");
    recordInfoRequest(repeat.ref, hold.me.name, subject, items, note);
    setToast(`Email sent to ${repeat.patientName} — "${subject}"`);
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

            <OrderRequestCard
              med={repeat.med}
              detail={`${repeat.dose} · self-requested repeat`}
              meta={`${pharmacyName(repeat.pharmacyCode)} · last reviewed ${repeat.lastReview}`}
            />

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
            ai={repeat.ai}
            caseRef={repeat.ref}
            answers={answers}
            prescription={
              <PrescriptionPicker
                recommended={recommended}
                recommendedText={repeat.ai.recommendedRx}
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
              ) : decision === "info" ? (
                <OutcomePanel
                  tone="warning"
                  title="More information requested"
                  body="The repeat stays pending until the patient responds, then re-enters triage."
                  onNext={upNext.hasNext ? () => hold.leaveTo(upNext.resolveHref()) : undefined}
                />
              ) : (
                <>
                  <DecisionButtons
                    amended={amended}
                    disabled={!hold.claimed || needsReason}
                    onApprove={approve}
                    onRequestInfo={() => setEmailing(true)}
                    onEscalate={() => setEscalating(true)}
                  />
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

      <RequestInfoEmailModal
        open={emailing}
        onClose={() => setEmailing(false)}
        onSend={({ subject, items, note }) => requestInfo(subject, items, note)}
        patientName={repeat.patientName}
        sex={answers.sexAtBirth === "Male" || answers.sexAtBirth === "Female" ? answers.sexAtBirth : undefined}
        caseRef={repeat.ref}
        senderName={hold.me.name}
        senderRole="Clinical Lead · GMC 7041182"
      />

      <EscalateModal
        open={escalating}
        caseRef={repeat.ref}
        pharmacy={pharmacyName(repeat.pharmacyCode)}
        what="repeat"
        onClose={() => setEscalating(false)}
        onConfirm={escalate}
      />

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
