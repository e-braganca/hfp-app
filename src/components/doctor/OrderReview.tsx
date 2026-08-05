"use client";

import { useState } from "react";
import { pharmacyName } from "@/lib/doctor/data";
import type { NewOrder } from "@/lib/doctor/types";
import { AiRecommendationCard, AuditNote } from "./AiRecommendationCard";
import { ConsultationAnswersCard } from "./ConsultationAnswersCard";
import { Modal } from "@/components/ui/Modal";
import { consultationFor } from "@/lib/doctor/consultation";
import { PatientSummaryCard } from "./PatientSummaryCard";
import { ReservationBanner } from "./ReservationBanner";
import { ReviewShell } from "./ReviewShell";
import { useCaseHold } from "./queueHooks";
import { RagPill } from "@/components/ui/StatusPill";
import { Toast } from "@/components/ui/Toast";
import { RequestInfoEmailModal } from "@/components/shared/RequestInfoEmailModal";
import { CameraIcon, IdIcon, WarnIcon } from "@/components/ui/icons";

type Decision = null | "approved" | "declined" | "info" | "escalated";

export function OrderReview({ order }: { order: NewOrder }) {
  const [decision, setDecision] = useState<Decision>(null);
  const [escalating, setEscalating] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const isDecline = order.verdict === "decline";
  const hold = useCaseHold(order.ref);

  const approve = () => {
    setDecision(isDecline ? "declined" : "approved");
    setToast(isDecline ? "Order declined & audit-logged" : "Prescription issued & audit-logged");
  };
  const requestInfo = (subject: string) => {
    setEmailing(false);
    setDecision("info");
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

            <div className="rounded-lg bg-background-paper p-5 shadow-card">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Identity &amp; weight verification
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <VerifyTile icon={<CameraIcon />} title="Weight photo" caption={order.verification.weightPhoto} />
                <VerifyTile icon={<IdIcon />} title="ID document" caption={order.verification.idDocument} />
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-warning-lighter px-3 py-2.5 text-sm text-warning-darker">
                <WarnIcon width={18} height={18} className="mt-0.5 shrink-0 text-warning-dark" />
                Visually confirm the ID matches the weight photo before issuing.
              </div>
            </div>

            <ConsultationAnswersCard
              answers={consultationFor(order.ref, {
                sexAtBirth: order.sex,
                age: order.age,
                bmi: order.bmi,
                ethnicity: order.ethnicity,
                conditions: order.comorbidities,
                treatmentPreference: order.preference,
                verification: order.verification,
              })}
            />
          </>
        }
        right={
          <AiRecommendationCard
            ai={order.ai}
            actions={
              decision ? (
                <OrderOutcome decision={decision} order={order} />
              ) : (
                <>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={approve}
                      disabled={!hold.claimed}
                      className={`flex-1 basis-40 whitespace-nowrap rounded-lg px-4 py-3 text-sm font-bold text-white disabled:opacity-40 ${
                        isDecline ? "bg-error hover:bg-error-dark" : "bg-primary hover:bg-primary-dark"
                      }`}
                    >
                      {isDecline ? "Decline order" : "Approve & issue"}
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

      <RequestInfoEmailModal
        open={emailing}
        onClose={() => setEmailing(false)}
        onSend={({ subject }) => requestInfo(subject)}
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

function VerifyTile({ icon, title, caption }: { icon: React.ReactNode; title: string; caption: string }) {
  return (
    <div className="rounded-lg border border-[var(--divider)] p-3">
      <div className="flex h-20 items-center justify-center rounded-md bg-background-neutral text-text-disabled">
        {icon}
      </div>
      <p className="mt-2 text-sm font-bold text-text-primary">{title}</p>
      <p className="text-xs text-text-secondary">{caption}</p>
    </div>
  );
}

function OrderOutcome({ decision, order }: { decision: Exclude<Decision, null>; order: NewOrder }) {
  const map = {
    approved: {
      tone: "success" as const,
      title: "Prescription issued",
      body: `${order.ai.recommendedRx} issued to ${pharmacyName(order.pharmacyCode)}. Decision and active SOP version recorded to the audit trail.`,
    },
    declined: {
      tone: "error" as const,
      title: "Order declined",
      body: "The patient has been notified and signposted. Decision recorded to the audit trail.",
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

  return <OutcomePanel {...map} />;
}

export function OutcomePanel({
  tone,
  title,
  body,
}: {
  tone: "success" | "error" | "warning" | "slate";
  title: string;
  body: string;
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
      <a
        href="/doctor/queue"
        className="mt-5 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
      >
        Back to Work Queue
      </a>
    </div>
  );
}
