"use client";

import { useEffect, useState } from "react";
import { PatientSummaryCard } from "@/components/doctor/PatientSummaryCard";
import { PrescriptionPicker, fallbackFrom, type Prescription } from "@/components/doctor/PrescriptionPicker";
import { ReviewPanel } from "@/components/doctor/ReviewPanel";
import { PatientMediaCard } from "@/components/shared/PatientMedia";
import { RagPill } from "@/components/ui/StatusPill";
import { consultationFor } from "@/lib/doctor/consultation";
import { pharmacyName } from "@/lib/doctor/data";
import { liveCases } from "@/lib/shared/live-cases";
import {
  OUTCOME_META,
  type PastRequest,
  type RequestOutcome,
} from "@/lib/shared/request-history";
import { addRevision, stampNow, type Revision } from "@/lib/shared/request-revisions";

/* ============================================================================
   A decided request, reopened.

   Built on the same frame as the queue's case drawer — patient record down a
   scrolling left rail, the three-tab panel filling the right, actions pinned
   across the bottom — because it is the same case, read later. It used to be
   its own layout, so moving between the live board and the log meant
   relearning where the record lives.

   What differs is the footer and the lock. The outcomes are the three a
   closed case can move to, and the prescription opens read-only: this screen
   exists to read a decision, and changing what was dispensed is a revision,
   not a glance.
   ============================================================================ */

const REVISABLE: RequestOutcome[] = ["approved", "declined", "info"];

/** Reversing an issued approval has a real-world tail — say so out loud. */
function consequence(from: RequestOutcome, to: RequestOutcome): string | null {
  if (from === "approved" && to !== "approved")
    return "The prescription was already issued. The pharmacy is notified to halt dispensing, and the patient is told their treatment is on hold.";
  if (from !== "approved" && to === "approved")
    return "The prescription is issued to the pharmacy and the patient is notified that treatment can start.";
  return null;
}

