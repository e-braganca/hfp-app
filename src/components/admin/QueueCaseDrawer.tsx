"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MedicationTimeline } from "@/components/doctor/MedicationTimeline";
import { OutcomePanel } from "@/components/doctor/OrderReview";
import { PatientSummaryCard } from "@/components/doctor/PatientSummaryCard";
import { ReviewPanel } from "@/components/doctor/ReviewPanel";
import {
  PrescriptionPicker,
  amendmentReady,
  fallbackFrom,
  parseRecommended,
  prescriptionLabel,
  sameAsRecommended,
  type Prescription,
} from "@/components/doctor/PrescriptionPicker";
import { PatientMediaCard } from "@/components/shared/PatientMedia";
import { RequestInfoEmailModal } from "@/components/shared/RequestInfoEmailModal";
import { PresenceDot } from "@/components/admin/doctorBits";
import { FileDrop, type Attachment } from "@/components/ui/FileDrop";
import { Modal } from "@/components/ui/Modal";
import { RagPill } from "@/components/ui/StatusPill";
import { consultationFor } from "@/lib/doctor/consultation";
import { CATEGORY_LABEL, type QueueCategory } from "@/lib/doctor/clinicians";
import {
  COMPLEX_CASES,
  ESCALATIONS,
  NEW_ORDERS,
  SIMPLE_REPEATS,
  complexCaseByRef,
  patientByRef,
  pharmacyName,
} from "@/lib/doctor/data";
import { requestInfo as recordInfoRequest } from "@/lib/doctor/info-requests";
import { heldFor, type Hold } from "@/lib/doctor/queue-claims";
import { ADMIN_SELF } from "@/lib/admin/data";
import type { Rag } from "@/lib/doctor/types";
import type { AdminDoctor } from "@/lib/admin/types";

/* ============================================================================
   A live case, read from the admin side.

   The same reading the prescriber gets — patient record and history down the
   left, the three-tab review panel on the right — so the two sides of the
   platform are never looking at differently shaped versions of one case.

   What differs is where it ends. An administrator arrives at a case to route
   it, so the footer opens on routing: take it, or send it to someone. The
   prescribing actions only appear once they have taken it, because deciding a
   case you are not the responsible clinician for is the thing this ordering
   is there to prevent. There is no Escalate on this screen — the admin is
   where a case escalates to.

   The drawer does not trap the page behind it: no scrim swallowing clicks and
   no scroll lock, so clicking another row swaps this panel to that case.
   ============================================================================ */

export function QueueCaseDrawer({
  caseRef,
  category,
  rag,
  hold,
  holder,
  mine,
  now,
  assignControl,
  onTakeIt,
  onUnassign,
  onToast,
  onClose,
}: {
  caseRef: string | null;
  category: QueueCategory;
  rag: Rag;
  hold: Hold | null;
  holder: AdminDoctor | undefined;
  /** the admin is the responsible clinician on this case */
  mine: boolean;
  now: number;
  /** the platform select, passed in so the page keeps ownership of assignment */
  assignControl: ReactNode;
  onTakeIt: () => void;
  onUnassign?: () => void;
  onToast: (message: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!caseRef) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [caseRef, onClose]);

  if (!caseRef) return null;

  return (
    // the wrapper only positions the panel — it must not intercept clicks on
    // the board behind it, which is what makes case-to-case swapping work
    <div className="pointer-events-none fixed inset-0 z-40 flex justify-end">
      <aside
        role="dialog"
        aria-label={`Case ${caseRef}`}
        className="pointer-events-auto relative flex h-full w-full max-w-[min(100vw,1060px)] flex-col border-l border-[var(--divider)] bg-background-neutral shadow-dialog"
      >
        {/* keyed so swapping cases starts clean: a half-filled prescription
            from the previous patient is the worst thing this panel could keep */}
        <CaseBody
          key={caseRef}
          caseRef={caseRef}
          category={category}
          rag={rag}
          hold={hold}
          holder={holder}
          mine={mine}
          now={now}
          assignControl={assignControl}
          onTakeIt={onTakeIt}
          onUnassign={onUnassign}
          onToast={onToast}
          onClose={onClose}
        />
      </aside>
    </div>
  );
}

