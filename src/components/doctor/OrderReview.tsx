"use client";

import { useMemo, useState } from "react";
import { pharmacyName } from "@/lib/doctor/data";
import type { NewOrder } from "@/lib/doctor/types";
import { AuditNote } from "./AiRecommendationCard";
import { OutcomePanel } from "./OutcomePanel";
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
import { consultationFor } from "@/lib/doctor/consultation";
import { PatientSummaryCard } from "./PatientSummaryCard";
import { ReservationBanner } from "./ReservationBanner";
import { ReviewShell } from "./ReviewShell";
import { useCaseHold, useFlashToast, useNextCase } from "./queueHooks";
import { ScorePill } from "@/components/ui/StatusPill";
import { Toast } from "@/components/ui/Toast";
import { RequestInfoEmailModal } from "@/components/shared/RequestInfoEmailModal";
import { PatientMediaCard } from "@/components/shared/PatientMedia";
import { requestInfo as recordInfoRequest } from "@/lib/doctor/info-requests";

type Decision = null | "approved" | "info" | "escalated";

export function OrderReview({ order }: { order: NewOrder }) {
  const [decision, setDecision] = useState<Decision>(null);
  const [escalating, setEscalating] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [toast, setToast] = useFlashToast();
  /**
   * The recommendation is the starting selection, not a separate mode — the
   * prescriber is always looking at what they are about to issue.
   */
  const recommended = useMemo(() => parseRecommended(order.ai.recommendedRx), [order.ai.recommendedRx]);
  const [rx, setRx] = useState<Prescription>(
    () => recommended ?? fallbackFrom(order.med, order.dose),
  );
  const amended = !sameAsRecommended(rx, recommended);
  /**
   * Issuing anything other than what was recommended needs a reason on the
   * audit trail — including issuing where the reading says to escalate
   * instead. The prescriber is allowed to disagree; they are not allowed to
   * disagree silently.
   */
  const needsReason = !amendmentReady(rx, recommended);
  const hold = useCaseHold(order.ref);
  const upNext = useNextCase(order.ref);

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
    // parks the case: it leaves the claimable tabs for Awaiting info, and the
    // admin's waiting clock stops and resets — the delay is the patient's now
    recordInfoRequest(order.ref, hold.me.name, subject, items, note);
    setToast(`Email sent to ${order.patientName} — "${subject}"`);
  };
  const escalate = () => {
    setEscalating(false);
    setDecision("escalated");
    setToast("Escalated to senior review");
  };

  return (
    <>
      <ReviewShell
        title="New Order Review"
        subtitle={`${order.ref} · ${pharmacyName(order.pharmacyCode)} · new GLP-1 start`}
        backHref="/doctor/queue"
        trail={["New Orders", order.ref]}
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
              ref_={order.ref}
              nhs={order.nhs}
              age={order.age}
              sex={order.sex}
              bmi={order.bmi}
              ethnicity={order.ethnicity}
              pharmacyCode={order.pharmacyCode}
              comorbidities={order.comorbidities}
              pill={<ScorePill score={order.score} />}
            />

            <OrderRequestCard
              med={order.med}
              detail={`${order.dose} · self-requested new start`}
              meta={`${pharmacyName(order.pharmacyCode)} · submitted ${order.submittedAt}`}
            >
              <div className="mt-3 border-t border-[var(--divider)] pt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Patient preference
                </p>
                <p className="mt-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold ${
                      order.preference === "Let prescriber recommend"
                        ? "bg-background-neutral text-text-secondary"
                        : "bg-primary-lighter text-primary-dark"
                    }`}
                  >
                    {order.preference}
                  </span>
                </p>
                <p className="mt-1.5 text-xs text-text-secondary">
                  Chosen at onboarding — the AI recommendation accounts for it below.
                </p>
              </div>
            </OrderRequestCard>

            <PatientMediaCard
              caseRef={order.ref}
              weightPhoto={order.verification.weightPhoto}
              idDocument={order.verification.idDocument}
              note="Visually confirm the ID matches the weight photo before issuing."
            />

          </>
        }
        right={
          <ReviewPanel
            ai={order.ai}
            caseRef={order.ref}
            answers={consultationFor(order.ref, {
              sexAtBirth: order.sex,
              age: order.age,
              bmi: order.bmi,
              ethnicity: order.ethnicity,
              conditions: order.comorbidities,
              treatmentPreference: order.preference,
              verification: order.verification,
            })}
            prescription={
              <PrescriptionPicker
                recommended={recommended}
                recommendedText={order.ai.recommendedRx}
                value={rx}
                onChange={setRx}
                disabled={!hold.claimed}
              />
            }
            actions={
              decision ? (
                <OrderOutcome
                  decision={decision}
                  order={order}
                  issued={amended ? rx : null}
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
        patientName={order.patientName}
        sex={order.sex}
        caseRef={order.ref}
        senderName={hold.me.name}
        senderRole="Clinical Lead · GMC 7041182"
      />

      <EscalateModal
        open={escalating}
        caseRef={order.ref}
        pharmacy={pharmacyName(order.pharmacyCode)}
        what="order"
        onClose={() => setEscalating(false)}
        onConfirm={escalate}
      />

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}

function OrderOutcome({
  decision,
  order,
  issued,
  onNext,
}: {
  decision: Exclude<Decision, null>;
  order: NewOrder;
  /** set only when what was issued differs from the recommendation */
  issued: Prescription | null;
  onNext?: () => void;
}) {
  const map = {
    approved: {
      tone: "success" as const,
      title: issued ? "Amended prescription issued" : "Prescription issued",
      body: issued
        ? `${prescriptionLabel(issued)} issued to ${pharmacyName(order.pharmacyCode)} — amended from ${order.ai.recommendedRx}. The amendment, your reason and the active SOP version are on the audit trail.`
        : `${order.ai.recommendedRx} issued to ${pharmacyName(order.pharmacyCode)}. Decision and active SOP version recorded to the audit trail.`,
    },
    info: {
      tone: "warning" as const,
      title: "More information requested",
      body: "The order stays pending until the patient responds, then re-enters triage.",
    },
    escalated: {
      tone: "slate" as const,
      title: "Escalated to senior review",
      body: "Removed from your queue and routed to senior clinical review.",
    },
  }[decision];

  return <OutcomePanel {...map} onNext={onNext} />;
}