export function RequestReviewDrawer({
  request,
  current,
  history,
  actor,
  onClose,
  onRequestInfo,
}: {
  request: PastRequest | null;
  /** outcome as it stands today — may already differ from request.outcome */
  current: RequestOutcome;
  history: Revision[];
  actor: string;
  onClose: () => void;
  /** hands off to the shared email composer rather than a bare status flip */
  onRequestInfo: (r: PastRequest) => void;
}) {
  const [next, setNext] = useState<RequestOutcome | null>(null);
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState(false);
  /**
   * What was dispensed, editable only once a revision is under way. Reading a
   * decision is the common case; changing the script is not something to be
   * one stray click away from.
   */
  const [rx, setRx] = useState<Prescription>(() =>
    fallbackFrom(request?.med ?? "Wegovy (semaglutide)", request?.dose ?? "0.25 mg"),
  );

  useEffect(() => {
    if (!request) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [request, onClose]);

  if (!request) return null;
  const r = request;
  const note = next ? consequence(current, next) : null;

  const submit = () => {
    if (!next || reason.trim().length < 10) return;
    addRevision({ ref: r.ref, from: current, to: next, reason: reason.trim(), by: actor, on: stampNow() });
    setSaved(true);
  };

  const answers = consultationFor(r.ref, { submittedAt: r.decidedOn });
  // the NHS number lives on the live case, if this patient still has one on
  // the board; a closed request does not carry it
  const nhs = liveCases().find((c) => c.ref === r.patientRef)?.nhs;
  const revising = next !== null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex justify-end">
      <aside
        role="dialog"
        aria-label={`Decision review ${r.ref}`}
        className="pointer-events-auto relative flex h-full w-full max-w-[min(100vw,1060px)] flex-col border-l border-[var(--divider)] bg-background-neutral shadow-dialog"
      >
        <header className="shrink-0 bg-gradient-to-r from-primary-darker via-primary-dark to-primary px-6 py-4 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">
                Decided request · {r.category}
              </p>
              <h2 className="mt-0.5 truncate text-lg font-bold">
                {r.ref} — {r.patientName}
              </h2>
              <p className="truncate text-sm text-white/80">
                {r.med} · {r.dose}
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

        {/* the queue drawer's two columns: the rail scrolls, the panel fills
            the rest and scrolls inside itself */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6 lg:flex lg:flex-col lg:overflow-hidden">
          <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(280px,340px)_1fr]">
            <div className="space-y-6 lg:-mx-1 lg:h-full lg:overflow-y-auto lg:px-1 lg:pb-1">
              <PatientSummaryCard
                ref_={r.ref}
                nhs={nhs ?? "—"}
                age={answers.age}
                sex={answers.sexAtBirth}
                bmi={answers.bmi}
                ethnicity={answers.ethnicity}
                pharmacyCode={r.pharmacyCode}
                comorbidities={answers.conditions}
                pill={<RagPill rag={r.rag} label={`${OUTCOME_META[current].short} · ${r.rag === "green" ? "Green" : r.rag === "amber" ? "Amber" : "Red"}`} />}
              />

              {/* the decision as it was taken */}
              <div className="rounded-lg bg-background-paper p-5 shadow-card">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">How it was decided</p>
                <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  <Field label="Decided by">{r.decidedBy}</Field>
                  <Field label="Decided on">{r.decidedOn}</Field>
                  <Field label="Pharmacy">{pharmacyName(r.pharmacyCode)}</Field>
                  <Field label="SOP in force">
                    <span className="font-mono">{r.sopVersion}</span>
                  </Field>
                </dl>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--divider)] pt-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Original</span>
                  <Pill outcome={r.outcome} />
                  {current !== r.outcome && (
                    <>
                      <span className="text-text-disabled">&rarr;</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Today</span>
                      <Pill outcome={current} />
                    </>
                  )}
                </div>
                {r.note && <p className="mt-3 text-sm italic text-text-secondary">&ldquo;{r.note}&rdquo;</p>}
              </div>

              {history.length > 0 && (
                <ol className="space-y-3 rounded-lg bg-background-paper p-5 shadow-card">
                  <p className="text-sm font-bold text-text-primary">Revision history</p>
                  {history.map((h, i) => (
                    <li key={i} className="border-l-2 border-[var(--divider)] pl-4 text-sm">
                      <p className="text-text-primary">
                        <span className="font-semibold">{OUTCOME_META[h.from].label}</span> &rarr;{" "}
                        <span className="font-semibold">{OUTCOME_META[h.to].label}</span>
                      </p>
                      <p className="text-xs text-text-secondary">
                        {h.by} · {h.on}
                      </p>
                      <p className="mt-0.5 text-sm text-text-secondary">{h.reason}</p>
                    </li>
                  ))}
                </ol>
              )}

              <PatientMediaCard
                caseRef={r.ref}
                weightPhoto={`Uploaded ${r.decidedOn.split(" · ")[0]}`}
                idDocument="Verified at sign-up"
              />
            </div>

            <div className="lg:h-full lg:min-h-0">
              <ReviewPanel
                ai={null}
                noReadingTitle="The reading is not kept with a closed decision"
                noReadingBody="What stands on the record is the outcome, who signed it and the SOP version in force — all on the left. The prescription below is what was dispensed."
                caseRef={r.ref}
                answers={answers}
                prescription={
                  <>
                    <PrescriptionPicker
                      recommended={null}
                      recommendedText={`${r.med} ${r.dose}`}
                      value={rx}
                      onChange={setRx}
                      disabled={!revising}
                    />
                    {!revising && (
                      <p className="mt-2 text-xs text-text-secondary">
                        Read-only. Pick an outcome under <span className="font-semibold">Revise to</span> to change what
                        was dispensed.
                      </p>
                    )}
                  </>
                }
              />
            </div>
          </div>
        </div>

        <footer
          className="shrink-0 border-t border-[var(--divider)] bg-background-paper px-6 py-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {saved ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-success-dark">
                <span className="font-bold">Decision revised.</span> Recorded against {r.ref}, signed {actor} — the
                original stays on the record.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Revise to</span>
                {REVISABLE.filter((o) => o !== current).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => (o === "info" ? onRequestInfo(r) : setNext(o))}
                    className={`h-10 rounded-lg border px-4 text-sm font-bold transition-colors ${
                      next === o
                        ? "border-primary bg-primary-lighter text-primary-darker"
                        : "border-[var(--divider)] text-text-primary hover:bg-background-neutral"
                    }`}
                  >
                    {OUTCOME_META[o].label}
                  </button>
                ))}
                <span className="ml-auto text-xs text-text-secondary">
                  Revisions are appended — the original decision is never overwritten.
                </span>
              </div>

              {note && (
                <p className="mt-3 rounded-lg bg-warning-lighter px-3 py-2 text-sm text-warning-darker">{note}</p>
              )}

              {next && (
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <label className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                      Reason for overturning
                    </span>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="What changed — new evidence, a misread value, an SOP update…"
                      className="mt-1 h-11 w-full rounded-lg border border-[var(--divider)] px-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={reason.trim().length < 10}
                    className="h-11 shrink-0 rounded-lg bg-primary px-5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
                  >
                    Record revision
                  </button>
                </div>
              )}
            </>
          )}
        </footer>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-text-primary">{children}</dd>
    </div>
  );
}

function Pill({ outcome }: { outcome: RequestOutcome }) {
  const m = OUTCOME_META[outcome];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${m.cls}`}>{m.label}</span>
  );
}