type Decision = null | "issued" | "info";

function CaseBody({
  caseRef,
  category,
  rag,
  hold,
  holder,
  mine,
  now,
  assignControl,
  onTakeIt,
  onUnassign,
  onToast,
  onClose,
}: {
  caseRef: string;
  category: QueueCategory;
  rag: Rag;
  hold: Hold | null;
  holder: AdminDoctor | undefined;
  mine: boolean;
  now: number;
  assignControl: ReactNode;
  onTakeIt: () => void;
  onUnassign?: () => void;
  onToast: (message: string) => void;
  onClose: () => void;
}) {
  const order = NEW_ORDERS.find((o) => o.ref === caseRef);
  const simple = SIMPLE_REPEATS.find((r) => r.ref === caseRef);
  const escalated = ESCALATIONS.find((e) => e.ref === caseRef);
  // an escalated case is still its complex-repeat self: that is where its
  // history, AI reading and SOP citation live, and a senior answering the
  // escalation needs all three
  const complex = complexCaseByRef(caseRef) ?? COMPLEX_CASES.find((c) => c.ref === caseRef);
  const base = order ?? complex ?? simple ?? escalated;

  const ai = order?.ai ?? complex?.ai ?? null;
  const recommended = useMemo(() => (ai ? parseRecommended(ai.recommendedRx) : null), [ai]);
  const [rx, setRx] = useState<Prescription>(() =>
    recommended ?? fallbackFrom(base?.med ?? "Wegovy (semaglutide)", base?.dose ?? "0.25 mg"),
  );
  const [decision, setDecision] = useState<Decision>(null);
  const [emailing, setEmailing] = useState(false);
  const [replying, setReplying] = useState(false);

  if (!base) return null;

  // simple repeats and escalations carry no demographics of their own; the
  // consultation record fills them so the panel is never half-empty
  const answers = consultationFor(caseRef, {
    ...(order && {
      sexAtBirth: order.sex, age: order.age, bmi: order.bmi, ethnicity: order.ethnicity,
      conditions: order.comorbidities, treatmentPreference: order.preference, verification: order.verification,
      submittedAt: order.submittedAt,
    }),
    ...(complex && {
      sexAtBirth: complex.sex, age: complex.age, bmi: complex.bmi, ethnicity: complex.ethnicity,
      conditions: complex.comorbidities,
    }),
  });

  const amended = !sameAsRecommended(rx, recommended);
  const needsReason = !!ai && !amendmentReady(rx, recommended);
  const patientName = order?.patientName ?? patientByRef(caseRef)?.name ?? caseRef;

  const headline =
    order?.eligibility ?? escalated?.reason ?? complex?.flagReason ?? (simple ? `Last review ${simple.lastReview}` : "");

  const approve = () => {
    setDecision("issued");
    onToast(
      amended
        ? `${prescriptionLabel(rx)} issued on ${caseRef} — amendment and reason audit-logged`
        : `${prescriptionLabel(rx)} issued on ${caseRef} & audit-logged`,
    );
  };

  const sendInfoRequest = (subject: string, items: string[], note?: string) => {
    setEmailing(false);
    setDecision("info");
    // parks the case: it leaves the category tabs for Awaiting info, and the
    // waiting clock stops and resets — the delay is the patient's now
    recordInfoRequest(caseRef, ADMIN_SELF.name, subject, items, note);
    onToast(`Email sent to ${patientName} — "${subject}"`);
  };

  return (
    <>
      <header className="shrink-0 bg-gradient-to-r from-primary-darker via-primary-dark to-primary px-6 py-4 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">
              {CATEGORY_LABEL[category]} · {pharmacyName(base.pharmacyCode)}
            </p>
            <h2 className="mt-0.5 truncate text-lg font-bold">{caseRef}</h2>
            <p className="truncate text-sm text-white/80">
              {base.med} · {base.dose}
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

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-background-paper p-5 shadow-card">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary">{headline}</p>
            <p className="mt-0.5 text-sm text-text-secondary">
              {mine ? (
                "Yours — you're the responsible clinician on this case"
              ) : hold && holder ? (
                <span className="inline-flex items-center gap-1.5">
                  Held by
                  <PresenceDot online={holder.online} className="h-2 w-2 ring-0" />
                  <span className="font-semibold text-text-primary">{holder.name}</span>
                  {hold.kind === "reserved" ? " · reviewing now" : ` · ${heldFor(hold, now)}`}
                </span>
              ) : (
                "On the shared board — no one has claimed it"
              )}
            </p>
          </div>
          <RagPill rag={rag} />
        </div>

        {/* the prescriber's two-column reading */}
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(280px,340px)_1fr]">
          <div className="space-y-6">
            <PatientSummaryCard
              ref_={caseRef}
              nhs={base.nhs}
              age={answers.age}
              sex={answers.sexAtBirth}
              bmi={answers.bmi}
              ethnicity={answers.ethnicity}
              pharmacyCode={base.pharmacyCode}
              comorbidities={answers.conditions}
              pill={<RagPill rag={rag} />}
            />

            {escalated && (
              <div className="rounded-lg bg-background-paper p-5 shadow-card">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Why it was escalated
                </p>
                <p className="mt-2 text-base font-bold text-text-primary">{escalated.reason}</p>
                <p className="text-sm text-text-secondary">{escalated.status}</p>
              </div>
            )}

            <PatientMediaCard
              caseRef={caseRef}
              weightPhoto={order?.verification.weightPhoto ?? "Uploaded at last review"}
              idDocument={order?.verification.idDocument ?? "Verified at sign-up"}
              note={mine ? "Visually confirm the ID matches the weight photo before issuing." : undefined}
            />

            {complex && (
              <>
                <div className="rounded-lg bg-background-paper p-5 shadow-card">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Order request</p>
                  <p className="mt-2 text-base font-bold text-text-primary">{complex.orderRequest.med}</p>
                  <p className="text-sm text-text-secondary">{complex.orderRequest.detail}</p>
                  <p className="mt-1 text-sm text-text-secondary">{complex.orderRequest.meta}</p>
                </div>

                <div className="rounded-lg bg-background-paper p-5 shadow-card">
                  <p className="text-sm font-bold text-text-primary">Medication history</p>
                  <p className="text-xs text-text-secondary">
                    {complex.med} · {pharmacyName(complex.pharmacyCode)} SOP {complex.sopCitation.version}
                  </p>
                  <MedicationTimeline events={complex.history} />
                </div>
              </>
            )}
          </div>

          <ReviewPanel
            ai={ai}
            sop={complex?.sopCitation}
            caseRef={caseRef}
            answers={answers}
            noReadingBody="Simple repeats are auto-scored Green against the pharmacy SOP and signed in batch — there's no separate recommendation to read."
            // the picker is on screen either way, so what would be issued is
            // visible before anyone takes the case; it only unlocks on taking
            prescription={
              decision ? undefined : (
                <PrescriptionPicker
                  recommended={recommended}
                  recommendedText={ai?.recommendedRx ?? "no reading on this case"}
                  value={rx}
                  onChange={setRx}
                  disabled={!mine}
                />
              )
            }
            actions={
              decision === "issued" ? (
                <OutcomePanel
                  tone={amended ? "warning" : "success"}
                  title={amended ? "Amended prescription issued" : "Prescription issued"}
                  body={`${prescriptionLabel(rx)} issued to ${pharmacyName(base.pharmacyCode)}. Decision and the active SOP version recorded to the audit trail.`}
                />
              ) : decision === "info" ? (
                <OutcomePanel
                  tone="warning"
                  title="More information requested"
                  body="The case is parked on the patient — it leaves the board and the waiting clock resets until they reply."
                />
              ) : mine ? (
                <>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={approve}
                      disabled={needsReason}
                      className="flex-1 basis-40 whitespace-nowrap rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
                    >
                      {amended ? "Issue amended" : "Approve & issue"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailing(true)}
                      className="flex-1 basis-40 whitespace-nowrap rounded-lg border border-[var(--divider)] px-4 py-3 text-sm font-bold text-text-primary hover:bg-background-neutral"
                    >
                      Request more info
                    </button>
                    {/* no Escalate: this is where cases escalate to. What the
                        admin owes an escalated case is an answer to it */}
                    {escalated && (
                      <button
                        type="button"
                        onClick={() => setReplying(true)}
                        className="flex-1 basis-40 whitespace-nowrap rounded-lg border border-warning px-4 py-3 text-sm font-bold text-warning-dark hover:bg-warning-lighter"
                      >
                        Reply to escalation
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--divider)] pt-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Hand to</span>
                    <div className="min-w-[13rem] flex-1">{assignControl}</div>
                    {onUnassign && (
                      <button
                        type="button"
                        onClick={onUnassign}
                        className="text-sm font-bold text-text-secondary underline hover:text-text-primary"
                      >
                        Return to the board
                      </button>
                    )}
                  </div>
                  {needsReason && (
                    <p className="mt-3 text-xs font-semibold text-warning-dark">
                      Say why you&rsquo;re departing from the recommendation before issuing.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={onTakeIt}
                      className="shrink-0 whitespace-nowrap rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark"
                    >
                      Take it
                    </button>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                      {hold ? "Move to" : "Send to"}
                    </span>
                    <div className="min-w-[13rem] flex-1">{assignControl}</div>
                    {hold && onUnassign && (
                      <button
                        type="button"
                        onClick={onUnassign}
                        className="text-sm font-bold text-text-secondary underline hover:text-text-primary"
                      >
                        Return to the board
                      </button>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-text-secondary">
                    Take it to become the responsible clinician and unlock the decision, or route it to someone who can
                    make it.
                  </p>
                </>
              )
            }
          />
        </div>
      </div>

      <RequestInfoEmailModal
        open={emailing}
        onClose={() => setEmailing(false)}
        onSend={({ subject, items, note }) => sendInfoRequest(subject, items, note)}
        patientName={patientName}
        sex={answers.sexAtBirth === "Male" || answers.sexAtBirth === "Female" ? answers.sexAtBirth : undefined}
        caseRef={caseRef}
        senderName={ADMIN_SELF.name}
        senderRole={`Clinical Lead · GMC ${ADMIN_SELF.gmc}`}
      />

      {escalated && (
        <ReplyToEscalationModal
          open={replying}
          caseRef={caseRef}
          reason={escalated.reason}
          pharmacy={pharmacyName(base.pharmacyCode)}
          onClose={() => setReplying(false)}
          onSend={(files) => {
            setReplying(false);
            onToast(
              files.length
                ? `Reply sent on ${caseRef} with ${files.length} attachment${files.length === 1 ? "" : "s"}`
                : `Reply sent on ${caseRef}`,
            );
          }}
        />
      )}
    </>
  );
}

/**
 * The senior's answer back to the prescriber who raised the escalation.
 *
 * It is guidance, not a decision — the case stays where it is and the reply
 * goes on the audit trail with whatever the senior attached to support it.
 */
function ReplyToEscalationModal({
  open,
  caseRef,
  reason,
  pharmacy,
  onClose,
  onSend,
}: {
  open: boolean;
  caseRef: string;
  reason: string;
  pharmacy: string;
  onClose: () => void;
  onSend: (files: Attachment[]) => void;
}) {
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);

  return (
    <Modal
      open={open}
      size="lg"
      title="Reply to escalation"
      subtitle={`${caseRef} · ${pharmacy} · ${reason}`}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-background-neutral"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!note.trim()}
            onClick={() => {
              onSend(files);
              setNote("");
              setFiles([]);
            }}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
          >
            Send reply
          </button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-text-secondary">
        Goes back to the prescriber who raised it, against the active SOP version. Attach anything they need to act on
        it — a specialist letter, a protocol extract, a lab report.
      </p>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-bold text-text-secondary">Your guidance</span>
        <textarea
          rows={5}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. hold at the current dose for a further 4 weeks and re-screen for GI tolerance before escalating again…"
          className="w-full rounded-lg border border-[var(--divider)] p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-main-24"
        />
      </label>

      <div className="mt-4">
        <FileDrop files={files} onChange={setFiles} label="Supporting documents (optional)" />
      </div>
    </Modal>
  );
}
