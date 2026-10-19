"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { OUTCOME_SUMMARY, type ReadingOutcome } from "@/lib/doctor/reading-outcome";

/* ============================================================================
   The pieces every review surface repeats.

   New orders, complex repeats, simple repeats and the admin's drawer are four
   readings of the same thing, so they were four copies of the same cards and
   the same dialog. Copies drift: the escalation dialog was red on one screen
   and amber on the others long after a doctor stopped being able to decline.
   ============================================================================ */

/** What the patient asked for, in the slot every review screen puts it in. */
export function OrderRequestCard({
  med,
  detail,
  meta,
  children,
}: {
  med: string;
  /** "2.5 mg · self-requested new start" */
  detail: string;
  /** "Willowbrook Pharmacy · submitted 10:24 today" */
  meta: string;
  /** anything that hangs off the request, e.g. the patient's preference */
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-background-paper p-5 shadow-card">
      <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Order request</p>
      <p className="mt-2 text-base font-bold text-text-primary">{med}</p>
      <p className="text-sm text-text-secondary">{detail}</p>
      <p className="mt-1 text-sm text-text-secondary">{meta}</p>
      {children}
    </div>
  );
}

/**
 * Hand the case to a senior.
 *
 * The only way out of a case a prescriber will not issue — they cannot
 * decline, so this dialog is never a rejection and is never styled as one.
 */
export function EscalateModal({
  open,
  caseRef,
  pharmacy,
  what = "case",
  onClose,
  onConfirm,
}: {
  open: boolean;
  caseRef: string;
  pharmacy: string;
  /** "order", "repeat" — what the sentence should call it */
  what?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      title="Escalate to senior review"
      subtitle={`${caseRef} · ${pharmacy}`}
      onClose={onClose}
    >
      <p className="text-sm text-text-secondary">
        This {what} will be removed from your queue and routed to senior clinical review. Add an optional note for the
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
          onClick={onClose}
          className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-background-neutral"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-warning-dark px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
        >
          Confirm escalation
        </button>
      </div>
    </Modal>
  );
}

/**
 * Why a case is with a senior, and what they were actually asked.
 *
 * The reason says which rule caught it; the note is the prescriber's own
 * question, and it is the thing the senior is there to answer. Losing the
 * question with the escalations page would have left the senior reading a
 * rule citation and guessing what the doubt was.
 */
export function EscalationReasonCard({
  reason,
  escalatedBy,
  status,
  note,
}: {
  reason: string;
  escalatedBy: string;
  status: string;
  note?: string;
}) {
  return (
    <div className="rounded-lg bg-background-paper p-5 shadow-card">
      <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Why it was escalated</p>
      <p className="mt-2 text-base font-bold text-text-primary">{reason}</p>
      <p className="text-sm text-text-secondary">
        Raised by {escalatedBy} · {status.toLowerCase()}
      </p>
      {note && (
        <div className="mt-3 flex gap-2.5 rounded-lg bg-background-neutral px-4 py-3 text-sm text-text-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-text-disabled" aria-hidden>
            <path d="M4 5h16v11H8l-4 4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          <span>
            <span className="font-semibold">Question from the prescriber: </span>
            {note}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Shown in the prescription's place when the reading does not end in one.
 *
 * Discontinuing, holding a cycle and sending a case to a senior all mean the
 * patient does not get what they asked for, and that is a senior's call — a
 * prescriber escalates instead. Before this the screen simply pre-selected
 * whatever the patient had requested, so the reading's own outcome was the
 * one thing nobody could choose, and prescribing against it was the path of
 * least resistance.
 */
export function SeniorOnlyNotice({
  outcome,
  recommendedText,
  disabled,
  senior,
  onIssueInstead,
}: {
  outcome: ReadingOutcome;
  /** the AI's own words, so "act on what?" is answered on the screen */
  recommendedText: string;
  disabled?: boolean;
  /** the reader can act on this reading themselves — no escalating to do */
  senior?: boolean;
  onIssueInstead: () => void;
}) {
  return (
    <div className="rounded-lg bg-background-neutral px-4 py-4 ring-1 ring-[var(--divider)]">
      <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Recommended action</p>
      <p className="mt-2 text-base font-bold text-text-primary">{recommendedText}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
        {senior ? (
          <>The reading is to {OUTCOME_SUMMARY[outcome] ?? "issue nothing"}. Acting on it is below.</>
        ) : (
          <>
            The reading is to {OUTCOME_SUMMARY[outcome] ?? "issue nothing"}, which is a senior&rsquo;s decision, not
            yours. Escalate it below — that is agreeing with the reading, not passing it on.
          </>
        )}
      </p>
      <button
        type="button"
        onClick={onIssueInstead}
        disabled={disabled}
        className="mt-3 rounded-lg border border-[var(--divider)] bg-background-paper px-4 py-2 text-sm font-bold text-text-primary hover:bg-background-neutral disabled:opacity-40"
      >
        Prescribe anyway
      </button>
      <p className="mt-1.5 text-xs text-text-secondary">
        Issuing against the reading is yours to make — it asks for a reason and goes on the audit trail.
      </p>
    </div>
  );
}

/** The three decision buttons, in the one order they appear in everywhere. */
export function DecisionButtons({
  amended,
  disabled,
  escalateFirst,
  onApprove,
  onRequestInfo,
  onEscalate,
  extra,
}: {
  amended: boolean;
  disabled?: boolean;
  /**
   * The reading does not end in a prescription, so escalating is the agreeing
   * answer and gets the weight. Nothing is selected to issue, so no issue
   * button is offered until the prescriber asks for one.
   */
  escalateFirst?: boolean;
  onApprove: () => void;
  onRequestInfo: () => void;
  /** omitted where there is nobody to escalate to — the admin is the senior */
  onEscalate?: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {!escalateFirst && (
        <button
          type="button"
          onClick={onApprove}
          disabled={disabled}
          className="flex-1 basis-40 whitespace-nowrap rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
        >
          {amended ? "Issue amended" : "Approve & issue"}
        </button>
      )}
      {escalateFirst && onEscalate && (
        <button
          type="button"
          onClick={onEscalate}
          className="flex-1 basis-40 whitespace-nowrap rounded-lg bg-warning-dark px-4 py-3 text-sm font-bold text-white hover:opacity-90"
        >
          Escalate to senior
        </button>
      )}
      <button
        type="button"
        onClick={onRequestInfo}
        className="flex-1 basis-40 whitespace-nowrap rounded-lg border border-[var(--divider)] px-4 py-3 text-sm font-bold text-text-primary hover:bg-background-neutral"
      >
        Request more info
      </button>
      {!escalateFirst && onEscalate && (
        <button
          type="button"
          onClick={onEscalate}
          className="flex-1 basis-40 whitespace-nowrap rounded-lg border border-warning px-4 py-3 text-sm font-bold text-warning-dark hover:bg-warning-lighter"
        >
          Escalate
        </button>
      )}
      {extra}
    </div>
  );
}
