"use client";

import { useMemo, useState } from "react";
import { pharmacyName } from "@/lib/doctor/data";
import type { NewOrder } from "@/lib/doctor/types";
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
import { PatientSummaryCard } from "./PatientSummaryCard";
import { ReservationBanner } from "./ReservationBanner";
import { ReviewShell } from "./ReviewShell";
import { useCaseHold, useNextCase } from "./queueHooks";
import { RagPill } from "@/components/ui/StatusPill";
import { Toast } from "@/components/ui/Toast";
import { RequestInfoEmailModal } from "@/components/shared/RequestInfoEmailModal";
import { PatientMediaCard } from "@/components/shared/PatientMedia";
import { requestInfo as recordInfoRequest } from "@/lib/doctor/info-requests";

type Decision = null | "approved" | "info" | "escalated";

export function OrderReview({ order }: { order: NewOrder }) {
  const [decision, setDecision] = useState<Decision>(null);
  const [escalating, setEscalating] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
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
            onRelease={hold.releaseCase}
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
              pill={<RagPill rag={order.score.rag} />}
            />

            <div className="rounded-lg bg-background-paper p-5 shadow-card">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Order request
              </p>
              <p className="mt-2 text-base font-bold text-text-primary">{order.med}</p>
              <p className="text-sm text-text-secondary">{order.dose} · self-requested new start</p>
              <p className="mt-1 text-sm text-text-secondary">
                {pharmacyName(order.pharmacyCode)} · submitted {order.submittedAt}
              </p>
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
            </div>

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
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={approve}
                      disabled={!hold.claimed || needsReason}
                      className="flex-1 basis-40 whitespace-nowrap rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
                    >
                      {amended ? "Issue amended" : "Approve & issue"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailing(true)}
                      disabled={!hold.claimed}
                      className="flex-1 basis-40 whitespace-nowrap rounded-lg border border-[var(--divider)] px-4 py-3 text-sm font-bold text-text-primary hover:bg-background-neutral disabled:opacity-40"
                    >
                      Request more info
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
        senderName="Dr. Eleanor Hart"
        senderRole="Clinical Lead · GMC 7041182"
      />

      <Modal
        open={escalating}
        title="Escalate to senior review"
        subtitle={`${order.ref} · ${pharmacyName(order.pharmacyCode)}`}
        onClose={() => setEscalating(false)}
      >
        <p className="text-sm text-text-secondary">
          This order will be removed from your queue and routed to senior clinical review. Add an optional note for the reviewer.
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

export function OutcomePanel({
  tone,
  title,
  body,
  onNext,
}: {
  tone: "success" | "error" | "warning" | "slate";
  title: string;
  body: string;
  /**
   * Keep working without passing through the queue. No label: which case is
   * next is only known when this is pressed, since someone else may claim it
   * while this screen sits open.
   */
  onNext?: () => void;
}) {
  const toneCls = {
    success: "bg-success-lighter text-success-dark",
    error: "bg-error-lighter text-error-dark",
    warning: "bg-warning-lighter text-warning-dark",
    slate: "bg-background-neutral text-text-secondary",
  }[tone];
  return (
    <div className="rounded-lg bg-background-neutral p-6 text-center">
      <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${toneCls}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="m5 12 5 5L20 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="mt-3 text-base font-bold text-text-primary">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">{body}</p>
      {/* next case leads, because the common path after deciding one case is
          deciding another — the queue is the way out, not the way on */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
          >
            Next case &rarr;
          </button>
        )}
        <a
          href="/doctor/queue"
          className={`rounded-lg px-5 py-2.5 text-sm font-bold ${
            onNext
              ? "border border-[var(--divider)] text-text-primary hover:bg-background-neutral"
              : "bg-primary text-white hover:bg-primary-dark"
          }`}
        >
          Back to Work Queue
        </a>
      </div>
    </div>
  );
}
