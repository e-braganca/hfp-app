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
import { DecisionButtons, EscalateModal, OrderRequestCard } from "./caseParts";
import { RequestInfoEmailModal } from "@/components/shared/RequestInfoEmailModal";
import { requestInfo as recordInfoRequest } from "@/lib/doctor/info-requests";
import { consultationFor } from "@/lib/doctor/consultation";
import { OutcomePanel } from "./OutcomePanel";
import { PatientSummaryCard } from "./PatientSummaryCard";
import { ScorePill } from "@/components/ui/StatusPill";
import { MedicationTimeline } from "./MedicationTimeline";
import { ReservationBanner } from "./ReservationBanner";
import { ReviewShell } from "./ReviewShell";
import { useCaseHold, useFlashToast, useNextCase } from "./queueHooks";
import { Toast } from "@/components/ui/Toast";
import { PatientMediaCard } from "@/components/shared/PatientMedia";

type Decision = null | "approved" | "info" | "escalated";

export function CaseReview({ case_ }: { case_: ComplexCase }) {
  const [decision, setDecision] = useState<Decision>(null);
  const [escalating, setEscalating] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [toast, setToast] = useFlashToast();
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
  const requestInfo = (subject: string, items: string[], note?: string) => {
    setEmailing(false);
    setDecision("info");
    recordInfoRequest(case_.ref, hold.me.name, subject, items, note);
    setToast(`Email sent to ${case_.patientName} — "${subject}"`);
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
              pill={<ScorePill score={case_.score} />}
            />

            <OrderRequestCard
              med={case_.orderRequest.med}
              detail={case_.orderRequest.detail}
              meta={case_.orderRequest.meta}
            />

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
                ) : decision === "info" ? (
                  <OutcomePanel
                    tone="warning"
                    title="More information requested"
                    body="The case stays pending until the patient responds, then re-enters triage."
                    onNext={upNext.hasNext ? () => hold.leaveTo(upNext.resolveHref()) : undefined}
                  />
                ) : (
                  <>
                    {/* never "decline": a prescriber's only way out of a case
                        they won't issue is a senior, who can decline */}
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
        patientName={case_.patientName}
        sex={case_.sex}
        caseRef={case_.ref}
        senderName={hold.me.name}
        senderRole="Clinical Lead · GMC 7041182"
      />

      <EscalateModal
        open={escalating}
        caseRef={case_.ref}
        pharmacy={pharmacyName(case_.pharmacyCode)}
        onClose={() => setEscalating(false)}
        onConfirm={escalate}
      />

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
