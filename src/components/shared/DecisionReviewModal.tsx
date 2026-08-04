"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { RagPill } from "@/components/ui/StatusPill";
import { pharmacyName } from "@/lib/doctor/data";
import {
  OUTCOME_META,
  type PastRequest,
  type RequestOutcome,
} from "@/lib/shared/request-history";
import { addRevision, stampNow, type Revision } from "@/lib/shared/request-revisions";

/* ============================================================================
   Open a past decision, read the full record, and overturn it if the clinical
   picture has changed — decline something that was approved, or approve a
   decline. Nothing is rewritten: the revision is appended with a mandatory
   reason and the original stays visible underneath.
   ============================================================================ */

const ORDER: RequestOutcome[] = ["approved", "declined", "info", "escalated"];

/** Reversing an issued approval has a real-world tail — say so out loud. */
function consequence(from: RequestOutcome, to: RequestOutcome): string | null {
  if (from === "approved" && to !== "approved")
    return "The prescription was already issued. The pharmacy is notified to halt dispensing, and the patient is told their treatment is on hold.";
  if (from !== "approved" && to === "approved")
    return "The prescription is issued to the pharmacy and the patient is notified that treatment can start.";
  return null;
}

export function DecisionReviewModal({
  request,
  current,
  history,
  actor,
  onClose,
}: {
  request: PastRequest | null;
  /** outcome as it stands today — may already differ from request.outcome */
  current: RequestOutcome;
  history: Revision[];
  actor: string;
  onClose: () => void;
}) {
  // the caller keys this component by ref, so opening another row remounts it
  // with a clean form — no state to reset on the way in
  const [next, setNext] = useState<RequestOutcome | null>(null);
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState(false);

  if (!request) return null;

  const submit = () => {
    if (!next || reason.trim().length < 10) return;
    addRevision({
      ref: request.ref,
      from: current,
      to: next,
      reason: reason.trim(),
      by: actor,
      on: stampNow(),
    });
    setSaved(true);
  };

  const note = next ? consequence(current, next) : null;

  return (
    <Modal
      open
      title={`${request.ref} — ${request.patientName}`}
      subtitle={`${request.med} · ${request.dose} · ${request.category}`}
      onClose={onClose}
    >
      {/* the record as decided */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-background-neutral p-4 text-sm">
        <Field label="Decided by">{request.decidedBy}</Field>
        <Field label="Decided on">{request.decidedOn}</Field>
        <Field label="Pharmacy">{pharmacyName(request.pharmacyCode)}</Field>
        <Field label="SOP in force">
          <span className="font-mono">{request.sopVersion}</span>
        </Field>
        <Field label="Original outcome">
          <span className="inline-flex items-center gap-2">
            <Pill outcome={request.outcome} />
            <RagPill rag={request.rag} />
          </span>
        </Field>
        <Field label="Stands today">
          <Pill outcome={current} />
        </Field>
        {request.note && (
          <div className="col-span-2">
            <dt className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Clinical note</dt>
            <dd className="mt-0.5 text-sm italic text-text-primary">{request.note}</dd>
          </div>
        )}
      </dl>

      {/* every overturn so far */}
      {history.length > 0 && (
        <ol className="mt-4 space-y-2 border-l-2 border-[var(--divider)] pl-4">
          {history.map((h, i) => (
            <li key={i} className="text-sm">
              <p className="text-text-primary">
                <span className="font-semibold">{OUTCOME_META[h.from].label}</span> →{" "}
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

      {saved ? (
        <div className="mt-5 rounded-lg bg-success-lighter p-4">
          <p className="text-sm font-bold text-success-darker">Decision revised</p>
          <p className="mt-1 text-sm text-success-dark">
            Recorded against {request.ref} as a new audit entry, signed {actor}. The original decision stays on the record.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
          >
            Done
          </button>
        </div>
      ) : (
        <>
          <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
            Revise to
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ORDER.filter((o) => o !== current).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setNext(o)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  next === o
                    ? "border-primary bg-primary-lighter text-primary-darker"
                    : "border-[var(--divider)] text-text-primary hover:bg-background-neutral"
                }`}
              >
                {OUTCOME_META[o].label}
              </button>
            ))}
          </div>

          {note && (
            <p className="mt-3 rounded-lg bg-warning-lighter px-3 py-2 text-sm text-warning-darker">{note}</p>
          )}

          <label className="mt-4 block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Reason for overturning
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="What changed — new evidence, a misread value, an SOP update…"
              className="mt-1 w-full rounded-lg border border-[var(--divider)] p-3 text-sm focus:border-primary focus:outline-none"
            />
            <span className="text-xs text-text-secondary">
              Required — this is what an auditor reads next to the original decision.
            </span>
          </label>

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-background-neutral"
            >
              Close
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!next || reason.trim().length < 10}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
            >
              Record revision
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{label}</dt>
      <dd className="mt-0.5 text-text-primary">{children}</dd>
    </div>
  );
}

function Pill({ outcome }: { outcome: RequestOutcome }) {
  const m = OUTCOME_META[outcome];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${m.cls}`}>{m.label}</span>
  );
}
